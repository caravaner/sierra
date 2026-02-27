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
import type { Prisma } from "@sierra/db";

// ─── Shared select / where helpers ────────────────────────────────────────────

const productInclude = {
  brand: { select: { id: true, name: true, slug: true, logo: true } },
  productType: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductInclude;

function buildWhere(input: {
  brandId?: string;
  brandSlug?: string;
  productTypeId?: string;
  productTypeSlug?: string;
  isActive?: boolean;
}): Prisma.ProductWhereInput {
  return {
    isActive: input.isActive,
    brandId: input.brandId,
    brand: input.brandSlug ? { slug: input.brandSlug } : undefined,
    productTypeId: input.productTypeId,
    productType: input.productTypeSlug ? { slug: input.productTypeSlug } : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDto(p: any) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    sku: p.sku,
    category: p.category,
    images: p.images,
    isActive: p.isActive,
    volumeMl: p.volumeMl,
    unitsPerPack: p.unitsPerPack,
    brand: p.brand ?? null,
    productType: p.productType ?? null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const productRouter = router({
  // Storefront — active only
  list: publicProcedure.input(productFilterSchema).query(async ({ ctx, input }) => {
    const where = buildWhere({ ...input, isActive: true });
    const [items, total] = await Promise.all([
      ctx.prisma.product.findMany({
        where,
        include: productInclude,
        take: input.limit,
        skip: input.offset,
        orderBy: [{ brand: { sortOrder: "asc" } }, { volumeMl: "asc" }, { name: "asc" }],
      }),
      ctx.prisma.product.count({ where }),
    ]);
    return { items: items.map(toDto), total };
  }),

  // Admin — all products
  adminList: adminProcedure.input(productFilterSchema).query(async ({ ctx, input }) => {
    const where = buildWhere(input);
    const [items, total] = await Promise.all([
      ctx.prisma.product.findMany({
        where,
        include: productInclude,
        take: input.limit,
        skip: input.offset,
        orderBy: { createdAt: "desc" },
      }),
      ctx.prisma.product.count({ where }),
    ]);
    return { items: items.map(toDto), total };
  }),

  byId: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const p = await ctx.prisma.product.findUnique({
      where: { id: input.id },
      include: productInclude,
    });
    return p ? toDto(p) : null;
  }),

  create: adminProcedure.input(createProductSchema).mutation(async ({ ctx, input }) => {
    const principal = toPrincipal(ctx.session);
    const { brandId, productTypeId, volumeMl, unitsPerPack, ...domainInput } = input;

    const result = await runCommand(
      ctx.prisma,
      principal,
      (uow, { productRepo, inventoryRepo }) =>
        new CreateProductCommand(uow, productRepo, inventoryRepo),
      domainInput,
    );

    // Patch catalog metadata — these fields are not part of the domain entity
    if (brandId !== undefined || productTypeId !== undefined || volumeMl !== undefined) {
      await ctx.prisma.product.update({
        where: { id: result.id },
        data: { brandId, productTypeId, volumeMl, unitsPerPack },
      });
    }

    return result;
  }),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: updateProductSchema }))
    .mutation(async ({ ctx, input }) => {
      const principal = toPrincipal(ctx.session);
      const { brandId, productTypeId, volumeMl, unitsPerPack, ...domainData } = input.data;

      await runCommand(
        ctx.prisma,
        principal,
        (uow, { productRepo }) => new UpdateProductCommand(uow, productRepo),
        { productId: input.id, data: domainData },
      );

      // Patch catalog metadata
      const catalogPatch: Record<string, unknown> = {};
      if (brandId !== undefined) catalogPatch.brandId = brandId;
      if (productTypeId !== undefined) catalogPatch.productTypeId = productTypeId;
      if (volumeMl !== undefined) catalogPatch.volumeMl = volumeMl;
      if (unitsPerPack !== undefined) catalogPatch.unitsPerPack = unitsPerPack;

      if (Object.keys(catalogPatch).length > 0) {
        await ctx.prisma.product.update({ where: { id: input.id }, data: catalogPatch });
      }

      return { id: input.id };
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
