import { router } from "./trpc";
import { productRouter } from "./routers/product.router";
import { orderRouter } from "./routers/order.router";
import { inventoryRouter } from "./routers/inventory.router";
import { customerRouter } from "./routers/customer.router";
import { authRouter } from "./routers/auth.router";
import { cartRouter } from "./routers/cart.router";

export const appRouter = router({
  product: productRouter,
  order: orderRouter,
  inventory: inventoryRouter,
  customer: customerRouter,
  auth: authRouter,
  cart: cartRouter,
});

export type AppRouter = typeof appRouter;
