import type { Repository } from "../shared/repository.interface";
import type { Customer } from "./customer.entity";

export interface CustomerRepository extends Repository<Customer> {
  findByUserId(userId: string): Promise<Customer | null>;
  findByEmail(email: string): Promise<Customer | null>;
  findAll(params?: { limit?: number; offset?: number }): Promise<Customer[]>;
  count(): Promise<number>;
}
