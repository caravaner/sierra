import { Entity } from "../shared/entity.base";

interface InventoryItemProps {
  productId: string;
  quantityOnHand: number;
  quantityReserved: number;
  reorderPoint: number;
  updatedAt: Date;
}

export class InventoryItem extends Entity<InventoryItemProps> {
  get productId() {
    return this.props.productId;
  }
  get quantityOnHand() {
    return this.props.quantityOnHand;
  }
  get quantityReserved() {
    return this.props.quantityReserved;
  }
  get quantityAvailable() {
    return this.props.quantityOnHand - this.props.quantityReserved;
  }
  get reorderPoint() {
    return this.props.reorderPoint;
  }
  get needsReorder() {
    return this.quantityAvailable <= this.props.reorderPoint;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  static create(params: {
    id: string;
    productId: string;
    quantityOnHand?: number;
    quantityReserved?: number;
    reorderPoint?: number;
    updatedAt?: Date;
  }): InventoryItem {
    return new InventoryItem(params.id, {
      productId: params.productId,
      quantityOnHand: params.quantityOnHand ?? 0,
      quantityReserved: params.quantityReserved ?? 0,
      reorderPoint: params.reorderPoint ?? 10,
      updatedAt: params.updatedAt ?? new Date(),
    });
  }

  reserve(quantity: number): InventoryItem {
    if (quantity <= 0) throw new Error("Quantity must be positive");
    if (quantity > this.quantityAvailable) {
      throw new Error(
        `Cannot reserve ${quantity}, only ${this.quantityAvailable} available`,
      );
    }
    return new InventoryItem(this.id, {
      ...this.props,
      quantityReserved: this.props.quantityReserved + quantity,
      updatedAt: new Date(),
    });
  }

  release(quantity: number): InventoryItem {
    if (quantity <= 0) throw new Error("Quantity must be positive");
    if (quantity > this.props.quantityReserved) {
      throw new Error(
        `Cannot release ${quantity}, only ${this.props.quantityReserved} reserved`,
      );
    }
    return new InventoryItem(this.id, {
      ...this.props,
      quantityReserved: this.props.quantityReserved - quantity,
      updatedAt: new Date(),
    });
  }

  replenish(quantity: number): InventoryItem {
    if (quantity <= 0) throw new Error("Quantity must be positive");
    return new InventoryItem(this.id, {
      ...this.props,
      quantityOnHand: this.props.quantityOnHand + quantity,
      updatedAt: new Date(),
    });
  }

  setReorderPoint(point: number): InventoryItem {
    if (point < 0) throw new Error("Reorder point cannot be negative");
    return new InventoryItem(this.id, {
      ...this.props,
      reorderPoint: point,
      updatedAt: new Date(),
    });
  }
}
