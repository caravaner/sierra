# Checkout & Order Lifecycle Plan

## Current State

The checkout page (`/checkout`) already handles address collection and calls `order.place`.
Orders jump straight to `PENDING` with no payment step. The order lifecycle state machine
already exists in `OrderStatus` with valid transitions:

```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
    ↘          ↘          ↘
   CANCELLED  CANCELLED  CANCELLED
```

Domain events are stored in the `DomainEvent` table (`eventlog` schema) and can be used
to reconstruct the full lifecycle history of any order at any point.

---

## 1. Order Lifecycle (Event-Driven)

### How lifecycle stage is determined

Rather than a separate status field, the current stage is derived from the latest
`Order.StatusChanged` event in the `DomainEvent` table for a given `aggregateId` (orderId).

```
DomainEvent WHERE aggregateId = :orderId
ORDER BY occurredAt DESC
LIMIT 1
→ payload.after = current stage
```

Events that mark each stage:

| Event | eventType | Trigger |
|---|---|---|
| Order placed | `Order.Placed` | User completes checkout |
| Payment confirmed | `Order.StatusChanged` (→ CONFIRMED) | Admin confirms bank transfer OR payment webhook |
| Being prepared | `Order.StatusChanged` (→ PROCESSING) | Admin action |
| Out for delivery | `Order.StatusChanged` (→ SHIPPED) | Admin action |
| Delivered | `Order.StatusChanged` (→ DELIVERED) | Admin action or delivery webhook |
| Cancelled | `Order.Cancelled` | User or admin |

### Inngest workflow (from earlier plan)

Each `Order.Placed` event starts a workflow that uses `waitForEvent` to pause at each
transition and react when the next event arrives — no polling, entirely event-driven.

---

## 2. Schema Changes

Add payment fields to the `Order` model:

```prisma
model Order {
  // ... existing fields ...
  paymentMethod    PaymentMethod  @default(BANK_TRANSFER) @map("payment_method")
  paymentStatus    PaymentStatus  @default(PENDING)       @map("payment_status")
  paymentReference String?                                @map("payment_reference")
}

enum PaymentMethod {
  BANK_TRANSFER
  ONLINE
  @@schema("main")
}

enum PaymentStatus {
  PENDING
  CONFIRMED
  FAILED
  @@schema("main")
}
```

Add a back-office payment verification queue:

```prisma
model PaymentVerification {
  id          String                   @id @default(cuid())
  orderId     String                   @unique @map("order_id")
  customerId  String                   @map("customer_id")
  amount      Decimal                  @db.Decimal(10, 2)
  status      PaymentVerificationStatus @default(PENDING)
  note        String?
  reviewedAt  DateTime?                @map("reviewed_at")
  reviewedBy  String?                  @map("reviewed_by")
  createdAt   DateTime                 @default(now()) @map("created_at")

  order    Order    @relation(fields: [orderId], references: [id])
  customer Customer @relation(fields: [customerId], references: [id])

  @@map("payment_verifications")
  @@schema("main")
}

enum PaymentVerificationStatus {
  PENDING
  CONFIRMED
  DENIED
  @@schema("main")
}
```

---

## 3. Checkout Flow

### Current flow (to be replaced)
```
/checkout → address → [Place Order] → /checkout/success
```

### New flow
```
/checkout  →  address + payment selection  →  /checkout/payment  →  (split)
                                                    ↓                    ↓
                                             Bank Transfer          Pay Online
                                                    ↓                    ↓
                                          /checkout/pending     redirect to gateway
                                                                         ↓
                                                                    webhook fires
                                                                         ↓
                                                                /checkout/success
```

---

## 4. Payment Option A — Bank Transfer

### User flow
1. User selects "Send to our bank account"
2. Shown bank details (account name, number, bank)
3. Clicks "I've made the payment"
4. Order is placed with `paymentMethod: BANK_TRANSFER`, `paymentStatus: PENDING`
5. Redirected to `/checkout/pending` — a page saying "We'll confirm your payment shortly"
6. Email sent: "Your order is awaiting payment confirmation"

