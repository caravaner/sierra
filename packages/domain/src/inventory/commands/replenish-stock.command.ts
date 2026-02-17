import { Command } from "../../shared/command.base";
import type { Principal } from "../../shared/principal";
import type { UnitOfWork } from "../../shared/unit-of-work";
import type { InventoryRepository } from "../inventory.repository";

export interface ReplenishStockParams {
  productId: string;
  quantity: number;
}

export class ReplenishStockCommand extends Command<ReplenishStockParams, { success: boolean }> {
  constructor(
    uow: UnitOfWork,
    private inventoryRepo: InventoryRepository,
  ) {
    super(uow);
  }

  async execute(principal: Principal, params: ReplenishStockParams): Promise<{ success: boolean }> {
    const item = await this.inventoryRepo.findByProductId(params.productId);
    if (!item) throw new Error(`No inventory for product ${params.productId}`);

    const replenished = item.replenish(principal.id, params.quantity);
    await this.inventoryRepo.save(replenished);
    return { success: true };
  }
}
