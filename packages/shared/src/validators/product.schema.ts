import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive("Price must be positive"),
  sku: z.string().min(1, "SKU is required").max(50),
  category: z.string().max(100).optional(),
  images: z.array(z.string().url()).default([]),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  price: z.number().positive().optional(),
  category: z.string().max(100).nullable().optional(),
  images: z.array(z.string().url()).optional(),
});

export const productFilterSchema = z.object({
  category: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilterInput = z.infer<typeof productFilterSchema>;
