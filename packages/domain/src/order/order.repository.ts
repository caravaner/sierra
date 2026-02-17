import type { Repository } from "../shared/repository.interface";
import type { Order } from "./order.entity";

export interface OrderRepository extends Repository<Order> {
  findByCustomerId(customerId: string): Promise<Order[]>;
  findAll(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Order[]>;
  count(params?: { status?: string }): Promise<number>;
}
