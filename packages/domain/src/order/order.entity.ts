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
  subscriptionId?: string;
  items: OrderItem[];
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  deliveryFee: number;
  totalAmount: number;
  version: number;
  attributes: AttributeBag;
  createdAt: Date;
  updatedAt: Date;
}

export class Order extends AggregateRoot<OrderProps> {
  get customerId() {
    return this.props.customerId;
  }
  get subscriptionId() {
    return this.props.subscriptionId;
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
  get deliveryFee() {
    return this.props.deliveryFee;
  }
  get totalAmount() {
    return this.props.totalAmount;
  }
  get version() {
    return this.props.version;
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
    subscriptionId?: string;
    items: OrderItem[];
    shippingAddress: ShippingAddress;
    deliveryFee?: number;
  }): Order {
    if (params.items.length === 0) {
      throw new Error("Order must have at least one item");
    }

    const deliveryFee = params.deliveryFee ?? 0;
    const subtotal = params.items.reduce((sum, item) => sum + item.lineTotal, 0);
    const totalAmount = subtotal + deliveryFee;

    const now = new Date();
    const props: OrderProps = {
      customerId: params.customerId,
      subscriptionId: params.subscriptionId,
      items: params.items,
      status: OrderStatus.create("PENDING"),
      shippingAddress: params.shippingAddress,
      deliveryFee,
      totalAmount,
      version: -1,
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
    subscriptionId?: string;
    items: OrderItem[];
    shippingAddress: ShippingAddress;
    status?: OrderStatusType;
    deliveryFee?: number;
    totalAmount?: number;
    version?: number;
    attributes?: AttributeBag;
    createdAt?: Date;
    updatedAt?: Date;
  }): Order {
    const deliveryFee = params.deliveryFee ?? 0;
    const totalAmount = params.totalAmount ?? (
      params.items.reduce((sum, item) => sum + item.lineTotal, 0) + deliveryFee
    );

    return new Order(params.id, {
      customerId: params.customerId,
      subscriptionId: params.subscriptionId,
      items: params.items,
      status: OrderStatus.create(params.status ?? "PENDING"),
      shippingAddress: params.shippingAddress,
      deliveryFee,
      totalAmount,
      version: params.version ?? 0,
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
