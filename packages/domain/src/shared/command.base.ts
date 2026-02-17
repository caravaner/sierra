import type { Principal } from "./principal";
import type { UnitOfWork } from "./unit-of-work";

export abstract class Command<TParams, TResult> {
  public readonly id: string = crypto.randomUUID();
  public readonly timestamp: Date = new Date();

  constructor(protected readonly uow: UnitOfWork) {}

  abstract execute(principal: Principal, params: TParams): Promise<TResult>;
}
