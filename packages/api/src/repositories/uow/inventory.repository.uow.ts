import type { PrismaClient } from "@sierra/db";
import {
  InventoryItem,
  AttributeBag,
  ConcurrentModificationError,
  type InventoryRepository,
  type UowRepository,
} from "@sierra/domain";
import type { PrismaUnitOfWork } from "../../uow/unit-of-work";

export class UowInventoryRepository implements InventoryRepository, UowRepository<InventoryItem> {
  constructor(
    private prisma: PrismaClient,
    private uow: PrismaUnitOfWork,
  ) {}

  async findById(id: string): Promise<InventoryItem | null> {
    const row = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!row) return null;
    return this.toDomain(row);
  }

  async findByProductId(productId: string): Promise<InventoryItem | null> {
    const row = await this.prisma.inventoryItem.findUnique({ where: { productId } });
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
    if (params?.lowStock) return items.filter((i) => i.needsReorder);
    return items;
  }

  async count(params?: { lowStock?: boolean }): Promise<number> {
    if (params?.lowStock) {
      const all = await this.prisma.inventoryItem.findMany();
      return all.filter((r) => r.quantityOnHand - r.quantityReserved <= r.reorderPoint).length;
    }
    return this.prisma.inventoryItem.count();
  }

  async save(entity: InventoryItem): Promise<InventoryItem> {
    this.uow.track(entity, this);
    return entity;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.inventoryItem.delete({ where: { id } });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async saveWithTx(tx: any, entity: InventoryItem): Promise<InventoryItem> {
    const data = {
      quantityOnHand: entity.quantityOnHand,
      quantityReserved: entity.quantityReserved,
      reorderPoint: entity.reorderPoint,
      attributes: entity.attributes.toJSON(),
    };

    if (entity.version < 0) {
      await tx.inventoryItem.create({
        data: { id: entity.id, productId: entity.productId, version: 0, ...data },
      });
    } else {
      const result = await tx.inventoryItem.updateMany({
        where: { id: entity.id, version: entity.version },
        data: { ...data, version: { increment: 1 } },
      });
      if (result.count === 0) throw new ConcurrentModificationError(entity.id);
    }

    return entity;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(row: any): InventoryItem {
    return InventoryItem.reconstitute({
      id: row.id,
      productId: row.productId,
      quantityOnHand: row.quantityOnHand,
      quantityReserved: row.quantityReserved,
      reorderPoint: row.reorderPoint,
      version: row.version,
      attributes: new AttributeBag(row.attributes ?? {}),
      updatedAt: row.updatedAt,
    });
  }
}