### Admin back-office queue
- New section in admin: **Payment Verifications**
- Shows a table of all `PaymentVerification` records with status `PENDING`
- Each row shows: customer name, order ID, amount, time since placed
- Two actions per row:
  - **Confirm** → calls `admin.payment.confirm`:
    - Sets `PaymentVerification.status = CONFIRMED`
    - Transitions `Order.status` from `PENDING → CONFIRMED` (fires `Order.StatusChanged` event)
    - Sets `Order.paymentStatus = CONFIRMED`
    - Sends "Order confirmed" email to customer
    - Inngest picks up `Order.StatusChanged` event → continues lifecycle workflow
  - **Deny** → calls `admin.payment.deny`:
    - Sets `PaymentVerification.status = DENIED`
    - Admin can optionally add a note
    - Sends "Payment not confirmed" email to customer with reason
    - Order stays `PENDING` — item remains in queue with DENIED status (visible for reference)
    - Customer can retry payment or cancel

### New tRPC procedures

```typescript
// admin procedures
payment.list          // list all verification queue items
payment.confirm       // confirm a bank transfer, transition order to CONFIRMED
payment.deny          // deny with optional note
```

---

## 5. Payment Option B — Pay Online

### Provider
Use **Paystack** (Nigerian market, free to integrate, webhook support).
Alternative: Flutterwave. Either works — abstract behind a provider interface.

### User flow
1. User selects "Pay online"
2. Order is created with `paymentMethod: ONLINE`, `paymentStatus: PENDING`
3. A Paystack payment session is initialised server-side
4. User is redirected to Paystack hosted checkout
5. User pays
6. Paystack fires a webhook to `/api/webhooks/paystack`

### Webhook handler (`/api/webhooks/paystack`)
```
POST /api/webhooks/paystack
  ↓
Verify HMAC signature (X-Paystack-Signature header)
  ↓
event = "charge.success"
  ↓
Find order by paymentReference (Paystack reference stored at order creation)
  ↓
Set Order.paymentStatus = CONFIRMED
Transition Order.status: PENDING → CONFIRMED
Fire Order.StatusChanged domain event
  ↓
Inngest picks up event → continues lifecycle
  ↓
Redirect user to /checkout/success (via Paystack callback URL)
```

### New tRPC procedures / API routes

```typescript
// protected procedure
checkout.initiateOnlinePayment  // creates Paystack session, returns redirect URL

// raw Next.js API route (no auth — called by Paystack)
POST /api/webhooks/paystack
```

---

## 6. New Pages Required

| Page | Description |
|---|---|
| `/checkout` | Modified — add payment method selection step before placing order |
| `/checkout/payment` | Dedicated payment page (bank details or online redirect) |
| `/checkout/pending` | Bank transfer "awaiting confirmation" holding page |
| `/checkout/success` | Already exists (minor updates — show payment method used) |

---

## 7. Admin Pages Required

| Page | Description |
|---|---|
| `/payments` | Payment verification queue — list of pending/confirmed/denied transfers |
| `/payments/[id]` | Optional detail view per verification |

---

## 8. Implementation Order

1. **Schema** — add `paymentMethod`, `paymentStatus`, `paymentReference` to Order; add `PaymentVerification` model; run migration
2. **Checkout split** — modify `/checkout` to stop placing order immediately; route to `/checkout/payment`
3. **Bank transfer flow** — `checkout/payment` page with bank details, place order on "I've paid", redirect to `/checkout/pending`; create `PaymentVerification` record
4. **Admin payment queue** — `/payments` page in admin; `payment.confirm` and `payment.deny` tRPC procedures; `UpdateOrderStatusCommand` used for confirm
5. **Online payment** — Paystack integration; `checkout.initiateOnlinePayment`; webhook handler; signature verification
6. **Inngest wiring** — `order/placed` → start workflow; `order/status.changed` with `CONFIRMED` → resume workflow
7. **Notifications** — "awaiting confirmation" email, "confirmed" email, "payment denied" email

---

## 9. Environment Variables Needed

```bash
# Bank Transfer
BANK_ACCOUNT_NAME=
BANK_ACCOUNT_NUMBER=
BANK_NAME=

# Paystack (online payments)
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
PAYSTACK_WEBHOOK_SECRET=
```
