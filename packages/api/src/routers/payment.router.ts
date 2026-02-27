import { z } from "zod";
import { router, adminProcedure } from "../trpc";
import { toPrincipal } from "../commands/to-principal";
import { runCommand } from "../commands/run-command";
import { UpdateOrderStatusCommand } from "@sierra/domain";
import { PrismaOrderRepository } from "../repositories/order.repository.prisma";
import { getNotificationService } from "@sierra/notifications";

function notify() {
  return getNotificationService();
}

export const paymentRouter = router({
  list: adminProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "CONFIRMED", "DENIED"]).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.prisma.paymentVerification.findMany({
        where: input.status ? { status: input.status } : undefined,
        include: {
          order: { select: { createdAt: true, paymentMethod: true } },
          customer: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });

      const total = await ctx.prisma.paymentVerification.count({
        where: input.status ? { status: input.status } : undefined,
      });

      return {
        items: items.map((v) => ({
          id: v.id,
          orderId: v.orderId,
          customerId: v.customerId,
          customerName: `${v.customer.firstName} ${v.customer.lastName}`,
          customerEmail: v.customer.email,
          amount: Number(v.amount),
          status: v.status,
          note: v.note,
          reviewedAt: v.reviewedAt,
          reviewedBy: v.reviewedBy,
          createdAt: v.createdAt,
          orderCreatedAt: v.order.createdAt,
        })),
        total,
      };
    }),

  confirm: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const verification = await ctx.prisma.paymentVerification.findUniqueOrThrow({
        where: { id: input.id },
        include: { customer: true },
      });

      const principal = toPrincipal(ctx.session);

      // Transition order status: PENDING → CONFIRMED
      await runCommand(
        ctx.prisma,
        principal,
        (uow, { orderRepo }) => new UpdateOrderStatusCommand(uow, orderRepo),
        { orderId: verification.orderId, status: "CONFIRMED" },
      );

      // Update order paymentStatus and PaymentVerification record
      await ctx.prisma.$transaction([
        ctx.prisma.order.update({
          where: { id: verification.orderId },
          data: { paymentStatus: "CONFIRMED" },
        }),
        ctx.prisma.paymentVerification.update({
          where: { id: input.id },
          data: {
            status: "CONFIRMED",
            reviewedAt: new Date(),
            reviewedBy: ctx.session.user.id,
          },
        }),
      ]);

      // Send confirmation email
      if (verification.customer.email) {
        void notify()
          .sendOrderStatusChanged(verification.customer.email, {
            name: `${verification.customer.firstName} ${verification.customer.lastName}`,
            orderId: verification.orderId,
            newStatus: "CONFIRMED",
          })
          .catch(console.error);
      }

      return { ok: true };
    }),

  deny: adminProcedure
    .input(z.object({ id: z.string(), note: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const verification = await ctx.prisma.paymentVerification.findUniqueOrThrow({
        where: { id: input.id },
        include: { customer: true },
      });

      await ctx.prisma.paymentVerification.update({
        where: { id: input.id },
        data: {
          status: "DENIED",
          note: input.note,
          reviewedAt: new Date(),
          reviewedBy: ctx.session.user.id,
        },
      });

      // Optionally notify customer — no formal "denied" template yet, skip for now
      void Promise.resolve().catch(console.error);

      return { ok: true, orderId: verification.orderId };
    }),
});
