import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const cartRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const cart = await ctx.prisma.cart.findUnique({
      where: { userId: ctx.session.user.id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, price: true, images: true },
            },
          },
        },
      },
    });

    if (!cart) return { items: [] };

    return {
      items: cart.items.map((item) => ({
        productId: item.productId,
        name: item.product.name,
        price: Number(item.product.price),
        image: item.product.images[0] ?? null,
        quantity: item.quantity,
      })),
    };
  }),

  addItem: protectedProcedure
    .input(z.object({ productId: z.string(), quantity: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const cart = await ctx.prisma.cart.upsert({
        where: { userId: ctx.session.user.id },
        create: { userId: ctx.session.user.id },
        update: {},
      });

      await ctx.prisma.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId: input.productId } },
        create: { cartId: cart.id, productId: input.productId, quantity: input.quantity },
        update: { quantity: { increment: input.quantity } },
      });

      return { success: true };
    }),

  updateQuantity: protectedProcedure
    .input(z.object({ productId: z.string(), quantity: z.number().int().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const cart = await ctx.prisma.cart.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!cart) return { success: true };

      if (input.quantity === 0) {
        await ctx.prisma.cartItem.deleteMany({
          where: { cartId: cart.id, productId: input.productId },
        });
      } else {
        await ctx.prisma.cartItem.update({
          where: { cartId_productId: { cartId: cart.id, productId: input.productId } },
          data: { quantity: input.quantity },
        });
      }

      return { success: true };
    }),

  removeItem: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const cart = await ctx.prisma.cart.findUnique({
        where: { userId: ctx.session.user.id },
      });
      if (!cart) return { success: true };

      await ctx.prisma.cartItem.deleteMany({
        where: { cartId: cart.id, productId: input.productId },
      });

      return { success: true };
    }),

  clear: protectedProcedure.mutation(async ({ ctx }) => {
    const cart = await ctx.prisma.cart.findUnique({
      where: { userId: ctx.session.user.id },
    });
    if (!cart) return { success: true };

    await ctx.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { success: true };
  }),

  merge: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({ productId: z.string(), quantity: z.number().int().positive() }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.items.length === 0) return { success: true };

      const cart = await ctx.prisma.cart.upsert({
        where: { userId: ctx.session.user.id },
        create: { userId: ctx.session.user.id },
        update: {},
      });

      for (const item of input.items) {
        await ctx.prisma.cartItem.upsert({
          where: { cartId_productId: { cartId: cart.id, productId: item.productId } },
          create: { cartId: cart.id, productId: item.productId, quantity: item.quantity },
          update: { quantity: { increment: item.quantity } },
        });
      }

      return { success: true };
    }),
});
