import type { PrismaClient } from "@sierra/db";
import {
  Subscription,
  SubscriptionItem,
  type SubscriptionRepository,
  type SubscriptionStatusType,
} from "@sierra/domain";

export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findUnique({ where: { id } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByCustomerId(customerId: string): Promise<Subscription[]> {
    const rows = await this.prisma.subscription.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findDue(before: Date): Promise<Subscription[]> {
    const rows = await this.prisma.subscription.findMany({
      where: { status: "ACTIVE", nextDeliveryAt: { lte: before } },
      orderBy: { nextDeliveryAt: "asc" },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findAll(params?: { status?: string; limit?: number; offset?: number }): Promise<Subscription[]> {
    const rows = await this.prisma.subscription.findMany({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: params?.status ? { status: params.status as any } : undefined,
      take: params?.limit ?? 20,
      skip: params?.offset ?? 0,
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async count(params?: { status?: string }): Promise<number> {
    return this.prisma.subscription.count({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: params?.status ? { status: params.status as any } : undefined,
    });
  }

  async save(entity: Subscription): Promise<Subscription> {
    const row = await this.prisma.subscription.upsert({
      where: { id: entity.id },
      create: {
        id: entity.id,
        customerId: entity.customerId,
        intervalDays: entity.intervalDays,
        status: entity.status,
        nextDeliveryAt: entity.nextDeliveryAt,
        items: entity.items.map((i) => i.value) as object[],
        shippingAddress: entity.shippingAddress as object,
      },
      update: {
        status: entity.status,
        nextDeliveryAt: entity.nextDeliveryAt,
        items: entity.items.map((i) => i.value) as object[],
        shippingAddress: entity.shippingAddress as object,
      },
    });
    return this.toDomain(row);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(row: any): Subscription {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (row.items as any[]).map((i) => SubscriptionItem.create(i));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addr = row.shippingAddress as any;
    return Subscription.reconstitute({
      id: row.id,
      customerId: row.customerId,
      intervalDays: row.intervalDays,
      status: row.status as SubscriptionStatusType,
      nextDeliveryAt: row.nextDeliveryAt,
      items,
      shippingAddress: {
        street: addr.street,
        city: addr.city,
        state: addr.state,
      },
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
