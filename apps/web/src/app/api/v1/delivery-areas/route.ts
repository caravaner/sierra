import { prisma } from "@sierra/db";
import { validateApiKey, apiResponse } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await validateApiKey(req);
  if (!auth.ok) return auth.response;

  const areas = await prisma.deliveryArea.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, description: true, deliveryFee: true },
  });

  return apiResponse({
    deliveryAreas: areas.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      deliveryFee: a.deliveryFee != null ? Number(a.deliveryFee) : null,
    })),
  });
}
