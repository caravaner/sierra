import { Entity } from "../shared/entity.base";
import {
  OrderItem,
  OrderStatus,
  ShippingAddress,
  type OrderStatusType,
} from "./order.value-objects";

interface OrderProps {
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Order extends Entity<OrderProps> {
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
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  static create(params: {
    id: string;
    customerId: string;
    items: OrderItem[];
    shippingAddress: ShippingAddress;
    status?: OrderStatusType;
    createdAt?: Date;
    updatedAt?: Date;
  }): Order {
    if (params.items.length === 0) {
      throw new Error("Order must have at least one item");
    }

    const totalAmount = params.items.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );

    return new Order(params.id, {
      customerId: params.customerId,
      items: params.items,
      status: OrderStatus.create(params.status ?? "PENDING"),
      shippingAddress: params.shippingAddress,
      totalAmount,
      createdAt: params.createdAt ?? new Date(),
      updatedAt: params.updatedAt ?? new Date(),
    });
  }

  updateStatus(newStatus: OrderStatusType): Order {
    const updatedStatus = this.props.status.transitionTo(newStatus);
    return new Order(this.id, {
      ...this.props,
      status: updatedStatus,
      updatedAt: new Date(),
    });
  }

  cancel(): Order {
    return this.updateStatus("CANCELLED");
  }
}
