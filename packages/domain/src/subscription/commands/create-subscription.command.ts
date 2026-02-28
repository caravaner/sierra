import { Command } from "../../shared/command.base";
import type { Principal } from "../../shared/principal";
import type { UnitOfWork } from "../../shared/unit-of-work";
import type { SubscriptionRepository } from "../subscription.repository";
import { Subscription } from "../subscription.entity";
import { SubscriptionItem } from "../subscription.value-objects";

export interface CreateSubscriptionParams {
  customerId: string;
  intervalDays: number;
  nextDeliveryAt: Date;
  items: { productId: string; name: string; quantity: number; unitPrice: number }[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
  };
}

export class CreateSubscriptionCommand extends Command<CreateSubscriptionParams, { id: string }> {
  constructor(
    uow: UnitOfWork,
    private subscriptionRepo: SubscriptionRepository,
  ) {
    super(uow);
  }

  async execute(principal: Principal, input: CreateSubscriptionParams): Promise<{ id: string }> {
    const items = input.items.map((i) => SubscriptionItem.create(i));
    const subscription = Subscription.create(principal.id, {
      id: crypto.randomUUID(),
      customerId: input.customerId,
      intervalDays: input.intervalDays,
      nextDeliveryAt: input.nextDeliveryAt,
      items,
      shippingAddress: input.shippingAddress,
    });

    await this.subscriptionRepo.save(subscription);
    return { id: subscription.id };
  }
}
