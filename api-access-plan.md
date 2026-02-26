# Plan: `apps/api` — Dedicated API Server (`api.mystore.com`)

## Why a separate app

Next.js parses the request body before your handler runs, which destroys the raw
bytes needed to verify webhook signatures (Stripe, Shippo, Twilio, etc.).  A
standalone Hono server gives us direct access to the raw body, a clean place to
receive all external traffic, and an independently scalable Cloud Run service.

---

## Technology choice

**Hono** — lightweight TypeScript HTTP framework, runs on Node, Bun, and edge
runtimes.  It has first-class middleware support, typed routing, and works as a
plain Node HTTP server on Cloud Run.  No extra adapter needed.

---

## Directory layout

```
apps/api/
├── src/
│   ├── index.ts                  ← starts Node HTTP server, binds PORT
│   ├── app.ts                    ← Hono app: mounts all routers, global middleware
│   │
│   ├── middleware/
│   │   ├── raw-body.ts           ← buffers raw bytes onto c.set("rawBody", ...)
│   │   └── request-logger.ts     ← pino request/response log line
│   │
│   ├── webhooks/                 ← one sub-folder per external sender
│   │   ├── stripe/
│   │   │   ├── index.ts          ← Hono router, mounts at /webhooks/stripe
│   │   │   ├── verify.ts         ← stripe-signature verification (uses rawBody)
│   │   │   └── handlers.ts       ← per-event handlers (payment_intent.succeeded, …)
│   │   │
│   │   ├── shippo/               ← shipping / tracking events
│   │   │   ├── index.ts
│   │   │   ├── verify.ts
│   │   │   └── handlers.ts
│   │   │
│   │   └── twilio/               ← SMS / WhatsApp inbound messages
│   │       ├── index.ts
│   │       ├── verify.ts         ← X-Twilio-Signature HMAC check
│   │       └── handlers.ts
│   │
│   └── lib/
│       └── dispatch.ts           ← thin helper: creates UoW + runs a Command
│
├── package.json
├── tsconfig.json
└── Dockerfile
```

New integration (e.g. SendGrid inbound email) = add one folder under `webhooks/`,
register the router in `app.ts`.  Nothing else changes.

---

## Step 1 — Package scaffold

**`apps/api/package.json`**

```json
{
  "name": "@sierra/api-server",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "dev":        "tsx watch src/index.ts",
    "build":      "tsc",
    "start":      "node dist/index.js",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@hono/node-server": "^1.13.0",
    "hono":              "^4.6.0",
    "@sierra/api":       "workspace:*",
    "@sierra/db":        "workspace:*",
    "@sierra/domain":    "workspace:*",
    "@sierra/logger":    "workspace:*"
  },
  "devDependencies": {
    "@sierra/tsconfig": "workspace:*",
    "@types/node":      "^22.0.0",
    "tsx":              "^4.0.0",
    "typescript":       "^5.6.0"
  }
}
```

**`apps/api/tsconfig.json`** — extends `../../tooling/typescript/tsconfig.base.json`,
`outDir: ./dist`, `rootDir: ./src`.

---

## Step 2 — Entry point and Hono app

**`src/index.ts`**

```typescript
import { serve } from "@hono/node-server";
import { logger } from "@sierra/logger";
import { app } from "./app";

const port = Number(process.env.PORT ?? 8080);
serve({ fetch: app.fetch, port });
logger.info({ port }, "api-server.start");
```

**`src/app.ts`**

```typescript
import { Hono } from "hono";
import { requestLogger } from "./middleware/request-logger";
import { stripeRouter }  from "./webhooks/stripe";
import { shippoRouter }  from "./webhooks/shippo";
import { twilioRouter }  from "./webhooks/twilio";

export const app = new Hono();

app.use("*", requestLogger());

app.route("/webhooks/stripe", stripeRouter);
app.route("/webhooks/shippo", shippoRouter);
app.route("/webhooks/twilio", twilioRouter);

app.get("/health", (c) => c.json({ ok: true }));
```

---

## Step 3 — Middleware

**`src/middleware/raw-body.ts`**

Reads `req.body` as an `ArrayBuffer` and stashes it as both a `Buffer` and the
parsed JSON.  Must run before any route handler that needs signature verification.

```typescript
import { createMiddleware } from "hono/factory";

export const rawBody = () =>
  createMiddleware(async (c, next) => {
    const buf = Buffer.from(await c.req.arrayBuffer());
    c.set("rawBody", buf);
    await next();
  });
```

**`src/middleware/request-logger.ts`**

