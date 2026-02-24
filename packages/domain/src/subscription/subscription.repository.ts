import type { Subscription } from "./subscription.entity";

export interface SubscriptionRepository {
  findById(id: string): Promise<Subscription | null>;
  findByCustomerId(customerId: string): Promise<Subscription[]>;
  findDue(before: Date): Promise<Subscription[]>;
  findAll(params?: { status?: string; limit?: number; offset?: number }): Promise<Subscription[]>;
  count(params?: { status?: string }): Promise<number>;
  save(entity: Subscription): Promise<Subscription>;
}
