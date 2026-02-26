import { AggregateRoot } from "../shared/aggregate-root.base";
import { AttributeBag } from "../shared/attribute-bag";
import type { DomainEvent } from "../shared/domain-event.base";
import { StockReservedEvent, StockReleasedEvent, StockReplenishedEvent } from "./inventory.events";

interface InventoryItemProps {
  productId: string;
  quantityOnHand: number;
  quantityReserved: number;
  reorderPoint: number;
  version: number;
  attributes: AttributeBag;
  updatedAt: Date;
}

export class InventoryItem extends AggregateRoot<InventoryItemProps> {
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
  get version() {
    return this.props.version;
  }
  get needsReorder() {
    return this.quantityAvailable <= this.props.reorderPoint;
  }
  get attributes() {
    return this.props.attributes;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  protected reconstruct(id: string, props: InventoryItemProps, events: ReadonlyArray<DomainEvent>): this {
    return new InventoryItem(id, props, events) as this;
  }

  static create(principalId: string, params: {
    id: string;
    productId: string;
    quantityOnHand?: number;
    quantityReserved?: number;
    reorderPoint?: number;
  }): InventoryItem {
    return new InventoryItem(params.id, {
      productId: params.productId,
      quantityOnHand: params.quantityOnHand ?? 0,
      quantityReserved: params.quantityReserved ?? 0,
      reorderPoint: params.reorderPoint ?? 10,
      version: -1,
      attributes: AttributeBag.empty(),
      updatedAt: new Date(),
    });
  }

  static reconstitute(params: {
    id: string;
    productId: string;
    quantityOnHand?: number;
    quantityReserved?: number;
    reorderPoint?: number;
    version?: number;
    attributes?: AttributeBag;
    updatedAt?: Date;
  }): InventoryItem {
    return new InventoryItem(params.id, {
      productId: params.productId,
      quantityOnHand: params.quantityOnHand ?? 0,
      quantityReserved: params.quantityReserved ?? 0,
      reorderPoint: params.reorderPoint ?? 10,
      version: params.version ?? 0,
      attributes: params.attributes ?? AttributeBag.empty(),
      updatedAt: params.updatedAt ?? new Date(),
    });
  }

  reserve(principalId: string, quantity: number): InventoryItem {
    if (quantity <= 0) throw new Error("Quantity must be positive");
    if (quantity > this.quantityAvailable) {
      throw new Error(
        `Cannot reserve ${quantity}, only ${this.quantityAvailable} available`,
      );
    }
    const newReserved = this.props.quantityReserved + quantity;
    return this.addEvent(
      { ...this.props, quantityReserved: newReserved, updatedAt: new Date() },
      new StockReservedEvent(this.id, principalId, {
        productId: this.props.productId,
        quantity,
        quantityReservedAfter: newReserved,
      }),
    );
  }

  release(principalId: string, quantity: number): InventoryItem {
    if (quantity <= 0) throw new Error("Quantity must be positive");
    if (quantity > this.props.quantityReserved) {
      throw new Error(
        `Cannot release ${quantity}, only ${this.props.quantityReserved} reserved`,
      );
    }
    const newReserved = this.props.quantityReserved - quantity;
    return this.addEvent(
      { ...this.props, quantityReserved: newReserved, updatedAt: new Date() },
      new StockReleasedEvent(this.id, principalId, {
        productId: this.props.productId,
        quantity,
        quantityReservedAfter: newReserved,
      }),
    );
  }

  replenish(principalId: string, quantity: number): InventoryItem {
    if (quantity <= 0) throw new Error("Quantity must be positive");
    const newOnHand = this.props.quantityOnHand + quantity;
    return this.addEvent(
      { ...this.props, quantityOnHand: newOnHand, updatedAt: new Date() },
      new StockReplenishedEvent(this.id, principalId, {
        productId: this.props.productId,
        quantity,
        quantityOnHandAfter: newOnHand,
      }),
    );
  }

  setReorderPoint(point: number): InventoryItem {
    if (point < 0) throw new Error("Reorder point cannot be negative");
    return this.reconstruct(
      this.id,
      { ...this.props, reorderPoint: point, updatedAt: new Date() },
      this.domainEvents,
    );
  }

  withAttributes(attrs: AttributeBag): InventoryItem {
    return this.reconstruct(this.id, { ...this.props, attributes: attrs }, this.domainEvents);
  }
}
