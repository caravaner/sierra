# Sierra — Notifications Plan

> Scope: `packages/notifications` (new), schema additions to `@sierra/db`,
> trigger wiring in `@sierra/api`, and push-subscription API routes in `apps/web`.

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  packages/notifications                                           │
│                                                                   │
│  interfaces/                                                      │
│    EmailProvider  (send)                                          │
│    PushProvider   (send)                                          │
│                                                                   │
│  providers/                                                       │
│    email/                                                         │
│      sendgrid.ts     ← prod                                      │
│      resend.ts       ← dev or prod alternative                   │
│      mailtrap.ts     ← dev (team inbox)                          │
│      ethereal.ts     ← dev (zero-config, auto account)          │
│      console.ts      ← CI / fallback                             │
│    push/                                                          │
│      web-push.ts     ← VAPID-based Web Push (prod + staging)    │
│      console.ts      ← dev / CI fallback                        │
│                                                                   │
│  templates/                                                       │
│    order-placed.ts                                                │
│    order-status-changed.ts                                        │
│    subscription-reminder.ts                                       │
│    …                                                              │
│                                                                   │
│  notification-service.ts   ← orchestrates email + push           │
│  factory.ts                ← env-based provider selection         │
│  index.ts                                                         │
└──────────────────────────────────────────────────────────────────┘
         │                           │
         ▼                           ▼
  @sierra/api                  apps/web
  (routers / cron)             /api/push/subscribe
                               /api/push/unsubscribe
```

**Single rule:** callers only import `NotificationService` and template helpers
from `@sierra/notifications`. They never import a provider directly. Swapping
providers is a one-line env var change — no code change, no redeploy of the
notifications package.

---

## 2. Provider Options

### 2.1 Email

| Provider | Signup | Free tier | Best for |
|---|---|---|---|
| **Ethereal** | No — auto-generated SMTP account | Fully free | Zero-friction local dev; logs a clickable preview URL |
| **Mailtrap** | Yes (free) | 1,000 emails/month sandbox | Team-visible inbox; multiple devs inspect same captured emails |
| **Resend** | Yes (free) | 3,000/month, 100/day | If you also want to use it in prod; single SDK for both |
| **SendGrid** | Yes | 100 emails/day free forever | Production; widely supported |
| **Console** | None | Always free | CI pipelines, unit tests |

**Recommended local default:** `ethereal` — requires zero credentials, auto-creates
a temporary SMTP account, logs a `previewUrl` link to the terminal on every send.

**Recommended prod default:** `sendgrid` — 100/day free tier is adequate for
low-to-medium volume. Swap to `resend` if you want a more modern API.

### 2.2 Push notifications

Web Push with VAPID is the standards-based approach. Works in Chrome, Firefox,
Edge, and Safari 16.4+. No Firebase account needed, completely free.

VAPID keys are generated once:
```bash
npx web-push generate-vapid-keys
```

**Note on local dev:** The PWA service worker is disabled in `NODE_ENV=development`
(standard `@ducanh2912/next-pwa` behaviour). Web Push therefore cannot fire locally.
Use `PUSH_PROVIDER=console` in dev — push payloads log to the terminal. Test real
push in staging where the service worker is active.

---

## 3. Interfaces

### `EmailProvider`

```typescript
interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;         // plain-text fallback
  from?: string;         // overrides default sender
  replyTo?: string;
}

interface EmailSendResult {
  messageId: string;
  previewUrl?: string;   // Ethereal only
}

interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<EmailSendResult>;
}
```

### `PushProvider`

```typescript
interface StoredPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;          // deep-link on notification click
  tag?: string;          // browser deduplication key
}

interface PushSendResult {
  endpoint: string;
  status: 'sent' | 'gone' | 'failed';
  error?: string;
}

interface PushProvider {
  readonly name: string;
  send(subscription: StoredPushSubscription, payload: PushPayload): Promise<PushSendResult>;
}
```

---

## 4. `NotificationService`

```typescript
class NotificationService {
  constructor(prisma, emailProvider, pushProvider)

  // Send an email — swallows errors so notification failure never crashes a command
  async sendEmail(message: EmailMessage): Promise<void>

  // Fan-out push to all subscriptions for a user; auto-removes stale (410/404) endpoints
  async sendPushToUser(userId: string, payload: PushPayload): Promise<void>

  // Preference guards — check DB before dispatching
  async isEmailEnabled(userId: string, channel: NotificationChannel): Promise<boolean>
  async isPushEnabled(userId: string, channel: NotificationChannel): Promise<boolean>
}

type NotificationChannel = 'orderUpdates' | 'subscriptionUpdates' | 'promotions' | 'systemAlerts'
```

---

## 5. `factory.ts` — Provider Selection

Reads `EMAIL_PROVIDER` and `PUSH_PROVIDER` env vars at startup:

```
EMAIL_PROVIDER=ethereal  →  createEtherealProvider()
EMAIL_PROVIDER=mailtrap  →  createMailtrapProvider()
EMAIL_PROVIDER=resend    →  createResendProvider()
EMAIL_PROVIDER=sendgrid  →  createSendGridProvider()
EMAIL_PROVIDER=console   →  createConsoleEmailProvider()   (default)

