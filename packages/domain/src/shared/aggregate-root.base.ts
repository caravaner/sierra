import { Entity } from "./entity.base";
import type { DomainEvent } from "./domain-event.base";

export abstract class AggregateRoot<T> extends Entity<T> {
  private readonly _domainEvents: ReadonlyArray<DomainEvent>;

  constructor(id: string, props: T, events: ReadonlyArray<DomainEvent> = []) {
    super(id, props);
    this._domainEvents = events;
  }

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  clearEvents(): this {
    return this.reconstruct(this.id, this.props, []);
  }

  protected addEvent(nextProps: T, event: DomainEvent): this {
    return this.reconstruct(this.id, nextProps, [...this._domainEvents, event]);
  }

  protected abstract reconstruct(
    id: string,
    props: T,
    events: ReadonlyArray<DomainEvent>,
  ): this;
}
