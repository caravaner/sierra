import { z } from "zod";

export const paginationSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const idSchema = z.object({
  id: z.string().min(1),
});

export const addressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
