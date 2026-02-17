import { Product } from "./product.entity";
import type { ProductRepository } from "./product.repository";

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  sku: string;
  category?: string;
  images?: string[];
}

export interface UpdateProductInput {
  name?: string;
  description?: string | null;
  price?: number;
  category?: string | null;
  images?: string[];
}

export class ProductService {
  constructor(private productRepo: ProductRepository) {}

  async createProduct(input: CreateProductInput): Promise<Product> {
    const existing = await this.productRepo.findBySku(input.sku);
    if (existing) {
      throw new Error(`Product with SKU ${input.sku} already exists`);
    }

    const product = Product.create({
      id: crypto.randomUUID(),
      ...input,
    });

    return this.productRepo.save(product);
  }

  async updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new Error("Product not found");

    const updated = product.update(input);
    return this.productRepo.save(updated);
  }

  async activateProduct(id: string): Promise<Product> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new Error("Product not found");

    return this.productRepo.save(product.activate());
  }

  async deactivateProduct(id: string): Promise<Product> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new Error("Product not found");

    return this.productRepo.save(product.deactivate());
  }
}
