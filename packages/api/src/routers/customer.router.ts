import { z } from "zod";
import { CustomerService } from "@sierra/domain";
import { paginationSchema } from "@sierra/shared";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { PrismaCustomerRepository } from "../repositories/customer.repository.prisma";

export const customerRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const repo = new PrismaCustomerRepository(ctx.prisma);
    const customer = await repo.findByUserId(ctx.session.user.id);
    if (!customer) return null;
    return {
      id: customer.id,
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
        email: z.string().email(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaCustomerRepository(ctx.prisma);
      const service = new CustomerService(repo);
      const customer = await service.syncUser({
        userId: ctx.session.user.id,
        ...input,
      });
      return { id: customer.id };
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
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        createdAt: c.createdAt,
      })),
      total,
    };
  }),
});
