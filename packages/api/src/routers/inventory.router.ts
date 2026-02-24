import { z } from "zod";
import { ReplenishStockCommand } from "@sierra/domain";
import { paginationSchema } from "@sierra/shared";
import { router, adminProcedure, publicProcedure } from "../trpc";
import { PrismaInventoryRepository } from "../repositories/inventory.repository.prisma";
import { runCommand } from "../commands/run-command";
import { toPrincipal } from "../commands/to-principal";

export const inventoryRouter = router({
  checkAvailability: publicProcedure
    .input(z.object({ productId: z.string(), quantity: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaInventoryRepository(ctx.prisma);
      const item = await repo.findByProductId(input.productId);
      if (!item) return { available: false };
      return { available: item.quantityAvailable >= input.quantity };
    }),

  list: adminProcedure
    .input(paginationSchema.extend({ lowStock: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaInventoryRepository(ctx.prisma);
      const [items, total] = await Promise.all([
        repo.findAll(input),
        repo.count({ lowStock: input.lowStock }),
      ]);

      const productIds = items.map((i) => i.productId);
      const products = await ctx.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true },
      });
      const productMap = new Map(products.map((p) => [p.id, p.name]));

      return {
        items: items.map((i) => ({
          id: i.id,
          productId: i.productId,
          productName: productMap.get(i.productId) ?? i.productId,
          quantityOnHand: i.quantityOnHand,
          quantityReserved: i.quantityReserved,
          quantityAvailable: i.quantityAvailable,
          reorderPoint: i.reorderPoint,
          needsReorder: i.needsReorder,
        })),
        total,
      };
    }),

  replenish: adminProcedure
    .input(z.object({ productId: z.string(), quantity: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const principal = toPrincipal(ctx.session);
      return runCommand(
        ctx.prisma,
        principal,
        (uow, { inventoryRepo }) =>
          new ReplenishStockCommand(uow, inventoryRepo),
        input,
      );
    }),

  update: adminProcedure
    .input(z.object({ productId: z.string(), reorderPoint: z.number().int().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const principal = toPrincipal(ctx.session);
      const repo = new PrismaInventoryRepository(ctx.prisma);
      const item = await repo.findByProductId(input.productId);
      if (!item) throw new Error("Inventory record not found");
      await repo.save(item.setReorderPoint(input.reorderPoint));
      return { success: true };
    }),

  // Products that have no inventory record yet — used by the "Add to Inventory" dialog
  productsWithoutInventory: adminProcedure.query(async ({ ctx }) => {
    const products = await ctx.prisma.product.findMany({
      where: { inventory: null },
      select: { id: true, name: true, sku: true },
      orderBy: { name: "asc" },
    });
    return products;
  }),

  // Create a new inventory record for a product
  create: adminProcedure
    .input(z.object({ productId: z.string(), reorderPoint: z.number().int().min(0).default(10) }))
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.prisma.product.findUnique({ where: { id: input.productId } });
      if (!product) throw new Error("Product not found");

      const existing = await ctx.prisma.inventoryItem.findUnique({ where: { productId: input.productId } });
      if (existing) throw new Error("Inventory already exists for this product");

      await ctx.prisma.inventoryItem.create({
        data: {
          id: crypto.randomUUID(),
          productId: input.productId,
          quantityOnHand: 0,
          quantityReserved: 0,
          reorderPoint: input.reorderPoint,
          attributes: {},
        },
      });
      return { success: true };
    }),
});
