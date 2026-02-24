import { Command } from "../../shared/command.base";
import type { Principal } from "../../shared/principal";
import type { UnitOfWork } from "../../shared/unit-of-work";
import type { CustomerRepository } from "../customer.repository";

export interface AddAddressParams {
  userId: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export class AddAddressCommand extends Command<AddAddressParams, { addressId: string }> {
  constructor(
    uow: UnitOfWork,
    private customerRepo: CustomerRepository,
  ) {
    super(uow);
  }

  async execute(principal: Principal, input: AddAddressParams): Promise<{ addressId: string }> {
    const customer = await this.customerRepo.findByUserId(input.userId);
    if (!customer) throw new Error("Customer not found. Please complete your profile first.");

    const updated = customer.addAddress(principal.id, {
      street: input.street,
      city: input.city,
      state: input.state,
      zipCode: input.zipCode,
      country: input.country,
      isDefault: input.isDefault,
    });

    await this.customerRepo.save(updated);

    const newAddress = updated.addresses[updated.addresses.length - 1]!;
    return { addressId: newAddress.id };
  }
}
