import { Command } from "../../shared/command.base";
import type { Principal } from "../../shared/principal";
import type { UnitOfWork } from "../../shared/unit-of-work";
import type { OrderRepository } from "../order.repository";
import type { OrderStatusType } from "../order.value-objects";

export class UpdateOrderStatusCommand extends Command<
  { orderId: string; status: OrderStatusType },
  { success: boolean }
> {
  constructor(
    uow: UnitOfWork,
    private orderRepo: OrderRepository,
  ) {
    super(uow);
  }

  async execute(
    principal: Principal,
    params: { orderId: string; status: OrderStatusType },
  ): Promise<{ success: boolean }> {
    const order = await this.orderRepo.findById(params.orderId);
    if (!order) throw new Error("Order not found");

    const updated = order.updateStatus(principal.id, params.status);
    await this.orderRepo.save(updated);
    return { success: true };
  }
}
