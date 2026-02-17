import type { PrismaClient } from "@sierra/db";
import type {
  UnitOfWork,
  CommandMeta,
  UowRepository,
  AggregateRoot,
  DomainEvent,
} from "@sierra/domain";

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
    const entries = Array.from(this._tracked.values());
    const allEvents: DomainEvent[] = entries.flatMap(
      (e) => [...e.entity.domainEvents] as DomainEvent[],
    );

    await this.prisma.$transaction(async (tx) => {
      // 1. Save all tracked aggregates
      for (const { entity, repo } of entries) {
        await repo.saveWithTx(tx, entity);
      }

      // 2. Bulk-insert domain events with command metadata
      if (allEvents.length > 0) {
        await tx.domainEvent.createMany({
          data: allEvents.map((ev) => ({
            eventId: ev.eventId,
            aggregateId: ev.aggregateId,
            aggregateType: ev.aggregateType,
            eventType: ev.eventType,
            principalId: ev.principalId,
            commandName: commandMeta.commandName,
            commandId: commandMeta.commandId,
            payload: ev.payload as object,
            occurredAt: ev.occurredAt,
          })),
        });
      }
    });

    this._tracked.clear();
  }
}
