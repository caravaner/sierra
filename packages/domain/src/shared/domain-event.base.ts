export abstract class DomainEvent {
  public readonly occurredAt: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly eventType: string,
  ) {
    this.occurredAt = new Date();
  }
}