PUSH_PROVIDER=web-push   →  createWebPushProvider()
PUSH_PROVIDER=console    →  createConsolePushProvider()    (default)
```

Exports a `getNotificationService(prisma)` singleton factory consumed by
`TRPCContext`.

---

## 6. Prisma Schema Additions

### `PushSubscription`

```prisma
model PushSubscription {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  endpoint  String   @unique
  p256dh    String
  auth      String
  userAgent String?  @map("user_agent")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("push_subscriptions")
  @@schema("main")
}
```

### `NotificationPreference`

```prisma
model NotificationPreference {
  userId                String  @id @map("user_id")

  orderUpdatesEmail     Boolean @default(true)  @map("order_updates_email")
  subscriptionEmail     Boolean @default(true)  @map("subscription_email")
  promotionsEmail       Boolean @default(false) @map("promotions_email")

  orderUpdatesPush      Boolean @default(true)  @map("order_updates_push")
  subscriptionPush      Boolean @default(true)  @map("subscription_push")
  promotionsPush        Boolean @default(false) @map("promotions_push")

  updatedAt             DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notification_preferences")
  @@schema("main")
}
```

Add to `User` model:
```prisma
pushSubscriptions      PushSubscription[]
notificationPreference NotificationPreference?
```

---

## 7. TRPCContext Extension

```typescript
// packages/api/src/trpc.ts
import type { NotificationService } from "@sierra/notifications";

export interface TRPCContext {
  prisma: PrismaClient;
  session: Session | null;
  notifications: NotificationService;   // add
}
```

Both tRPC route handlers (`apps/web` and `apps/admin`) pass
`getNotificationService(prisma)` when building the context.

---

## 8. Where Triggers Live

### Option A — In-line after `runCommand` (recommended to start)

Fire-and-forget inside the router mutation after the command succeeds. Simple,
no extra infrastructure.

```typescript
// order.router.ts — place mutation
const result = await runCommand(...)

void ctx.notifications.sendEmail({ to: customer.email, ...orderPlacedEmail(data) })
void ctx.notifications.sendPushToUser(userId, orderPlacedPush(data))
```

**Trade-off:** if the process dies between the command and the notification call,
the notification is lost. Acceptable for most notification types.

### Option B — Event-driven via DomainEvent table (more reliable)

A background cron reads unflushed `DomainEvent` rows and dispatches notifications,
providing at-least-once delivery. Add a `notifiedAt DateTime?` column to
`DomainEvent` to track processed events.

**Recommendation:** Start with Option A. Move high-value notifications (order
confirmation, delivery reminder) to Option B if reliability requirements grow.

### Cron-based triggers

Use the existing `process-subscriptions` cron pattern for:
- **Subscription placed** — after auto-processing a recurring order
- **Delivery reminder** — new cron at `/api/cron/subscription-reminders`, fires
  daily, queries subscriptions where `nextDeliveryAt` is within 48 hours and
  reminder has not yet been sent for that cycle

---

## 9. Push Subscription API Routes (apps/web)

| Route | Method | Purpose |
|---|---|---|
| `/api/push/subscribe` | POST | Browser registers a `PushSubscription` (upsert by endpoint) |
| `/api/push/unsubscribe` | POST | Browser removes its subscription |

Both routes require an authenticated session. The subscribe route accepts the
standard Web Push subscription JSON (`{ endpoint, keys: { p256dh, auth } }`).

---

## 10. Service Worker Push Handler

`@ducanh2912/next-pwa` auto-generates `public/sw.js`. Do not edit it directly.
Use `customWorkerSrc` in `next.config.js` to merge a custom file:

```javascript
// apps/web/next.config.js
withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  customWorkerSrc: "src/app/sw.ts",   // merged into the generated sw
})
```

```javascript
// apps/web/src/app/sw.ts
self.addEventListener("push", (event) => {
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/icon-192x192.svg",
      tag: data.tag,
      data: { url: data.url },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/"
  event.waitUntil(clients.openWindow(url))
})
```

---

## 11. Notification Templates

Each template is a plain TypeScript function (no React) returning
`{ subject, html, text }` for email and `{ title, body, url }` for push.

Templates to implement:
- `order-placed` — confirmation email + push
- `order-status-changed` — status update (Shipped, Delivered, Cancelled)
- `subscription-created` — welcome email for new subscriptions
- `subscription-reminder` — "Your delivery is in 2 days"
- `subscription-paused` / `subscription-cancelled`
- `low-stock-alert` — admin email only, no push

---

## 12. Notification Preferences Router

A `notificationRouter` (protected procedures) exposing:
- `getPreferences` — returns the user's `NotificationPreference` row
- `updatePreferences` — upserts toggles for each channel × email/push

Registered in `root.ts` as `notification: notificationRouter`.

---

## 13. Environment Variables

### Local / dev (`.env.local`)

```bash
# Email
EMAIL_PROVIDER=ethereal        # zero-config; or "mailtrap" for team inbox
EMAIL_FROM=noreply@sierra.local

