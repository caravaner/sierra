import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const notificationRouter = router({
  registerPush: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        p256dh: z.string(),
        auth: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.pushSubscription.upsert({
        where: { endpoint: input.endpoint },
        update: {
          p256dh: input.p256dh,
          auth: input.auth,
        },
        create: {
          userId: ctx.session.user.id,
          endpoint: input.endpoint,
          p256dh: input.p256dh,
          auth: input.auth,
        },
      });
      return { ok: true };
    }),

  removePush: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.pushSubscription.deleteMany({
        where: { endpoint: input.endpoint, userId: ctx.session.user.id },
      });
      return { ok: true };
    }),
});
