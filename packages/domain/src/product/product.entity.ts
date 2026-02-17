import { Entity } from "../shared/entity.base";
import { Money, SKU } from "./product.value-objects";

interface ProductProps {
  name: string;
  description: string | null;
  price: Money;
  sku: SKU;
  category: string | null;
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Product extends Entity<ProductProps> {
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
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  static create(params: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    sku: string;
    category?: string | null;
    images?: string[];
    isActive?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }): Product {
    if (!params.name || params.name.trim().length === 0) {
      throw new Error("Product name is required");
    }

    return new Product(params.id, {
      name: params.name.trim(),
      description: params.description ?? null,
      price: Money.create(params.price),
      sku: SKU.create(params.sku),
      category: params.category ?? null,
      images: params.images ?? [],
      isActive: params.isActive ?? true,
      createdAt: params.createdAt ?? new Date(),
      updatedAt: params.updatedAt ?? new Date(),
    });
  }

  update(params: {
    name?: string;
    description?: string | null;
    price?: number;
    category?: string | null;
    images?: string[];
  }): Product {
    return new Product(this.id, {
      ...this.props,
      name: params.name?.trim() ?? this.props.name,
      description:
        params.description !== undefined
          ? params.description
          : this.props.description,
      price: params.price !== undefined ? Money.create(params.price) : this.props.price,
      category:
        params.category !== undefined
          ? params.category
          : this.props.category,
      images: params.images ?? this.props.images,
      updatedAt: new Date(),
    });
  }

  activate(): Product {
    return new Product(this.id, {
      ...this.props,
      isActive: true,
      updatedAt: new Date(),
    });
  }

  deactivate(): Product {
    return new Product(this.id, {
      ...this.props,
      isActive: false,
      updatedAt: new Date(),
    });
  }
}