# Mailtrap (only if EMAIL_PROVIDER=mailtrap)
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=<from mailtrap dashboard>
MAILTRAP_PASS=<from mailtrap dashboard>

# Push — console in dev (SW disabled anyway)
PUSH_PROVIDER=console

# VAPID — generate once with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:dev@sierra.local
```

### Staging / Production

```bash
# Email
EMAIL_PROVIDER=sendgrid          # or "resend"
EMAIL_FROM=noreply@yourstore.com
SENDGRID_API_KEY=SG.xxxx
# RESEND_API_KEY=re_xxxx         # if using resend instead

# Push
PUSH_PROVIDER=web-push
VAPID_PUBLIC_KEY=<prod key>
VAPID_PRIVATE_KEY=<prod key>
VAPID_SUBJECT=mailto:admin@yourstore.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<same as VAPID_PUBLIC_KEY>
```

### Provider swap reference

| Env | `EMAIL_PROVIDER` | Extra vars |
|---|---|---|
| Local (zero-config) | `ethereal` | none |
| Local (team inbox) | `mailtrap` | `MAILTRAP_USER`, `MAILTRAP_PASS` |
| Staging / Prod | `sendgrid` | `SENDGRID_API_KEY` |
| Staging / Prod alt | `resend` | `RESEND_API_KEY` |
| CI | `console` | none |

---

## 14. Implementation Steps (Ordered)

### Phase 1 — Foundation

1. Generate VAPID keys (`npx web-push generate-vapid-keys`), store in `.env`
2. Scaffold `packages/notifications` — `package.json`, `tsconfig.json`, directories
3. Write `EmailProvider` and `PushProvider` interfaces
4. Write console providers for both (no-op, logs only)
5. Write `NotificationService` (email send, push fan-out, stale cleanup)
6. Write `factory.ts` (defaults to `console` for both)
7. Export from `index.ts`
8. Add `@sierra/notifications` to `@sierra/api` dependencies
9. Extend `TRPCContext` with `notifications: NotificationService`
10. Update both tRPC route handlers to inject `getNotificationService(prisma)`
11. Add `PushSubscription` + `NotificationPreference` Prisma models; run migration
12. Add `notification` router to `root.ts`

### Phase 2 — Email

13. Implement `ethereal.ts` provider (dev default)
14. Implement `mailtrap.ts` provider (dev team option)
15. Implement `sendgrid.ts` provider (prod)
16. Implement `resend.ts` provider (prod alternative)
17. Write `order-placed` and `order-status-changed` templates
18. Wire email dispatch in `order.router.ts` (in-line, fire-and-forget)
19. Wire email dispatch in subscription router
20. Test with `EMAIL_PROVIDER=ethereal` locally; test with SendGrid in staging

### Phase 3 — Push

21. Implement `web-push.ts` provider
22. Create `/api/push/subscribe` and `/api/push/unsubscribe` route handlers
23. Create `src/app/sw.ts` custom service worker (push + notificationclick)
24. Update `next.config.js` with `customWorkerSrc`
25. Create `usePushSubscription` hook in `apps/web/src/lib/`
26. Add "Enable notifications" toggle to account settings page
27. Wire push dispatch alongside email in order/subscription routers
28. Test real push in staging (SW active in non-dev)

### Phase 4 — Subscription reminders cron

29. Write `subscription-reminder` template
30. Create `/api/cron/subscription-reminders` route handler
31. Query subscriptions where `nextDeliveryAt` within 48h, reminder not yet sent
32. Track sent state (new column on subscription or in `attributes` JSON)
33. Register cron in deployment scheduler

### Phase 5 — Preferences UI (optional)

34. Add notification preference toggles to account settings page
35. Wire to `notification.getPreferences` / `notification.updatePreferences` tRPC

---

## 15. Critical Files

| File | Why critical |
|---|---|
| `packages/notifications/src/factory.ts` | Controls which provider is active per environment; the single file to change when swapping |
| `packages/notifications/src/notification-service.ts` | All orchestration lives here — email, push fan-out, stale endpoint removal, preference guards |
| `packages/db/prisma/schema.prisma` | Must add both models and User relations before Prisma client regenerates; nothing else compiles until done |
| `packages/api/src/trpc.ts` | `TRPCContext` extension; every router mutation reads `ctx.notifications` |
| `apps/web/src/app/api/push/subscribe/route.ts` | Browser-facing subscription endpoint; requires Prisma schema in place first |
| `apps/web/next.config.js` | `customWorkerSrc` wires the push event handler into the generated SW; also needs `@sierra/notifications` in `transpilePackages` |
