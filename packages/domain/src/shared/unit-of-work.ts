import type { AggregateRoot } from "./aggregate-root.base";

export interface UnitOfWork {
  track(entity: AggregateRoot<unknown>, repo: UowRepository<unknown>): void;
  commit(commandMeta: CommandMeta): Promise<void>;
}

export interface CommandMeta {
  commandName: string;
  commandId: string;
  principalId: string;
  timestamp: Date;
}

export interface UowRepository<T> {
  saveWithTx(tx: unknown, entity: T): Promise<T>;
}
