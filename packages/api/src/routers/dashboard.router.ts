import { router, adminProcedure } from "../trpc";
import { PrismaOrderRepository } from "../repositories/order.repository.prisma";
import { PrismaProductRepository } from "../repositories/product.repository.prisma";
import { PrismaInventoryRepository } from "../repositories/inventory.repository.prisma";

export const dashboardRouter = router({
  stats: adminProcedure.query(async ({ ctx }) => {
    const orderRepo = new PrismaOrderRepository(ctx.prisma);
    const productRepo = new PrismaProductRepository(ctx.prisma);
    const inventoryRepo = new PrismaInventoryRepository(ctx.prisma);

    const [totalOrders, totalProducts, lowStockCount, recentOrders] = await Promise.all([
      orderRepo.count({}),
      productRepo.count({}),
      inventoryRepo.count({ lowStock: true }),
      orderRepo.findAll({ limit: 5, offset: 0 }),
    ]);

    return {
      totalOrders,
      totalProducts,
      lowStockCount,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        status: o.status.value,
        totalAmount: o.totalAmount,
        itemCount: o.items.length,
        createdAt: o.createdAt,
      })),
    };
  }),
});
