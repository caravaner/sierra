import { z } from "zod";
import { router, adminProcedure } from "../trpc";

function generateKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `sk_live_${hex}`;
}

export const apiKeyRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        // Never return the full key after creation — show only last 8 chars
        key: true,
        isActive: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
  }),

  create: adminProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const key = generateKey();
      const record = await ctx.prisma.apiKey.create({
        data: { name: input.name, key },
      });
      // Return full key only on creation
      return { id: record.id, name: record.name, key };
    }),

  revoke: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.apiKey.update({
        where: { id: input.id },
        data: { isActive: false },
      });
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.apiKey.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
