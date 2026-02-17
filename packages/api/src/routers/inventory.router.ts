import { z } from "zod";
import { InventoryService } from "@sierra/domain";
import { paginationSchema } from "@sierra/shared";
import { router, adminProcedure, publicProcedure } from "../trpc";
import { PrismaInventoryRepository } from "../repositories/inventory.repository.prisma";

export const inventoryRouter = router({
  checkAvailability: publicProcedure
    .input(z.object({ productId: z.string(), quantity: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaInventoryRepository(ctx.prisma);
      const service = new InventoryService(repo);
      const available = await service.checkAvailability(input.productId, input.quantity);
      return { available };
    }),

  list: adminProcedure
    .input(paginationSchema.extend({ lowStock: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaInventoryRepository(ctx.prisma);
      const [items, total] = await Promise.all([
        repo.findAll(input),
        repo.count({ lowStock: input.lowStock }),
      ]);
      return {
        items: items.map((i) => ({
          id: i.id,
          productId: i.productId,
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
      const repo = new PrismaInventoryRepository(ctx.prisma);
      const service = new InventoryService(repo);
      await service.replenishStock(input.productId, input.quantity);
      return { success: true };
    }),
});
