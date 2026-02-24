import { AggregateRoot } from "../shared/aggregate-root.base";
import type { DomainEvent } from "../shared/domain-event.base";
import type {
  SubscriptionItem,
  SubscriptionStatusType,
  SubscriptionShippingAddress,
} from "./subscription.value-objects";
import {
  SubscriptionCreatedEvent,
  SubscriptionPausedEvent,
  SubscriptionResumedEvent,
  SubscriptionCancelledEvent,
} from "./subscription.events";

interface SubscriptionProps {
  customerId: string;
  intervalDays: number;
  status: SubscriptionStatusType;
  nextDeliveryAt: Date;
  items: SubscriptionItem[];
  shippingAddress: SubscriptionShippingAddress;
  createdAt: Date;
  updatedAt: Date;
}

export class Subscription extends AggregateRoot<SubscriptionProps> {
  get customerId() { return this.props.customerId; }
  get intervalDays() { return this.props.intervalDays; }
  get status() { return this.props.status; }
  get nextDeliveryAt() { return this.props.nextDeliveryAt; }
  get items() { return this.props.items; }
  get shippingAddress() { return this.props.shippingAddress; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  protected reconstruct(id: string, props: SubscriptionProps, events: ReadonlyArray<DomainEvent>): this {
    return new Subscription(id, props, events) as this;
  }

  static create(principalId: string, params: {
    id: string;
    customerId: string;
    intervalDays: number;
    nextDeliveryAt: Date;
    items: SubscriptionItem[];
    shippingAddress: SubscriptionShippingAddress;
  }): Subscription {
    if (params.items.length === 0) throw new Error("Subscription must have at least one item");
    if (params.intervalDays < 1) throw new Error("Interval must be at least 1 day");

    const now = new Date();
    const props: SubscriptionProps = {
      customerId: params.customerId,
      intervalDays: params.intervalDays,
      status: "ACTIVE",
      nextDeliveryAt: params.nextDeliveryAt,
      items: params.items,
      shippingAddress: params.shippingAddress,
      createdAt: now,
      updatedAt: now,
    };

    const event = new SubscriptionCreatedEvent(params.id, principalId, {
      customerId: params.customerId,
      intervalDays: params.intervalDays,
      nextDeliveryAt: params.nextDeliveryAt,
      items: params.items.map((i) => i.value),
    });

    return new Subscription(params.id, props, [event]);
  }

  static reconstitute(params: {
    id: string;
    customerId: string;
    intervalDays: number;
    status: SubscriptionStatusType;
    nextDeliveryAt: Date;
    items: SubscriptionItem[];
    shippingAddress: SubscriptionShippingAddress;
    createdAt: Date;
    updatedAt: Date;
  }): Subscription {
    return new Subscription(params.id, {
      customerId: params.customerId,
      intervalDays: params.intervalDays,
      status: params.status,
      nextDeliveryAt: params.nextDeliveryAt,
      items: params.items,
      shippingAddress: params.shippingAddress,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
    });
  }

  pause(principalId: string): Subscription {
    if (this.props.status !== "ACTIVE") throw new Error("Only active subscriptions can be paused");
    return this.addEvent(
      { ...this.props, status: "PAUSED", updatedAt: new Date() },
      new SubscriptionPausedEvent(this.id, principalId),
    );
  }

  resume(principalId: string): Subscription {
    if (this.props.status !== "PAUSED") throw new Error("Only paused subscriptions can be resumed");
    return this.addEvent(
      { ...this.props, status: "ACTIVE", updatedAt: new Date() },
      new SubscriptionResumedEvent(this.id, principalId),
    );
  }

  cancel(principalId: string): Subscription {
    if (this.props.status === "CANCELLED") throw new Error("Subscription is already cancelled");
    return this.addEvent(
      { ...this.props, status: "CANCELLED", updatedAt: new Date() },
      new SubscriptionCancelledEvent(this.id, principalId),
    );
  }

  advanceNextDelivery(): Subscription {
    const next = new Date(this.props.nextDeliveryAt);
    next.setDate(next.getDate() + this.props.intervalDays);
    return this.reconstruct(this.id, { ...this.props, nextDeliveryAt: next, updatedAt: new Date() }, this.domainEvents);
  }
}
