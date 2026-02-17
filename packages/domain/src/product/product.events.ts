import { DomainEvent } from "../shared/domain-event.base";

export interface ProductCreatedPayload {
  name: string;
  description: string | null;
  price: number;
  sku: string;
  category: string | null;
  images: string[];
  isActive: boolean;
}

export class ProductCreatedEvent extends DomainEvent<ProductCreatedPayload> {
  constructor(aggregateId: string, principalId: string, payload: ProductCreatedPayload) {
    super(aggregateId, "Product", "Product.Created", principalId, payload);
  }
}

export interface ProductUpdatedPayload {
  before: Partial<ProductCreatedPayload>;
  after: Partial<ProductCreatedPayload>;
}

export class ProductUpdatedEvent extends DomainEvent<ProductUpdatedPayload> {
  constructor(aggregateId: string, principalId: string, payload: ProductUpdatedPayload) {
    super(aggregateId, "Product", "Product.Updated", principalId, payload);
  }
}

export class ProductActivatedEvent extends DomainEvent<Record<string, never>> {
  constructor(aggregateId: string, principalId: string) {
    super(aggregateId, "Product", "Product.Activated", principalId, {});
  }
}

export class ProductDeactivatedEvent extends DomainEvent<Record<string, never>> {
  constructor(aggregateId: string, principalId: string) {
    super(aggregateId, "Product", "Product.Deactivated", principalId, {});
  }
}
