import { z } from "zod";
import { addressSchema } from "./common.schema";

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.number().nonnegative(),
});

export const placeOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  shippingAddress: addressSchema,
  paymentMethod: z.enum(["BANK_TRANSFER", "ONLINE"]).default("BANK_TRANSFER"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ]),
});

export const orderFilterSchema = z.object({
  status: z
    .enum([
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ])
    .optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderFilterInput = z.infer<typeof orderFilterSchema>;
