import { prisma } from "@sierra/db";
import { validateApiKey, apiResponse, apiError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await validateApiKey(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id, isActive: true },
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
  });

  if (!product) return apiError("Product not found", 404);

  return apiResponse({
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    sku: product.sku,
    images: product.images,
    volumeMl: product.volumeMl,
    unitsPerPack: product.unitsPerPack,
    brand: product.brand,
    productType: product.productType,
    quantityAvailable: product.inventory
      ? Math.max(0, product.inventory.quantityOnHand - product.inventory.quantityReserved)
      : 0,
  });
}
