import { AggregateRoot } from "../shared/aggregate-root.base";
import { AttributeBag } from "../shared/attribute-bag";
import type { DomainEvent } from "../shared/domain-event.base";
import { Money, SKU } from "./product.value-objects";
import {
  ProductCreatedEvent,
  ProductUpdatedEvent,
  ProductActivatedEvent,
  ProductDeactivatedEvent,
} from "./product.events";

interface ProductProps {
  name: string;
  description: string | null;
  price: Money;
  sku: SKU;
  category: string | null;
  images: string[];
  isActive: boolean;
  version: number;
  attributes: AttributeBag;
  createdAt: Date;
  updatedAt: Date;
}

export class Product extends AggregateRoot<ProductProps> {
  get name() {
    return this.props.name;
  }
  get description() {
    return this.props.description;
  }
  get price() {
    return this.props.price.value;
  }
  get sku() {
    return this.props.sku.value;
  }
  get category() {
    return this.props.category;
  }
  get images() {
    return this.props.images;
  }
  get isActive() {
    return this.props.isActive;
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

  protected reconstruct(id: string, props: ProductProps, events: ReadonlyArray<DomainEvent>): this {
    return new Product(id, props, events) as this;
  }

  static create(principalId: string, params: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    sku: string;
    category?: string | null;
    images?: string[];
  }): Product {
    if (!params.name || params.name.trim().length === 0) {
      throw new Error("Product name is required");
    }

    const now = new Date();
    const props: ProductProps = {
      name: params.name.trim(),
      description: params.description ?? null,
      price: Money.create(params.price),
      sku: SKU.create(params.sku),
      category: params.category ?? null,
      images: params.images ?? [],
      isActive: true,
      version: -1,
      attributes: AttributeBag.empty(),
      createdAt: now,
      updatedAt: now,
    };

    const event = new ProductCreatedEvent(params.id, principalId, {
      name: props.name,
      description: props.description,
      price: props.price.value,
      sku: props.sku.value,
      category: props.category,
      images: props.images,
      isActive: props.isActive,
    });

    return new Product(params.id, props, [event]);
  }

  static reconstitute(params: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    sku: string;
    category?: string | null;
    images?: string[];
    isActive?: boolean;
    version?: number;
    attributes?: AttributeBag;
    createdAt?: Date;
    updatedAt?: Date;
  }): Product {
    return new Product(params.id, {
      name: params.name.trim(),
      description: params.description ?? null,
      price: Money.create(params.price),
      sku: SKU.create(params.sku),
      category: params.category ?? null,
      images: params.images ?? [],
      isActive: params.isActive ?? true,
      version: params.version ?? 0,
      attributes: params.attributes ?? AttributeBag.empty(),
      createdAt: params.createdAt ?? new Date(),
      updatedAt: params.updatedAt ?? new Date(),
    });
  }

  update(principalId: string, params: {
    name?: string;
    description?: string | null;
    price?: number;
    category?: string | null;
    images?: string[];
  }): Product {
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

    if (params.name !== undefined && params.name !== this.props.name) {
      before.name = this.props.name;
      after.name = params.name;
    }
    if (params.description !== undefined && params.description !== this.props.description) {
      before.description = this.props.description;
      after.description = params.description;
    }
    if (params.price !== undefined && params.price !== this.props.price.value) {
      before.price = this.props.price.value;
      after.price = params.price;
    }
    if (params.category !== undefined && params.category !== this.props.category) {
      before.category = this.props.category;
      after.category = params.category;
    }
    if (params.images !== undefined) {
      before.images = this.props.images;
      after.images = params.images;
    }

    return this.addEvent(
      {
        ...this.props,
        name: params.name?.trim() ?? this.props.name,
        description: params.description !== undefined ? params.description : this.props.description,
        price: params.price !== undefined ? Money.create(params.price) : this.props.price,
        category: params.category !== undefined ? params.category : this.props.category,
        images: params.images ?? this.props.images,
        updatedAt: new Date(),
      },
      new ProductUpdatedEvent(this.id, principalId, { before, after }),
    );
  }

  activate(principalId: string): Product {
    return this.addEvent(
      { ...this.props, isActive: true, updatedAt: new Date() },
      new ProductActivatedEvent(this.id, principalId),
    );
  }

  deactivate(principalId: string): Product {
    return this.addEvent(
      { ...this.props, isActive: false, updatedAt: new Date() },
      new ProductDeactivatedEvent(this.id, principalId),
    );
  }

  withAttributes(attrs: AttributeBag): Product {
    return this.reconstruct(this.id, { ...this.props, attributes: attrs }, this.domainEvents);
  }
}
