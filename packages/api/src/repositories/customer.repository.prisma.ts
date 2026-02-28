import type { PrismaClient } from "@sierra/db";
import { Customer, AttributeBag, type CustomerRepository } from "@sierra/domain";

export class PrismaCustomerRepository implements CustomerRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Customer | null> {
    const row = await this.prisma.customer.findUnique({
      where: { id },
      include: { addresses: true },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByUserId(userId: string): Promise<Customer | null> {
    const row = await this.prisma.customer.findUnique({
      where: { userId },
      include: { addresses: true },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const row = await this.prisma.customer.findUnique({
      where: { email },
      include: { addresses: true },
    });
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
    const row = await this.prisma.customer.upsert({
      where: { id: entity.id },
      create: {
        id: entity.id,
        userId: entity.userId,
        phone: entity.phone,
        email: entity.email,
        firstName: entity.firstName,
        lastName: entity.lastName,
        attributes: entity.attributes.toJSON(),
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
      update: {
        phone: entity.phone,
        email: entity.email,
        firstName: entity.firstName,
        lastName: entity.lastName,
        attributes: entity.attributes.toJSON(),
      },
      include: { addresses: true },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.customer.delete({ where: { id } });
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
      addresses: row.addresses.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (a: any) => ({
          id: a.id,
          street: a.street,
          city: a.city,
          state: a.state,
          isDefault: a.isDefault,
        }),
      ),
      attributes: new AttributeBag(row.attributes ?? {}),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
