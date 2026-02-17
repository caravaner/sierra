import type { PrismaClient } from "@sierra/db";
import { InventoryItem, type InventoryRepository } from "@sierra/domain";

export class PrismaInventoryRepository implements InventoryRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<InventoryItem | null> {
    const row = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByProductId(productId: string): Promise<InventoryItem | null> {
    const row = await this.prisma.inventoryItem.findUnique({
      where: { productId },
    });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findAll(params?: {
    lowStock?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<InventoryItem[]> {
    const rows = await this.prisma.inventoryItem.findMany({
      take: params?.limit ?? 20,
      skip: params?.offset ?? 0,
      orderBy: { updatedAt: "desc" },
    });

    const items = rows.map((r) => this.toDomain(r));
    if (params?.lowStock) {
      return items.filter((i) => i.needsReorder);
    }
    return items;
  }

  async count(params?: { lowStock?: boolean }): Promise<number> {
    if (params?.lowStock) {
      // Need to filter in app layer since Prisma can't do computed column filtering
      const all = await this.prisma.inventoryItem.findMany();
      return all.filter((r) => r.quantityOnHand - r.quantityReserved <= r.reorderPoint).length;
    }
    return this.prisma.inventoryItem.count();
  }

  async save(entity: InventoryItem): Promise<InventoryItem> {
    const row = await this.prisma.inventoryItem.upsert({
      where: { id: entity.id },
      create: {
        id: entity.id,
        productId: entity.productId,
        quantityOnHand: entity.quantityOnHand,
        quantityReserved: entity.quantityReserved,
        reorderPoint: entity.reorderPoint,
      },
      update: {
        quantityOnHand: entity.quantityOnHand,
        quantityReserved: entity.quantityReserved,
        reorderPoint: entity.reorderPoint,
      },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.inventoryItem.delete({ where: { id } });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(row: any): InventoryItem {
    return InventoryItem.create({
      id: row.id,
      productId: row.productId,
      quantityOnHand: row.quantityOnHand,
      quantityReserved: row.quantityReserved,
      reorderPoint: row.reorderPoint,
      updatedAt: row.updatedAt,
    });
  }
}
