import { Command } from "../../shared/command.base";
import type { Principal } from "../../shared/principal";
import type { UnitOfWork } from "../../shared/unit-of-work";
import type { ProductRepository } from "../product.repository";

export interface UpdateProductParams {
  productId: string;
  data: {
    name?: string;
    description?: string | null;
    price?: number;
    category?: string | null;
    images?: string[];
  };
}

export class UpdateProductCommand extends Command<UpdateProductParams, { id: string }> {
  constructor(
    uow: UnitOfWork,
    private productRepo: ProductRepository,
  ) {
    super(uow);
  }

  async execute(principal: Principal, params: UpdateProductParams): Promise<{ id: string }> {
    const product = await this.productRepo.findById(params.productId);
    if (!product) throw new Error("Product not found");

    const updated = product.update(principal.id, params.data);
    await this.productRepo.save(updated);
    return { id: updated.id };
  }
}
