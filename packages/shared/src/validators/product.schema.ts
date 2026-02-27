import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive("Price must be positive"),
  sku: z.string().min(1, "SKU is required").max(50),
  category: z.string().max(100).optional(),
  brandId: z.string().optional(),
  productTypeId: z.string().optional(),
  volumeMl: z.number().int().positive().optional(),
  unitsPerPack: z.number().int().positive().default(1),
  images: z.array(z.string().url()).default([]),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  price: z.number().positive().optional(),
  category: z.string().max(100).nullable().optional(),
  brandId: z.string().nullable().optional(),
  productTypeId: z.string().nullable().optional(),
  volumeMl: z.number().int().positive().nullable().optional(),
  unitsPerPack: z.number().int().positive().optional(),
  images: z.array(z.string().url()).optional(),
});

export const productFilterSchema = z.object({
  brandId: z.string().optional(),
  brandSlug: z.string().optional(),
  productTypeId: z.string().optional(),
  productTypeSlug: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

const slugPattern = /^[a-z0-9-]+$/;

export const createBrandSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(slugPattern, "Slug must be lowercase with dashes only"),
  logo: z.string().optional(),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().default(0),
});

export const updateBrandSchema = createBrandSchema.partial();

export const createProductTypeSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(slugPattern, "Slug must be lowercase with dashes only"),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().default(0),
});

export const updateProductTypeSchema = createProductTypeSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
export type CreateProductTypeInput = z.infer<typeof createProductTypeSchema>;
export type UpdateProductTypeInput = z.infer<typeof updateProductTypeSchema>;
