import { Command } from "../../shared/command.base";
import type { Principal } from "../../shared/principal";
import type { UnitOfWork } from "../../shared/unit-of-work";
import type { ProductRepository } from "../product.repository";
import { Product } from "../product.entity";

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
  ) {
    super(uow);
  }

  async execute(principal: Principal, input: CreateProductParams): Promise<{ id: string }> {
    const existing = await this.productRepo.findBySku(input.sku);
    if (existing) {
      throw new Error(`Product with SKU ${input.sku} already exists`);
    }

    const product = Product.create(principal.id, {
      id: crypto.randomUUID(),
      ...input,
    });

    await this.productRepo.save(product);
    return { id: product.id };
  }
}
