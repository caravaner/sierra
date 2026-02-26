import type { PrismaClient } from "@sierra/db";
import type {
  UnitOfWork,
  CommandMeta,
  UowRepository,
  AggregateRoot,
  DomainEvent,
} from "@sierra/domain";
import { ConcurrentModificationError } from "@sierra/domain";
import { makeLogger } from "@sierra/logger";
import { flushOutbox } from "../eventlog/flush-outbox";

interface TrackedEntry {
  entity: AggregateRoot<unknown>;
  repo: UowRepository<unknown>;
}

export class PrismaUnitOfWork implements UnitOfWork {
  private readonly _tracked = new Map<string, TrackedEntry>();

  constructor(private readonly prisma: PrismaClient) {}

  track(entity: AggregateRoot<unknown>, repo: UowRepository<unknown>): void {
    this._tracked.set(entity.id, { entity, repo });
  }

  async commit(commandMeta: CommandMeta): Promise<void> {
    const log = makeLogger({
      commandName: commandMeta.commandName,
      commandId: commandMeta.commandId,
      principal: commandMeta.principalId,
    });

    const entries = Array.from(this._tracked.values());
    const allEvents: DomainEvent[] = entries.flatMap(
      (e) => [...e.entity.domainEvents] as DomainEvent[],
    );

    log.info({ aggregates: entries.length, events: allEvents.length }, "uow.commit.start");
    const t0 = Date.now();

    try {
      // Step A: persist business state + stage events in outbox (atomic)
      await this.prisma.$transaction(async (tx) => {
        for (const { entity, repo } of entries) {
          await repo.saveWithTx(tx, entity);
        }

        if (allEvents.length > 0) {
          await tx.outbox.createMany({
            data: allEvents.map((ev) => ({
              payload: {
                eventId: ev.eventId,
                aggregateId: ev.aggregateId,
                aggregateType: ev.aggregateType,
                eventType: ev.eventType,
                principalId: ev.principalId,
                commandName: commandMeta.commandName,
                commandId: commandMeta.commandId,
                payload: ev.payload as object,
                occurredAt: ev.occurredAt.toISOString(),
              },
            })),
          });
        }
      });
    } catch (err) {
      if (err instanceof ConcurrentModificationError) {
        log.warn({ err: err.message, durationMs: Date.now() - t0 }, "uow.commit.conflict");
      } else {
        log.error({ err, durationMs: Date.now() - t0 }, "uow.commit.error");
      }
      throw err;
    }

    // Step B: flush outbox → eventlog (outside main tx; failure here is safe,
    // the outbox row stays unflushed and can be retried by a background worker)
    try {
      await flushOutbox(this.prisma, log);
    } catch (err) {
      log.error({ err }, "uow.outbox.flush.error");
      // intentionally not re-throwing — business tx already committed
    }

    log.info({ durationMs: Date.now() - t0 }, "uow.commit.ok");
    this._tracked.clear();
  }
}
