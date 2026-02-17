import { z } from "zod";
import { OrderService, InventoryService } from "@sierra/domain";
import {
  placeOrderSchema,
  updateOrderStatusSchema,
  orderFilterSchema,
} from "@sierra/shared";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { PrismaOrderRepository } from "../repositories/order.repository.prisma";
import { PrismaInventoryRepository } from "../repositories/inventory.repository.prisma";
import { PrismaCustomerRepository } from "../repositories/customer.repository.prisma";

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
    const customerRepo = new PrismaCustomerRepository(ctx.prisma);
    const customer = await customerRepo.findByUserId(ctx.session.user.id);
    if (!customer) throw new Error("Customer not found. Please complete your profile.");

    const orderRepo = new PrismaOrderRepository(ctx.prisma);
    const inventoryRepo = new PrismaInventoryRepository(ctx.prisma);
    const inventoryService = new InventoryService(inventoryRepo);
    const orderService = new OrderService(orderRepo, inventoryService);

    const order = await orderService.placeOrder({
      customerId: customer.id,
      items: input.items,
      shippingAddress: input.shippingAddress,
    });

    return { id: order.id };
  }),

  cancel: protectedProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const orderRepo = new PrismaOrderRepository(ctx.prisma);
    const inventoryRepo = new PrismaInventoryRepository(ctx.prisma);
    const inventoryService = new InventoryService(inventoryRepo);
    const orderService = new OrderService(orderRepo, inventoryService);

    await orderService.cancelOrder(input.id);
    return { success: true };
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
      const orderRepo = new PrismaOrderRepository(ctx.prisma);
      const inventoryRepo = new PrismaInventoryRepository(ctx.prisma);
      const inventoryService = new InventoryService(inventoryRepo);
      const orderService = new OrderService(orderRepo, inventoryService);

      await orderService.updateOrderStatus(input.id, input.status);
      return { success: true };
    }),
});