```typescript
import { createMiddleware } from "hono/factory";
import { logger } from "@sierra/logger";

export const requestLogger = () =>
  createMiddleware(async (c, next) => {
    const t0 = Date.now();
    await next();
    logger.info({
      method: c.req.method,
      path:   c.req.path,
      status: c.res.status,
      ms:     Date.now() - t0,
    }, "http.request");
  });
```

---

## Step 4 — Controller pattern (Stripe example)

Each controller follows the same three-file structure.

**`src/webhooks/stripe/verify.ts`**
```typescript
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export function verifyStripeSignature(rawBody: Buffer, sig: string): Stripe.Event {
  return stripe.webhooks.constructEvent(
    rawBody,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );
}
```

**`src/webhooks/stripe/handlers.ts`**
```typescript
import type Stripe from "stripe";
import { dispatch } from "../../lib/dispatch";

export async function onPaymentIntentSucceeded(event: Stripe.Event) {
  const intent = event.data.object as Stripe.PaymentIntent;
  // e.g. dispatch a MarkOrderPaidCommand
  await dispatch("MarkOrderPaid", { paymentIntentId: intent.id });
}
```

**`src/webhooks/stripe/index.ts`**
```typescript
import { Hono } from "hono";
import { rawBody } from "../../middleware/raw-body";
import { verifyStripeSignature } from "./verify";
import { onPaymentIntentSucceeded } from "./handlers";
import { logger } from "@sierra/logger";

export const stripeRouter = new Hono();

stripeRouter.post("/", rawBody(), async (c) => {
  const sig = c.req.header("stripe-signature") ?? "";
  const buf = c.get("rawBody") as Buffer;

  let event;
  try {
    event = verifyStripeSignature(buf, sig);
  } catch (err) {
    logger.warn({ err }, "stripe.webhook.sig_invalid");
    return c.json({ error: "Invalid signature" }, 400);
  }

  logger.info({ type: event.type, id: event.id }, "stripe.webhook.received");

  switch (event.type) {
    case "payment_intent.succeeded":
      await onPaymentIntentSucceeded(event);
      break;
    default:
      logger.info({ type: event.type }, "stripe.webhook.unhandled");
  }

  return c.json({ ok: true });
});
```

The Shippo and Twilio routers follow the exact same shape — verify → log → switch on event type → dispatch command.

---

## Step 5 — Dispatch helper

**`src/lib/dispatch.ts`**

Bridges the webhook layer into the existing command/UoW pattern.

```typescript
import { prisma } from "@sierra/db";
import { PrismaUnitOfWork } from "@sierra/api";

export async function dispatch(commandName: string, params: unknown) {
  const uow = new PrismaUnitOfWork(prisma);
  // Resolve and run the appropriate command.
  // Concrete implementation depends on the command registry in @sierra/api.
}
```

---

## Step 6 — Dockerfile

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN pnpm --filter @sierra/api-server build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules    ./node_modules
EXPOSE 8080
CMD ["node", "dist/index.js"]
```

---

## Step 7 — DNS + Cloud Run

1. Deploy `apps/api` as a new Cloud Run service: `sierra-api`
2. In Cloudflare, add:
   ```
   api.mystore.com   CNAME   sierra-api-xxxx.run.app   (proxied)
   ```
3. Add `api.mystore.com` as a custom domain mapping in Cloud Run console
4. Cloudflare handles SSL termination automatically

---

## Environment variables required

| Variable | Used by |
|---|---|
| `PORT` | `index.ts` (default 8080) |
| `DATABASE_URL` | `@sierra/db` |
| `STRIPE_SECRET_KEY` | Stripe client |
| `STRIPE_WEBHOOK_SECRET` | Signature verification |
| `SHIPPO_WEBHOOK_SECRET` | Shippo verification |
| `TWILIO_AUTH_TOKEN` | Twilio HMAC verification |

---

## Adding a new integration later

1. `mkdir src/webhooks/sendgrid`
2. Add `verify.ts`, `handlers.ts`, `index.ts` (copy Stripe as template)
3. Register in `app.ts`: `app.route("/webhooks/sendgrid", sendgridRouter)`
4. Add webhook URL `api.mystore.com/webhooks/sendgrid` in the provider dashboard

No other files change.

---

## Critical files

| File | Purpose |
|---|---|
| `apps/api/src/app.ts` | Router registry — all controllers mounted here |
| `apps/api/src/middleware/raw-body.ts` | Raw body capture for signature verification |
| `apps/api/src/webhooks/*/index.ts` | One per integration — verify + dispatch |
| `apps/api/src/lib/dispatch.ts` | Bridge from webhook layer to domain commands |
| `apps/api/Dockerfile` | Cloud Run container |
