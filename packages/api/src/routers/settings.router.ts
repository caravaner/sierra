import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "../trpc";

export const settingsRouter = router({
  deliveryConfig: publicProcedure.query(async ({ ctx }) => {
    const settings = await ctx.prisma.storeSettings.findUnique({
      where: { id: "singleton" },
    });
    return {
      deliveryFee: Number(settings?.deliveryFee ?? 500),
      freeDeliveryFrom: Number(settings?.freeDeliveryFrom ?? 10000),
    };
  }),

  updateDeliveryConfig: adminProcedure
    .input(
      z.object({
        deliveryFee: z.number().min(0),
        freeDeliveryFrom: z.number().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.storeSettings.upsert({
        where: { id: "singleton" },
        create: {
          id: "singleton",
          deliveryFee: input.deliveryFee,
          freeDeliveryFrom: input.freeDeliveryFrom,
        },
        update: {
          deliveryFee: input.deliveryFee,
          freeDeliveryFrom: input.freeDeliveryFrom,
        },
      });
      return { success: true };
    }),
});
