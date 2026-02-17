import { router } from "./trpc";
import { productRouter } from "./routers/product.router";
import { orderRouter } from "./routers/order.router";
import { inventoryRouter } from "./routers/inventory.router";
import { customerRouter } from "./routers/customer.router";

export const appRouter = router({
  product: productRouter,
  order: orderRouter,
  inventory: inventoryRouter,
  customer: customerRouter,
});

export type AppRouter = typeof appRouter;
