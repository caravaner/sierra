import { z } from "zod";
import {
  CreateSubscriptionCommand,
  PauseSubscriptionCommand,
  ResumeSubscriptionCommand,
  CancelSubscriptionCommand,
} from "@sierra/domain";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { PrismaSubscriptionRepository } from "../repositories/subscription.repository.prisma";
import { PrismaCustomerRepository } from "../repositories/customer.repository.prisma";
import { runCommand } from "../commands/run-command";
import { toPrincipal } from "../commands/to-principal";

const subscriptionItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

const shippingAddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  country: z.string().default("US"),
});

export const subscriptionRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        intervalDays: z.number().int().min(1),
        nextDeliveryAt: z.date(),
        items: z.array(subscriptionItemSchema).min(1),
        shippingAddress: shippingAddressSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const principal = toPrincipal(ctx.session);
      const customerRepo = new PrismaCustomerRepository(ctx.prisma);
      const customer = await customerRepo.findByUserId(principal.id);
      if (!customer) throw new Error("Customer not found. Please complete your profile.");

      return runCommand(
        ctx.prisma,
        principal,
        (uow, { subscriptionRepo }) => new CreateSubscriptionCommand(uow, subscriptionRepo),
        {
          customerId: customer.id,
          intervalDays: input.intervalDays,
          nextDeliveryAt: input.nextDeliveryAt,
          items: input.items,
          shippingAddress: input.shippingAddress,
        },
      );
    }),

  mySubscriptions: protectedProcedure.query(async ({ ctx }) => {
    const customerRepo = new PrismaCustomerRepository(ctx.prisma);
    const customer = await customerRepo.findByUserId(ctx.session!.user.id);
    if (!customer) return { items: [] };

    const repo = new PrismaSubscriptionRepository(ctx.prisma);
    const subs = await repo.findByCustomerId(customer.id);
    return {
      items: subs.map((s) => ({
        id: s.id,
        status: s.status,
        intervalDays: s.intervalDays,
        nextDeliveryAt: s.nextDeliveryAt,
        itemCount: s.items.length,
        items: s.items.map((i) => i.value),
        shippingAddress: s.shippingAddress,
        createdAt: s.createdAt,
      })),
    };
  }),

  pause: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const principal = toPrincipal(ctx.session);
      return runCommand(
        ctx.prisma,
        principal,
        (uow, { subscriptionRepo }) => new PauseSubscriptionCommand(uow, subscriptionRepo),
        { subscriptionId: input.id },
      );
    }),

  resume: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const principal = toPrincipal(ctx.session);
      return runCommand(
        ctx.prisma,
        principal,
        (uow, { subscriptionRepo }) => new ResumeSubscriptionCommand(uow, subscriptionRepo),
        { subscriptionId: input.id },
      );
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const principal = toPrincipal(ctx.session);
      return runCommand(
        ctx.prisma,
        principal,
        (uow, { subscriptionRepo }) => new CancelSubscriptionCommand(uow, subscriptionRepo),
        { subscriptionId: input.id },
      );
    }),

  // Admin
  list: adminProcedure
    .input(
      z.object({
        status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]).optional(),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const repo = new PrismaSubscriptionRepository(ctx.prisma);
      const [subs, total] = await Promise.all([
        repo.findAll(input),
        repo.count({ status: input.status }),
      ]);
      return {
        items: subs.map((s) => ({
          id: s.id,
          customerId: s.customerId,
          status: s.status,
          intervalDays: s.intervalDays,
          nextDeliveryAt: s.nextDeliveryAt,
          itemCount: s.items.length,
          createdAt: s.createdAt,
        })),
        total,
      };
    }),
});
