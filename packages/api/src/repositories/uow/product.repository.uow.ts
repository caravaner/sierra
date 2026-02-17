import type { PrismaClient } from "@sierra/db";
import {
  Product,
  AttributeBag,
  type ProductRepository,
  type UowRepository,
} from "@sierra/domain";
import type { PrismaUnitOfWork } from "../../uow/unit-of-work";

export class UowProductRepository implements ProductRepository, UowRepository<Product> {
  constructor(
    private prisma: PrismaClient,
    private uow: PrismaUnitOfWork,
  ) {}

  async findById(id: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({ where: { id } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findBySku(sku: string): Promise<Product | null> {
    const row = await this.prisma.product.findUnique({ where: { sku } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findAll(params?: {
    category?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    const rows = await this.prisma.product.findMany({
      where: {
        category: params?.category,
        isActive: params?.isActive,
      },
      take: params?.limit ?? 20,
      skip: params?.offset ?? 0,
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async count(params?: { category?: string; isActive?: boolean }): Promise<number> {
    return this.prisma.product.count({
      where: {
        category: params?.category,
        isActive: params?.isActive,
      },
    });
  }

  async save(entity: Product): Promise<Product> {
    this.uow.track(entity, this);
    return entity;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async saveWithTx(tx: any, entity: Product): Promise<Product> {
    const row = await tx.product.upsert({
      where: { id: entity.id },
      create: {
        id: entity.id,
        name: entity.name,
        description: entity.description,
        price: entity.price,
        sku: entity.sku,
        category: entity.category,
        images: entity.images,
        isActive: entity.isActive,
        attributes: entity.attributes.toJSON(),
      },
      update: {
        name: entity.name,
        description: entity.description,
        price: entity.price,
        category: entity.category,
        images: entity.images,
        isActive: entity.isActive,
        attributes: entity.attributes.toJSON(),
      },
    });
    return this.toDomain(row);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(row: any): Product {
    return Product.reconstitute({
      id: row.id,
      name: row.name,
      description: row.description,
      price: Number(row.price),
      sku: row.sku,
      category: row.category,
      images: row.images,
      isActive: row.isActive,
      attributes: new AttributeBag(row.attributes ?? {}),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
