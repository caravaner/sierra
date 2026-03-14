import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "../trpc";

export const deliveryAreaRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.deliveryArea.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        deliveryFee: true,
      },
    });
  }),

  adminList: adminProcedure.query(async ({ ctx }) => {
    const areas = await ctx.prisma.deliveryArea.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { addresses: true } } },
    });
    return areas.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      deliveryFee: a.deliveryFee,
      isActive: a.isActive,
      sortOrder: a.sortOrder,
      addressCount: a._count.addresses,
    }));
  }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        deliveryFee: z.number().nonnegative().optional(),
        sortOrder: z.number().int().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.deliveryArea.create({
        data: {
          name: input.name,
          description: input.description,
          deliveryFee: input.deliveryFee,
          sortOrder: input.sortOrder,
        },
      });
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        deliveryFee: z.number().nonnegative().nullable().optional(),
        sortOrder: z.number().int().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.deliveryArea.update({ where: { id }, data });
    }),
});
