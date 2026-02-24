import { DomainEvent } from "../shared/domain-event.base";

export interface SubscriptionCreatedPayload {
  customerId: string;
  intervalDays: number;
  nextDeliveryAt: Date;
  items: { productId: string; name: string; quantity: number; unitPrice: number }[];
}

export class SubscriptionCreatedEvent extends DomainEvent<SubscriptionCreatedPayload> {
  constructor(aggregateId: string, principalId: string, payload: SubscriptionCreatedPayload) {
    super(aggregateId, "Subscription", "Subscription.Created", principalId, payload);
  }
}

export class SubscriptionPausedEvent extends DomainEvent<Record<string, never>> {
  constructor(aggregateId: string, principalId: string) {
    super(aggregateId, "Subscription", "Subscription.Paused", principalId, {});
  }
}

export class SubscriptionResumedEvent extends DomainEvent<Record<string, never>> {
  constructor(aggregateId: string, principalId: string) {
    super(aggregateId, "Subscription", "Subscription.Resumed", principalId, {});
  }
}

export class SubscriptionCancelledEvent extends DomainEvent<Record<string, never>> {
  constructor(aggregateId: string, principalId: string) {
    super(aggregateId, "Subscription", "Subscription.Cancelled", principalId, {});
  }
}
