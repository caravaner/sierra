import { z } from "zod";
import {
  PlaceOrderCommand,
  CancelOrderCommand,
  UpdateOrderStatusCommand,
  calculateDeliveryFee,
} from "@sierra/domain";
import {
  placeOrderSchema,
  updateOrderStatusSchema,
  orderFilterSchema,
} from "@sierra/shared";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { PrismaOrderRepository } from "../repositories/order.repository.prisma";
import { PrismaCustomerRepository } from "../repositories/customer.repository.prisma";
import { runCommand } from "../commands/run-command";
import { toPrincipal } from "../commands/to-principal";

export const orderRouter = router({
  myOrders: protectedProcedure.query(async ({ ctx }) => {
    const customerRepo = new PrismaCustomerRepository(ctx.prisma);
    const customer = await customerRepo.findByUserId(ctx.session.user.id);
    if (!customer) return { items: [] };

    const orderRepo = new PrismaOrderRepository(ctx.prisma);
    const orders = await orderRepo.findByCustomerId(customer.id);
    return {
      items: orders.map((o) => ({
        id: o.id,
        status: o.status.value,
        totalAmount: o.totalAmount,
        items: o.items.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        shippingAddress: o.shippingAddress.value,
        createdAt: o.createdAt,
      })),
    };
  }),

  place: protectedProcedure.input(placeOrderSchema).mutation(async ({ ctx, input }) => {
    const principal = toPrincipal(ctx.session);
    const customerRepo = new PrismaCustomerRepository(ctx.prisma);
    const customer = await customerRepo.findByUserId(principal.id);
    if (!customer) throw new Error("Customer not found. Please complete your profile.");

    const settings = await ctx.prisma.storeSettings.findUnique({ where: { id: "singleton" } });
    const config = {
      deliveryFee: Number(settings?.deliveryFee ?? 500),
      freeDeliveryFrom: Number(settings?.freeDeliveryFrom ?? 10000),
    };
    const subtotal = input.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const deliveryFee = calculateDeliveryFee(subtotal, config);

    return runCommand(
      ctx.prisma,
      principal,
      (uow, { orderRepo, inventoryRepo }) =>
        new PlaceOrderCommand(uow, orderRepo, inventoryRepo),
      { customerId: customer.id, items: input.items, shippingAddress: input.shippingAddress, deliveryFee },
    );
  }),

  cancel: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const principal = toPrincipal(ctx.session);
    return runCommand(
      ctx.prisma,
      principal,
      (uow, { orderRepo, inventoryRepo }) =>
        new CancelOrderCommand(uow, orderRepo, inventoryRepo),
      { orderId: input.id },
    );
  }),

  // Admin routes
  list: adminProcedure.input(orderFilterSchema).query(async ({ ctx, input }) => {
    const repo = new PrismaOrderRepository(ctx.prisma);
    const [orders, total] = await Promise.all([
      repo.findAll(input),
      repo.count({ status: input.status }),
    ]);
    return {
      items: orders.map((o) => ({
        id: o.id,
        customerId: o.customerId,
        status: o.status.value,
        totalAmount: o.totalAmount,
        itemCount: o.items.length,
        createdAt: o.createdAt,
      })),
      total,
    };
  }),

  updateStatus: adminProcedure
    .input(z.object({ id: z.string(), ...updateOrderStatusSchema.shape }))
    .mutation(async ({ ctx, input }) => {
      const principal = toPrincipal(ctx.session);
      return runCommand(
        ctx.prisma,
        principal,
        (uow, { orderRepo }) =>
          new UpdateOrderStatusCommand(uow, orderRepo),
        { orderId: input.id, status: input.status },
      );
    }),
});
