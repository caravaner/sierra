import type { PrismaClient } from "@sierra/db";
import {
  Product,
  AttributeBag,
  ConcurrentModificationError,
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
    const data = {
      name: entity.name,
      description: entity.description,
      price: entity.price,
      category: entity.category,
      images: entity.images,
      isActive: entity.isActive,
      attributes: entity.attributes.toJSON(),
    };

    if (entity.version < 0) {
      await tx.product.create({
        data: { id: entity.id, sku: entity.sku, version: 0, createdAt: entity.createdAt, ...data },
      });
    } else {
      const result = await tx.product.updateMany({
        where: { id: entity.id, version: entity.version },
        data: { ...data, version: { increment: 1 } },
      });
      if (result.count === 0) throw new ConcurrentModificationError(entity.id);
    }

    return entity;
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
      version: row.version,
      attributes: new AttributeBag(row.attributes ?? {}),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
