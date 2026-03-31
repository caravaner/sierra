import { NextResponse } from "next/server";
import { prisma } from "@sierra/db";
import { validateApiKey, apiResponse, apiError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await validateApiKey(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
  const offset = Number(searchParams.get("offset") ?? 0);
  const category = searchParams.get("category") ?? undefined;

  const where = {
    isActive: true,
    ...(category ? { category } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        sku: true,
        images: true,
        volumeMl: true,
        unitsPerPack: true,
        brand: { select: { name: true, slug: true } },
        productType: { select: { name: true, slug: true } },
        inventory: { select: { quantityOnHand: true, quantityReserved: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return apiResponse({
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      sku: p.sku,
      images: p.images,
      volumeMl: p.volumeMl,
      unitsPerPack: p.unitsPerPack,
      brand: p.brand,
      productType: p.productType,
      quantityAvailable: p.inventory
        ? Math.max(0, p.inventory.quantityOnHand - p.inventory.quantityReserved)
        : 0,
    })),
    meta: { total, limit, offset },
  });
}
