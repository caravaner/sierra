import { prisma } from "@sierra/db";
import { NextResponse } from "next/server";

export async function validateApiKey(
  req: Request,
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const key = req.headers.get("x-api-key");

  if (!key) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Missing X-Api-Key header" },
        { status: 401 },
      ),
    };
  }

  const record = await prisma.apiKey.findUnique({ where: { key, isActive: true } });

  if (!record) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid or revoked API key" },
        { status: 401 },
      ),
    };
  }

  // Fire-and-forget: update last used timestamp
  void prisma.apiKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return { ok: true };
}

export function apiResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
