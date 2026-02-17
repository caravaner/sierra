import { DomainEvent } from "../shared/domain-event.base";
import type { OrderStatusType, OrderItemProps, ShippingAddressProps } from "./order.value-objects";

export interface OrderPlacedPayload {
  customerId: string;
  items: OrderItemProps[];
  shippingAddress: ShippingAddressProps;
  totalAmount: number;
}

export class OrderPlacedEvent extends DomainEvent<OrderPlacedPayload> {
  constructor(aggregateId: string, principalId: string, payload: OrderPlacedPayload) {
    super(aggregateId, "Order", "Order.Placed", principalId, payload);
  }
}

export interface OrderStatusChangedPayload {
  before: OrderStatusType;
  after: OrderStatusType;
}

export class OrderStatusChangedEvent extends DomainEvent<OrderStatusChangedPayload> {
  constructor(aggregateId: string, principalId: string, payload: OrderStatusChangedPayload) {
    super(aggregateId, "Order", "Order.StatusChanged", principalId, payload);
  }
}

export class OrderCancelledEvent extends DomainEvent<{ previousStatus: OrderStatusType }> {
  constructor(aggregateId: string, principalId: string, payload: { previousStatus: OrderStatusType }) {
    super(aggregateId, "Order", "Order.Cancelled", principalId, payload);
  }
}
