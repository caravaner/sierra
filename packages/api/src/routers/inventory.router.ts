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
      const principal = toPrincipal(ctx.session);
      return runCommand(
        ctx.prisma,
        principal,
        (uow, { inventoryRepo }) =>
          new ReplenishStockCommand(uow, inventoryRepo),
        input,
      );
    }),
});
