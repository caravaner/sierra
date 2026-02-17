import type { PrismaClient } from "@sierra/db";
import {
  Order,
  OrderItem,
  ShippingAddress,
  AttributeBag,
  type OrderRepository,
  type UowRepository,
} from "@sierra/domain";
import type { PrismaUnitOfWork } from "../../uow/unit-of-work";

export class UowOrderRepository implements OrderRepository, UowRepository<Order> {
  constructor(
    private prisma: PrismaClient,
    private uow: PrismaUnitOfWork,
  ) {}

  async findById(id: string): Promise<Order | null> {
    const row = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    const rows = await this.prisma.order.findMany({
      where: { customerId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findAll(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Order[]> {
    const rows = await this.prisma.order.findMany({
      where: params?.status
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? { status: params.status as any }
        : undefined,
      include: { items: true },
      take: params?.limit ?? 20,
      skip: params?.offset ?? 0,
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async count(params?: { status?: string }): Promise<number> {
    return this.prisma.order.count({
      where: params?.status
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? { status: params.status as any }
        : undefined,
    });
  }

  async save(entity: Order): Promise<Order> {
    this.uow.track(entity, this);
    return entity;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.order.delete({ where: { id } });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async saveWithTx(tx: any, entity: Order): Promise<Order> {
    const row = await tx.order.upsert({
      where: { id: entity.id },
      create: {
        id: entity.id,
        customerId: entity.customerId,
        status: entity.status.value,
        shippingStreet: entity.shippingAddress.street,
        shippingCity: entity.shippingAddress.city,
        shippingState: entity.shippingAddress.state,
        shippingZipCode: entity.shippingAddress.zipCode,
        shippingCountry: entity.shippingAddress.country,
        totalAmount: entity.totalAmount,
        attributes: entity.attributes.toJSON(),
        items: {
          create: entity.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      update: {
        status: entity.status.value,
        totalAmount: entity.totalAmount,
        attributes: entity.attributes.toJSON(),
      },
      include: { items: true },
    });
    return this.toDomain(row);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(row: any): Order {
    return Order.reconstitute({
      id: row.id,
      customerId: row.customerId,
      status: row.status,
      totalAmount: Number(row.totalAmount),
      items: row.items.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (i: any) =>
          OrderItem.create({
            productId: i.productId,
            name: i.name,
            quantity: i.quantity,
            unitPrice: Number(i.unitPrice),
          }),
      ),
      shippingAddress: ShippingAddress.create({
        street: row.shippingStreet,
        city: row.shippingCity,
        state: row.shippingState,
        zipCode: row.shippingZipCode,
        country: row.shippingCountry,
      }),
      attributes: new AttributeBag(row.attributes ?? {}),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
