import { z } from "zod";
import {
  CreateProductCommand,
  UpdateProductCommand,
} from "@sierra/domain";
import {
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
} from "@sierra/shared";
import { router, publicProcedure, adminProcedure } from "../trpc";
import { PrismaProductRepository } from "../repositories/product.repository.prisma";
import { runCommand } from "../commands/run-command";
import { toPrincipal } from "../commands/to-principal";

export const productRouter = router({
  list: publicProcedure.input(productFilterSchema).query(async ({ ctx, input }) => {
    const repo = new PrismaProductRepository(ctx.prisma);
    const [products, total] = await Promise.all([
      repo.findAll({ ...input, isActive: input.isActive ?? true }),
      repo.count({ isActive: input.isActive ?? true, category: input.category }),
    ]);
    return {
      items: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        sku: p.sku,
        category: p.category,
        images: p.images,
        isActive: p.isActive,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      total,
    };
  }),

  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const repo = new PrismaProductRepository(ctx.prisma);
    const product = await repo.findById(input.id);
    if (!product) return null;
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      sku: product.sku,
      category: product.category,
      images: product.images,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }),

  create: adminProcedure.input(createProductSchema).mutation(async ({ ctx, input }) => {
    const principal = toPrincipal(ctx.session);
    return runCommand(
      ctx.prisma,
      principal,
      (uow, { productRepo }) =>
        new CreateProductCommand(uow, productRepo),
      input,
    );
  }),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: updateProductSchema }))
    .mutation(async ({ ctx, input }) => {
      const principal = toPrincipal(ctx.session);
      return runCommand(
        ctx.prisma,
        principal,
        (uow, { productRepo }) =>
          new UpdateProductCommand(uow, productRepo),
        { productId: input.id, data: input.data },
      );
    }),

  activate: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const principal = toPrincipal(ctx.session);
    const repo = new PrismaProductRepository(ctx.prisma);
    const product = await repo.findById(input.id);
    if (!product) throw new Error("Product not found");
    await repo.save(product.activate(principal.id));
    return { success: true };
  }),

  deactivate: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const principal = toPrincipal(ctx.session);
    const repo = new PrismaProductRepository(ctx.prisma);
    const product = await repo.findById(input.id);
    if (!product) throw new Error("Product not found");
    await repo.save(product.deactivate(principal.id));
    return { success: true };
  }),
});
