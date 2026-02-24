import { Command } from "../../shared/command.base";
import type { Principal } from "../../shared/principal";
import type { UnitOfWork } from "../../shared/unit-of-work";
import type { SubscriptionRepository } from "../subscription.repository";

export class ResumeSubscriptionCommand extends Command<{ subscriptionId: string }, { success: boolean }> {
  constructor(
    uow: UnitOfWork,
    private subscriptionRepo: SubscriptionRepository,
  ) {
    super(uow);
  }

  async execute(principal: Principal, input: { subscriptionId: string }): Promise<{ success: boolean }> {
    const sub = await this.subscriptionRepo.findById(input.subscriptionId);
    if (!sub) throw new Error("Subscription not found");
    const updated = sub.resume(principal.id);
    await this.subscriptionRepo.save(updated);
    return { success: true };
  }
}
