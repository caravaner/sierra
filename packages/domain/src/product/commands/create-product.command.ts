import { Command } from "../../shared/command.base";
import type { Principal } from "../../shared/principal";
import type { UnitOfWork } from "../../shared/unit-of-work";
import type { ProductRepository } from "../product.repository";
import type { InventoryRepository } from "../../inventory/inventory.repository";
import { Product } from "../product.entity";
import { InventoryItem } from "../../inventory/inventory.entity";

export interface CreateProductParams {
  name: string;
  description?: string;
  price: number;
  sku: string;
  category?: string;
  images?: string[];
}

export class CreateProductCommand extends Command<CreateProductParams, { id: string }> {
  constructor(
    uow: UnitOfWork,
    private productRepo: ProductRepository,
    private inventoryRepo: InventoryRepository,
  ) {
    super(uow);
  }

  async execute(principal: Principal, input: CreateProductParams): Promise<{ id: string }> {
    const existing = await this.productRepo.findBySku(input.sku);
    if (existing) {
      throw new Error(`Product with SKU ${input.sku} already exists`);
    }

    const productId = crypto.randomUUID();
    const product = Product.create(principal.id, { id: productId, ...input });
    await this.productRepo.save(product);

    const inventoryItem = InventoryItem.create(principal.id, {
      id: crypto.randomUUID(),
      productId,
    });
    await this.inventoryRepo.save(inventoryItem);

    return { id: productId };
  }
}
