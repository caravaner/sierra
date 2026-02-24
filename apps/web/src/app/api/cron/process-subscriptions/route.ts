import { NextResponse } from "next/server";
import { prisma } from "@sierra/db";
import { PlaceOrderCommand, calculateDeliveryFee, AttributeBag } from "@sierra/domain";
import {
  PrismaSubscriptionRepository,
  PrismaUnitOfWork,
  UowOrderRepository,
  UowInventoryRepository,
  UowSubscriptionRepository,
} from "@sierra/api";

const SYSTEM_PRINCIPAL = {
  id: "system",
  email: "system@sierra.internal",
  name: null,
  role: "ADMIN" as const,
  attributes: AttributeBag.empty(),
};

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const subRepo = new PrismaSubscriptionRepository(prisma);
  const due = await subRepo.findDue(new Date());

  const settings = await prisma.storeSettings.findUnique({ where: { id: "singleton" } });
  const deliveryConfig = {
    deliveryFee: Number(settings?.deliveryFee ?? 500),
    freeDeliveryFrom: Number(settings?.freeDeliveryFrom ?? 10000),
  };

  let processed = 0;
  const errors: string[] = [];

  for (const sub of due) {
    try {
      const uow = new PrismaUnitOfWork(prisma);
      const orderRepo = new UowOrderRepository(prisma, uow);
      const inventoryRepo = new UowInventoryRepository(prisma, uow);
      const subscriptionRepo = new UowSubscriptionRepository(prisma, uow);

      const subtotal = sub.items.reduce((s, i) => s + i.lineTotal, 0);
      const deliveryFee = calculateDeliveryFee(subtotal, deliveryConfig);

      const command = new PlaceOrderCommand(uow, orderRepo, inventoryRepo);
      await command.execute(SYSTEM_PRINCIPAL, {
        customerId: sub.customerId,
        subscriptionId: sub.id,
        items: sub.items.map((i) => i.value),
        shippingAddress: sub.shippingAddress,
        deliveryFee,
      });

      const advanced = sub.advanceNextDelivery();
      await subscriptionRepo.save(advanced);

      await uow.commit({
        commandName: "ProcessSubscriptionCron",
        commandId: crypto.randomUUID(),
        principalId: SYSTEM_PRINCIPAL.id,
        timestamp: new Date(),
      });

      processed++;
    } catch (err) {
      errors.push(`sub:${sub.id} — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ processed, total: due.length, errors });
}
