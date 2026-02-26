import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure, protectedProcedure, publicProcedure } from "../trpc";

export const userRouter = router({
  // ── Admin ──────────────────────────────────────────────────────────────────

  list: adminProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const [users, total] = await Promise.all([
        ctx.prisma.user.findMany({
          take: input.limit,
          skip: input.offset,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        }),
        ctx.prisma.user.count(),
      ]);
      return { items: users, total };
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        phone: z.string().min(1),
        email: z.string().email().optional(),
        password: z.string().min(8),
        role: z.enum(["USER", "ADMIN", "SUPERADMIN"]).default("USER"),
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
        throw new TRPCError({ code: "CONFLICT", message: "Phone number already in use." });
      }
      if (existingEmail) {
        throw new TRPCError({ code: "CONFLICT", message: "Email already in use." });
      }

      const hashedPassword = await bcrypt.hash(input.password, 12);
      const user = await ctx.prisma.user.create({
        data: {
          name: input.name,
          phone: input.phone,
          email: input.email ?? null,
          hashedPassword,
          role: input.role,
          isActive: true,
        },
      });

      return { id: user.id };
    }),

  disable: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.user.update({
        where: { id: input.id },
        data: { isActive: false },
      });
      return { success: true };
    }),

  enable: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.user.update({
        where: { id: input.id },
        data: { isActive: true },
      });
      return { success: true };
    }),

  // Admin resets a user's password (no old password required)
  setPassword: adminProcedure
    .input(z.object({ id: z.string(), password: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      const hashedPassword = await bcrypt.hash(input.password, 12);
      await ctx.prisma.user.update({
        where: { id: input.id },
        data: { hashedPassword },
      });
      return { success: true };
    }),

  // ── Storefront (authenticated user) ───────────────────────────────────────

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { hashedPassword: true },
      });

      if (!user?.hashedPassword) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No password set on this account." });
      }

      const valid = await bcrypt.compare(input.currentPassword, user.hashedPassword);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect." });
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, 12);
      await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: { hashedPassword },
      });

      return { success: true };
    }),

  // Verify identity by phone + name match, then set a new password (forgot-password flow)
  resetPassword: publicProcedure
    .input(
      z.object({
        phone: z.string().min(1),
        name: z.string().min(1),
        newPassword: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { phone: input.phone },
        select: { id: true, name: true },
      });
      // Deliberately vague message to avoid phone enumeration
      if (!user || user.name?.toLowerCase() !== input.name.trim().toLowerCase()) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No matching account found." });
      }
      const hashedPassword = await bcrypt.hash(input.newPassword, 12);
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { hashedPassword },
      });
      return { success: true };
    }),
});
