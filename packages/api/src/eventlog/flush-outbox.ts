import type { PrismaClient } from "@sierra/db";
import { type Logger, logger as rootLogger } from "@sierra/logger";

export async function flushOutbox(
  prisma: PrismaClient,
  log: Logger = rootLogger,
): Promise<void> {
  const pending = await prisma.outbox.findMany({ where: { flushedAt: null } });
  if (pending.length === 0) return;

  await prisma.domainEvent.createMany({
    data: pending.map((row) => {
      const ev = row.payload as Record<string, unknown>;
      return {
        eventId: ev.eventId as string,
        aggregateId: ev.aggregateId as string,
        aggregateType: ev.aggregateType as string,
        eventType: ev.eventType as string,
        principalId: ev.principalId as string,
        commandName: (ev.commandName as string | undefined) ?? null,
        commandId: (ev.commandId as string | undefined) ?? null,
        payload: ev.payload as object,
        occurredAt: new Date(ev.occurredAt as string),
      };
    }),
    skipDuplicates: true,
  });

  await prisma.outbox.updateMany({
    where: { id: { in: pending.map((r) => r.id) } },
    data: { flushedAt: new Date() },
  });

  log.info({ count: pending.length }, "outbox.flushed");
}
