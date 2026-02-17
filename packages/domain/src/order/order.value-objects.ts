import { ValueObject } from "../shared/value-object.base";

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatusType = (typeof ORDER_STATUSES)[number];

const VALID_TRANSITIONS: Record<OrderStatusType, OrderStatusType[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export class OrderStatus extends ValueObject<OrderStatusType> {
  static create(status: OrderStatusType): OrderStatus {
    return new OrderStatus(status);
  }

  canTransitionTo(next: OrderStatusType): boolean {
    return VALID_TRANSITIONS[this.value].includes(next);
  }

  transitionTo(next: OrderStatusType): OrderStatus {
    if (!this.canTransitionTo(next)) {
      throw new Error(
        `Cannot transition order from ${this.value} to ${next}`,
      );
    }
    return OrderStatus.create(next);
  }
}

export interface OrderItemProps {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export class OrderItem extends ValueObject<OrderItemProps> {
  get productId() {
    return this.value.productId;
  }
  get name() {
    return this.value.name;
  }
  get quantity() {
    return this.value.quantity;
  }
  get unitPrice() {
    return this.value.unitPrice;
  }
  get lineTotal() {
    return this.value.quantity * this.value.unitPrice;
  }

  static create(props: OrderItemProps): OrderItem {
    if (props.quantity <= 0) throw new Error("Quantity must be positive");
    if (props.unitPrice < 0) throw new Error("Unit price cannot be negative");
    return new OrderItem(props);
  }
}

export interface ShippingAddressProps {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export class ShippingAddress extends ValueObject<ShippingAddressProps> {
  get street() {
    return this.value.street;
  }
  get city() {
    return this.value.city;
  }
  get state() {
    return this.value.state;
  }
  get zipCode() {
    return this.value.zipCode;
  }
  get country() {
    return this.value.country;
  }

  static create(props: ShippingAddressProps): ShippingAddress {
    if (!props.street || !props.city || !props.state || !props.zipCode) {
      throw new Error("All address fields are required");
    }
    return new ShippingAddress(props);
  }
}
