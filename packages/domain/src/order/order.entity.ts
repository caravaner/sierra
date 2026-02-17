import { AggregateRoot } from "../shared/aggregate-root.base";
import { AttributeBag } from "../shared/attribute-bag";
import type { DomainEvent } from "../shared/domain-event.base";
import {
  OrderItem,
  OrderStatus,
  ShippingAddress,
  type OrderStatusType,
} from "./order.value-objects";
import { OrderPlacedEvent, OrderStatusChangedEvent, OrderCancelledEvent } from "./order.events";

interface OrderProps {
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  totalAmount: number;
  attributes: AttributeBag;
  createdAt: Date;
  updatedAt: Date;
}

export class Order extends AggregateRoot<OrderProps> {
  get customerId() {
    return this.props.customerId;
  }
  get items() {
    return this.props.items;
  }
  get status() {
    return this.props.status;
  }
  get shippingAddress() {
    return this.props.shippingAddress;
  }
  get totalAmount() {
    return this.props.totalAmount;
  }
  get attributes() {
    return this.props.attributes;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  protected reconstruct(id: string, props: OrderProps, events: ReadonlyArray<DomainEvent>): this {
    return new Order(id, props, events) as this;
  }

  static create(principalId: string, params: {
    id: string;
    customerId: string;
    items: OrderItem[];
    shippingAddress: ShippingAddress;
  }): Order {
    if (params.items.length === 0) {
      throw new Error("Order must have at least one item");
    }

    const totalAmount = params.items.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );

    const now = new Date();
    const props: OrderProps = {
      customerId: params.customerId,
      items: params.items,
      status: OrderStatus.create("PENDING"),
      shippingAddress: params.shippingAddress,
      totalAmount,
      attributes: AttributeBag.empty(),
      createdAt: now,
      updatedAt: now,
    };

    const event = new OrderPlacedEvent(params.id, principalId, {
      customerId: params.customerId,
      items: params.items.map((i) => i.value),
      shippingAddress: params.shippingAddress.value,
      totalAmount,
    });

    return new Order(params.id, props, [event]);
  }

  static reconstitute(params: {
    id: string;
    customerId: string;
    items: OrderItem[];
    shippingAddress: ShippingAddress;
    status?: OrderStatusType;
    totalAmount?: number;
    attributes?: AttributeBag;
    createdAt?: Date;
    updatedAt?: Date;
  }): Order {
    const totalAmount = params.totalAmount ?? params.items.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );

    return new Order(params.id, {
      customerId: params.customerId,
      items: params.items,
      status: OrderStatus.create(params.status ?? "PENDING"),
      shippingAddress: params.shippingAddress,
      totalAmount,
      attributes: params.attributes ?? AttributeBag.empty(),
      createdAt: params.createdAt ?? new Date(),
      updatedAt: params.updatedAt ?? new Date(),
    });
  }

  updateStatus(principalId: string, newStatus: OrderStatusType): Order {
    const oldStatus = this.props.status.value;
    const updatedStatus = this.props.status.transitionTo(newStatus);
    return this.addEvent(
      { ...this.props, status: updatedStatus, updatedAt: new Date() },
      new OrderStatusChangedEvent(this.id, principalId, { before: oldStatus, after: newStatus }),
    );
  }

  cancel(principalId: string): Order {
    const previousStatus = this.props.status.value;
    const updatedStatus = this.props.status.transitionTo("CANCELLED");
    return this.addEvent(
      { ...this.props, status: updatedStatus, updatedAt: new Date() },
      new OrderCancelledEvent(this.id, principalId, { previousStatus }),
    );
  }

  withAttributes(attrs: AttributeBag): Order {
    return this.reconstruct(this.id, { ...this.props, attributes: attrs }, this.domainEvents);
  }
}
