import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        phone: z.string().min(1),
        email: z.string().email().optional(),
        password: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [existingPhone, existingEmail] = await Promise.all([
        ctx.prisma.user.findUnique({ where: { phone: input.phone } }),
        input.email
          ? ctx.prisma.user.findUnique({ where: { email: input.email } })
          : Promise.resolve(null),
      ]);

      if (existingPhone) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this phone number already exists.",
        });
      }
      if (existingEmail) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists.",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 12);

      const user = await ctx.prisma.user.create({
        data: {
          name: input.name,
          phone: input.phone,
          email: input.email ?? null,
          hashedPassword,
          role: "USER",
        },
      });

      return { id: user.id };
    }),
});
