import { DomainEvent } from "../shared/domain-event.base";

export interface StockReservedPayload {
  productId: string;
  quantity: number;
  quantityReservedAfter: number;
}

export class StockReservedEvent extends DomainEvent<StockReservedPayload> {
  constructor(aggregateId: string, principalId: string, payload: StockReservedPayload) {
    super(aggregateId, "Inventory", "Inventory.StockReserved", principalId, payload);
  }
}

export interface StockReleasedPayload {
  productId: string;
  quantity: number;
  quantityReservedAfter: number;
}

export class StockReleasedEvent extends DomainEvent<StockReleasedPayload> {
  constructor(aggregateId: string, principalId: string, payload: StockReleasedPayload) {
    super(aggregateId, "Inventory", "Inventory.StockReleased", principalId, payload);
  }
}

export interface StockReplenishedPayload {
  productId: string;
  quantity: number;
  quantityOnHandAfter: number;
}

export class StockReplenishedEvent extends DomainEvent<StockReplenishedPayload> {
  constructor(aggregateId: string, principalId: string, payload: StockReplenishedPayload) {
    super(aggregateId, "Inventory", "Inventory.StockReplenished", principalId, payload);
  }
}
