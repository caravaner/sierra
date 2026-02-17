import { Customer } from "./customer.entity";
import type { CustomerRepository } from "./customer.repository";

export interface SyncUserInput {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}

export class CustomerService {
  constructor(private customerRepo: CustomerRepository) {}

  async syncUser(input: SyncUserInput): Promise<Customer> {
    const existing = await this.customerRepo.findByUserId(input.userId);

    if (existing) {
      const updated = existing.updateProfile({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
      });
      return this.customerRepo.save(updated);
    }

    const customer = Customer.create({
      id: crypto.randomUUID(),
      ...input,
    });

    return this.customerRepo.save(customer);
  }

  async getByUserId(userId: string): Promise<Customer | null> {
    return this.customerRepo.findByUserId(userId);
  }
}
