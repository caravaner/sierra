import type { PrismaClient } from "@sierra/db";
import {
  Customer,
  AttributeBag,
  ConcurrentModificationError,
  type CustomerRepository,
  type UowRepository,
} from "@sierra/domain";
import type { PrismaUnitOfWork } from "../../uow/unit-of-work";

export class UowCustomerRepository implements CustomerRepository, UowRepository<Customer> {
  constructor(
    private prisma: PrismaClient,
    private uow: PrismaUnitOfWork,
  ) {}

  async findById(id: string): Promise<Customer | null> {
    const row = await this.prisma.customer.findUnique({ where: { id }, include: { addresses: true } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByUserId(userId: string): Promise<Customer | null> {
    const row = await this.prisma.customer.findUnique({ where: { userId }, include: { addresses: true } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const row = await this.prisma.customer.findUnique({ where: { email }, include: { addresses: true } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findAll(params?: { limit?: number; offset?: number }): Promise<Customer[]> {
    const rows = await this.prisma.customer.findMany({
      include: { addresses: true },
      take: params?.limit ?? 20,
      skip: params?.offset ?? 0,
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async count(): Promise<number> {
    return this.prisma.customer.count();
  }

  async save(entity: Customer): Promise<Customer> {
    this.uow.track(entity, this);
    return entity;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.customer.delete({ where: { id } });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async saveWithTx(tx: any, entity: Customer): Promise<Customer> {
    const data = {
      phone: entity.phone,
      email: entity.email,
      firstName: entity.firstName,
      lastName: entity.lastName,
      attributes: entity.attributes.toJSON(),
    };

    if (entity.version < 0) {
      await tx.customer.create({
        data: {
          id: entity.id,
          userId: entity.userId,
          version: 0,
          createdAt: entity.createdAt,
          ...data,
          addresses: {
            create: entity.addresses.map((a) => ({
              id: a.id,
              street: a.street,
              city: a.city,
              state: a.state,
              isDefault: a.isDefault,
            })),
          },
        },
      });
    } else {
      const result = await tx.customer.updateMany({
        where: { id: entity.id, version: entity.version },
        data: { ...data, version: { increment: 1 } },
      });
      if (result.count === 0) throw new ConcurrentModificationError(entity.id);
    }

    return entity;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(row: any): Customer {
    return Customer.reconstitute({
      id: row.id,
      userId: row.userId,
      phone: row.phone,
      email: row.email ?? undefined,
      firstName: row.firstName,
      lastName: row.lastName,
      version: row.version,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addresses: row.addresses.map((a: any) => ({
        id: a.id,
        street: a.street,
        city: a.city,
        state: a.state,
        isDefault: a.isDefault,
      })),
      attributes: new AttributeBag(row.attributes ?? {}),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
