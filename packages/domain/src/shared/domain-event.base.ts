export abstract class DomainEvent<TPayload = unknown> {
  public readonly eventId: string;
  public readonly occurredAt: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly aggregateType: string,
    public readonly eventType: string,
    public readonly principalId: string,
    public readonly payload: TPayload,
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date();
  }
}
