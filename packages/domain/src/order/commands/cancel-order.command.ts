import { Command } from "../../shared/command.base";
import type { Principal } from "../../shared/principal";
import type { UnitOfWork } from "../../shared/unit-of-work";
import type { OrderRepository } from "../order.repository";
import type { InventoryRepository } from "../../inventory/inventory.repository";

export class CancelOrderCommand extends Command<{ orderId: string }, { success: boolean }> {
  constructor(
    uow: UnitOfWork,
    private orderRepo: OrderRepository,
    private inventoryRepo: InventoryRepository,
  ) {
    super(uow);
  }

  async execute(principal: Principal, params: { orderId: string }): Promise<{ success: boolean }> {
    const order = await this.orderRepo.findById(params.orderId);
    if (!order) throw new Error("Order not found");

    const cancelled = order.cancel(principal.id);
    await this.orderRepo.save(cancelled);

    // Release reserved inventory
    for (const item of order.items) {
      const inv = await this.inventoryRepo.findByProductId(item.productId);
      if (!inv) continue;
      const released = inv.release(principal.id, item.quantity);
      await this.inventoryRepo.save(released);
    }

    return { success: true };
  }
}
