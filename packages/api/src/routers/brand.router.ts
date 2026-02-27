import { z } from "zod";
import {
  createBrandSchema,
  updateBrandSchema,
  createProductTypeSchema,
  updateProductTypeSchema,
} from "@sierra/shared";
import { router, publicProcedure, adminProcedure } from "../trpc";

// ─── Brands ───────────────────────────────────────────────────────────────────

const brandRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const brands = await ctx.prisma.brand.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
    return brands.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logo: b.logo,
      description: b.description,
      sortOrder: b.sortOrder,
      productCount: b._count.products,
    }));
  }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const brand = await ctx.prisma.brand.findUnique({
        where: { slug: input.slug },
        include: {
          products: {
            where: { isActive: true },
            include: { productType: true },
            orderBy: [{ productTypeId: "asc" }, { volumeMl: "asc" }, { name: "asc" }],
          },
        },
      });
      if (!brand) return null;
      return {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
        description: brand.description,
        products: brand.products.map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          sku: p.sku,
          images: p.images,
          volumeMl: p.volumeMl,
          unitsPerPack: p.unitsPerPack,
          productType: p.productType
            ? { id: p.productType.id, name: p.productType.name, slug: p.productType.slug }
            : null,
        })),
      };
    }),

  adminList: adminProcedure.query(async ({ ctx }) => {
    const brands = await ctx.prisma.brand.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    });
    return brands.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      logo: b.logo,
      description: b.description,
      sortOrder: b.sortOrder,
      isActive: b.isActive,
      productCount: b._count.products,
      createdAt: b.createdAt,
    }));
  }),

  create: adminProcedure.input(createBrandSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.brand.create({ data: input });
  }),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: updateBrandSchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.brand.update({ where: { id: input.id }, data: input.data });
    }),

  toggleActive: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const brand = await ctx.prisma.brand.findUniqueOrThrow({ where: { id: input.id } });
      return ctx.prisma.brand.update({
        where: { id: input.id },
        data: { isActive: !brand.isActive },
      });
    }),
});

// ─── Product Types ─────────────────────────────────────────────────────────────

const productTypeRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const types = await ctx.prisma.productType.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
    return types.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      sortOrder: t.sortOrder,
      productCount: t._count.products,
    }));
  }),

  adminList: adminProcedure.query(async ({ ctx }) => {
    const types = await ctx.prisma.productType.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: true } } },
    });
    return types.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      sortOrder: t.sortOrder,
      isActive: t.isActive,
      productCount: t._count.products,
      createdAt: t.createdAt,
    }));
  }),

  create: adminProcedure.input(createProductTypeSchema).mutation(async ({ ctx, input }) => {
    return ctx.prisma.productType.create({ data: input });
  }),

  update: adminProcedure
    .input(z.object({ id: z.string(), data: updateProductTypeSchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.productType.update({ where: { id: input.id }, data: input.data });
    }),

  toggleActive: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const pt = await ctx.prisma.productType.findUniqueOrThrow({ where: { id: input.id } });
      return ctx.prisma.productType.update({
        where: { id: input.id },
        data: { isActive: !pt.isActive },
      });
    }),
});

export { brandRouter, productTypeRouter };
