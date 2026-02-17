import type { Repository } from "../shared/repository.interface";
import type { Product } from "./product.entity";

export interface ProductRepository extends Repository<Product> {
  findBySku(sku: string): Promise<Product | null>;
  findAll(params?: {
    category?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Product[]>;
  count(params?: { category?: string; isActive?: boolean }): Promise<number>;
}
