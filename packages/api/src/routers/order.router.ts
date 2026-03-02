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
import { getNotificationService } from "@sierra/notifications";

function notify() {
  return getNotificationService();
}

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

  myOrderStatus: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.prisma.order.findFirst({
        where: {
          id: input.orderId,
          customer: { userId: ctx.session.user.id },
        },
        select: {
          paymentStatus: true,
          paymentVerification: { select: { status: true } },
        },
      });
      if (!order) throw new Error("Order not found");
      return {
        paymentStatus: order.paymentStatus,
        verificationStatus: order.paymentVerification?.status ?? null,
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

    const result = await runCommand(
      ctx.prisma,
      principal,
      (uow, { orderRepo, inventoryRepo }) =>
        new PlaceOrderCommand(uow, orderRepo, inventoryRepo),
      { customerId: customer.id, items: input.items, shippingAddress: input.shippingAddress, deliveryFee },
    );

    // Store payment method and create verification record for bank transfers
    await ctx.prisma.order.update({
      where: { id: result.id },
      data: { paymentMethod: input.paymentMethod },
    });

    if (input.paymentMethod === "BANK_TRANSFER") {
      const subtotal = input.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
      await ctx.prisma.paymentVerification.create({
        data: {
          orderId: result.id,
          customerId: customer.id,
          amount: subtotal + deliveryFee,
        },
      });
    }

    if (customer.email) {
      const shippingAddress = [
        input.shippingAddress.street,
        input.shippingAddress.city,
        input.shippingAddress.state,
      ].join(", ");

      void notify()
        .sendOrderPlaced(customer.email, {
          name: customer.fullName,
          orderId: result.id,
          items: input.items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
          totalAmount: subtotal + deliveryFee,
          shippingAddress,
        })
        .catch(console.error);
    }

    return result;
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
    const where = input.status ? { status: input.status as never } : undefined;
    const [orders, total] = await Promise.all([
      ctx.prisma.order.findMany({
        where,
        include: { customer: { select: { firstName: true, lastName: true } } },
        take: input.limit ?? 20,
        skip: input.offset ?? 0,
        orderBy: { createdAt: "desc" },
      }),
      ctx.prisma.order.count({ where }),
    ]);
    return {
      items: orders.map((o) => ({
        id: o.id,
        customerName: [o.customer.firstName, o.customer.lastName].filter(Boolean).join(" "),
        status: o.status,
        totalAmount: o.totalAmount,
        itemCount: 0,
        createdAt: o.createdAt,
      })),
      total,
    };
  }),

  updateStatus: adminProcedure
    .input(z.object({ id: z.string(), ...updateOrderStatusSchema.shape }))
    .mutation(async ({ ctx, input }) => {
      const principal = toPrincipal(ctx.session);
      const result = await runCommand(
        ctx.prisma,
        principal,
        (uow, { orderRepo }) =>
          new UpdateOrderStatusCommand(uow, orderRepo),
        { orderId: input.id, status: input.status },
      );

      // Fire-and-forget notification
      void (async () => {
        const order = await ctx.prisma.order.findUnique({
          where: { id: input.id },
          include: { customer: true },
        });
        if (order?.customer.email) {
          await notify().sendOrderStatusChanged(order.customer.email, {
            name: `${order.customer.firstName} ${order.customer.lastName}`,
            orderId: input.id,
            newStatus: input.status as "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED",
          });
        }
      })().catch(console.error);

      return result;
    }),
});
