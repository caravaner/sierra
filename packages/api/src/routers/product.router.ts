import { z } from "zod";
import { ProductService } from "@sierra/domain";
import {
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
} from "@sierra/shared";
import { router, publicProcedure, adminProcedure } from "../trpc";
import { PrismaProductRepository } from "../repositories/product.repository.prisma";

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
    const repo = new PrismaProductRepository(ctx.prisma);
    const service = new ProductService(repo);
    const product = await service.createProduct(input);
    return { id: product.id };
  }),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: updateProductSchema }))
    .mutation(async ({ ctx, input }) => {
      const repo = new PrismaProductRepository(ctx.prisma);
      const service = new ProductService(repo);
      const product = await service.updateProduct(input.id, input.data);
      return { id: product.id };
    }),

  activate: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const repo = new PrismaProductRepository(ctx.prisma);
    const service = new ProductService(repo);
    await service.activateProduct(input.id);
    return { success: true };
  }),

  deactivate: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const repo = new PrismaProductRepository(ctx.prisma);
    const service = new ProductService(repo);
    await service.deactivateProduct(input.id);
    return { success: true };
  }),
});
