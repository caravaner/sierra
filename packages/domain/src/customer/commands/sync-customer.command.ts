import { Command } from "../../shared/command.base";
import type { Principal } from "../../shared/principal";
import type { UnitOfWork } from "../../shared/unit-of-work";
import type { CustomerRepository } from "../customer.repository";
import { Customer } from "../customer.entity";

export interface SyncCustomerParams {
  userId: string;
  phone: string;
  email?: string;
  firstName: string;
  lastName: string;
}

export class SyncCustomerCommand extends Command<SyncCustomerParams, { id: string }> {
  constructor(
    uow: UnitOfWork,
    private customerRepo: CustomerRepository,
  ) {
    super(uow);
  }

  async execute(principal: Principal, input: SyncCustomerParams): Promise<{ id: string }> {
    const existing = await this.customerRepo.findByUserId(input.userId);

    if (existing) {
      const updated = existing.updateProfile(principal.id, {
        phone: input.phone,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
      });
      await this.customerRepo.save(updated);
      return { id: updated.id };
    }

    const customer = Customer.create(principal.id, {
      id: crypto.randomUUID(),
      ...input,
    });

    await this.customerRepo.save(customer);
    return { id: customer.id };
  }
}
