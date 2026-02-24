import { z } from "zod";
import { SyncCustomerCommand, AddAddressCommand } from "@sierra/domain";
import { paginationSchema, addressSchema } from "@sierra/shared";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { PrismaCustomerRepository } from "../repositories/customer.repository.prisma";
import { runCommand } from "../commands/run-command";
import { toPrincipal } from "../commands/to-principal";

export const customerRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const repo = new PrismaCustomerRepository(ctx.prisma);
    const customer = await repo.findByUserId(ctx.session.user.id);
    if (!customer) return null;
    return {
      id: customer.id,
      phone: customer.phone,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      addresses: customer.addresses,
      createdAt: customer.createdAt,
    };
  }),

  sync: protectedProcedure
    .input(
      z.object({
        phone: z.string().min(1),
        email: z.string().email().optional(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const principal = toPrincipal(ctx.session);
      return runCommand(
        ctx.prisma,
        principal,
        (uow, { customerRepo }) =>
          new SyncCustomerCommand(uow, customerRepo),
        { userId: ctx.session.user.id, ...input },
      );
    }),

  // Address management
  addAddress: protectedProcedure
    .input(addressSchema.extend({ isDefault: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      const principal = toPrincipal(ctx.session);
      return runCommand(
        ctx.prisma,
        principal,
        (uow, { customerRepo }) =>
          new AddAddressCommand(uow, customerRepo),
        { userId: ctx.session.user.id, ...input },
      );
    }),

  updateAddress: protectedProcedure
    .input(
      z.object({
        addressId: z.string(),
        street: z.string().min(1).optional(),
        city: z.string().min(1).optional(),
        state: z.string().min(1).optional(),
        zipCode: z.string().min(1).optional(),
        country: z.string().optional(),
        isDefault: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaCustomerRepository(ctx.prisma);
      const customer = await repo.findByUserId(ctx.session.user.id);
      if (!customer) throw new Error("Customer not found.");

      const ownsAddress = customer.addresses.some((a) => a.id === input.addressId);
      if (!ownsAddress) throw new Error("Address not found.");

      const { addressId, ...data } = input;
      await ctx.prisma.address.update({
        where: { id: addressId },
        data,
      });

      return { success: true };
    }),

  deleteAddress: protectedProcedure
    .input(z.object({ addressId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaCustomerRepository(ctx.prisma);
      const customer = await repo.findByUserId(ctx.session.user.id);
      if (!customer) throw new Error("Customer not found.");

      const ownsAddress = customer.addresses.some((a) => a.id === input.addressId);
      if (!ownsAddress) throw new Error("Address not found.");

      await ctx.prisma.address.delete({ where: { id: input.addressId } });
      return { success: true };
    }),

  listAddresses: protectedProcedure.query(async ({ ctx }) => {
    const repo = new PrismaCustomerRepository(ctx.prisma);
    const customer = await repo.findByUserId(ctx.session.user.id);
    if (!customer) return { addresses: [] };
    return { addresses: customer.addresses };
  }),

  // Admin routes
  list: adminProcedure.input(paginationSchema).query(async ({ ctx, input }) => {
    const repo = new PrismaCustomerRepository(ctx.prisma);
    const [customers, total] = await Promise.all([
      repo.findAll(input),
      repo.count(),
    ]);
    return {
      items: customers.map((c) => ({
        id: c.id,
        phone: c.phone,
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        addresses: c.addresses,
        addressCount: c.addresses.length,
        createdAt: c.createdAt,
      })),
      total,
    };
  }),

  byId: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PrismaCustomerRepository(ctx.prisma);
      const customer = await repo.findById(input.id);
      if (!customer) return null;
      return {
        id: customer.id,
        userId: customer.userId,
        phone: customer.phone,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        addresses: customer.addresses,
        createdAt: customer.createdAt,
      };
    }),
});
