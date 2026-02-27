import { router } from "./trpc";
import { productRouter } from "./routers/product.router";
import { orderRouter } from "./routers/order.router";
import { inventoryRouter } from "./routers/inventory.router";
import { customerRouter } from "./routers/customer.router";
import { authRouter } from "./routers/auth.router";
import { cartRouter } from "./routers/cart.router";
import { settingsRouter } from "./routers/settings.router";
import { subscriptionRouter } from "./routers/subscription.router";
import { invoiceRouter } from "./routers/invoice.router";
import { dashboardRouter } from "./routers/dashboard.router";
import { userRouter } from "./routers/user.router";
import { notificationRouter } from "./routers/notification.router";
import { paymentRouter } from "./routers/payment.router";
import { brandRouter, productTypeRouter } from "./routers/brand.router";

export const appRouter = router({
  product: productRouter,
  order: orderRouter,
  inventory: inventoryRouter,
  customer: customerRouter,
  auth: authRouter,
  cart: cartRouter,
  settings: settingsRouter,
  subscription: subscriptionRouter,
  invoice: invoiceRouter,
  dashboard: dashboardRouter,
  user: userRouter,
  notification: notificationRouter,
  payment: paymentRouter,
  brand: brandRouter,
  productType: productTypeRouter,
});

export type AppRouter = typeof appRouter;
