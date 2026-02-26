import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure } from "../trpc";
import { getNotificationService } from "@sierra/notifications";

function notify() {
  return getNotificationService();
}

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

      if (input.email) {
        const shopUrl = process.env.APP_URL ?? "http://localhost:3100";
        void notify()
          .sendWelcome(input.email, { name: input.name, shopUrl })
          .catch(console.error);
      }

      return { id: user.id };
    }),

  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({ where: { email: input.email } });

      if (user) {
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await ctx.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
        await ctx.prisma.passwordResetToken.create({
          data: { userId: user.id, token, expiresAt },
        });

        const appUrl = process.env.APP_URL ?? "http://localhost:3100";
        const resetLink = `${appUrl}/auth/reset-password?token=${token}`;

        void notify()
          .sendPasswordReset(input.email, {
            name: user.name ?? input.email,
            resetLink,
            expiresInMinutes: 60,
          })
          .catch(console.error);
      }

      // Always return success — never reveal whether an email exists
      return { ok: true };
    }),

  resetPasswordWithToken: publicProcedure
    .input(z.object({ token: z.string(), newPassword: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      const record = await ctx.prisma.passwordResetToken.findUnique({
        where: { token: input.token },
      });

      if (!record || record.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset link. Please request a new one.",
        });
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, 12);

      await ctx.prisma.$transaction([
        ctx.prisma.user.update({
          where: { id: record.userId },
          data: { hashedPassword },
        }),
        ctx.prisma.passwordResetToken.delete({ where: { id: record.id } }),
      ]);

      return { ok: true };
    }),
});
