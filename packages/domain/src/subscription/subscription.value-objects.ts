import { ValueObject } from "../shared/value-object.base";

export interface SubscriptionItemProps {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export class SubscriptionItem extends ValueObject<SubscriptionItemProps> {
  get productId() { return this.value.productId; }
  get name() { return this.value.name; }
  get quantity() { return this.value.quantity; }
  get unitPrice() { return this.value.unitPrice; }
  get lineTotal() { return this.value.quantity * this.value.unitPrice; }

  static create(props: SubscriptionItemProps): SubscriptionItem {
    if (props.quantity <= 0) throw new Error("Quantity must be positive");
    if (props.unitPrice < 0) throw new Error("Unit price cannot be negative");
    return new SubscriptionItem(props);
  }
}

export type SubscriptionStatusType = "ACTIVE" | "PAUSED" | "CANCELLED";

export interface SubscriptionShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}
