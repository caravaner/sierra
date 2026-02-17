import type { Repository } from "../shared/repository.interface";
import type { InventoryItem } from "./inventory.entity";

export interface InventoryRepository extends Repository<InventoryItem> {
  findByProductId(productId: string): Promise<InventoryItem | null>;
  findAll(params?: {
    lowStock?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<InventoryItem[]>;
  count(params?: { lowStock?: boolean }): Promise<number>;
}
