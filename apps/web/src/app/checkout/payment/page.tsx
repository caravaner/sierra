"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@sierra/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Landmark, CreditCard, Copy, Check, AlertCircle } from "lucide-react";
import type { PendingOrder } from "../page";

const PENDING_ORDER_KEY = "sierra-pending-order";
const ADDRESS_STORAGE_KEY = "sierra-checkout-address";

const BANK_NAME = process.env.NEXT_PUBLIC_BANK_NAME ?? "First Bank of Nigeria";
const BANK_ACCOUNT_NAME = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? "Sierra Waters Ltd";
const BANK_ACCOUNT_NUMBER = process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER ?? "0123456789";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="ml-2 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  const deliveryConfigQuery = trpc.settings.deliveryConfig.useQuery();
  const placeOrder = trpc.order.place.useMutation();

  useEffect(() => {
    const raw = sessionStorage.getItem(PENDING_ORDER_KEY);
    if (!raw) {
      router.replace("/checkout");
      return;
    }
    setPendingOrder(JSON.parse(raw) as PendingOrder);
  }, [router]);

  if (!pendingOrder || items.length === 0) {
    return <p className="py-10 text-center text-muted-foreground">Loading...</p>;
  }

  const deliveryConfig = deliveryConfigQuery.data ?? { deliveryFee: 500, freeDeliveryFrom: 10000 };
  const deliveryFee = total >= deliveryConfig.freeDeliveryFrom ? 0 : deliveryConfig.deliveryFee;
  const orderTotal = total + deliveryFee;

  async function handleBankTransferConfirm() {
    if (!pendingOrder) return;
    setError("");
    setPlacing(true);

    try {
      await placeOrder.mutateAsync({
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
        shippingAddress: pendingOrder.address,
        paymentMethod: "BANK_TRANSFER",
      });

      // Persist address for next time
      localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(pendingOrder.address));
      sessionStorage.removeItem(PENDING_ORDER_KEY);
      clearCart();
      toast.success("Order placed! Awaiting payment confirmation.");
      router.push("/checkout/pending");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to place order.";
      setError(message);
      toast.error(message);
    } finally {
      setPlacing(false);
    }
  }

  async function handleOnlinePayment() {
    setError("Online payment coming soon. Please use bank transfer for now.");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-2 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </button>
      </div>
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Payment</h1>

      <div className="space-y-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.name} <span className="font-medium text-foreground">×{item.quantity}</span>
                </span>
                <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
            <Separator className="my-2" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              {deliveryFee === 0 ? (
                <span className="font-medium text-green-600">Free</span>
              ) : (
                <span>{formatCurrency(deliveryFee)}</span>
              )}
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="text-primary text-lg">{formatCurrency(orderTotal)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Shipping to */}
        <Card>
          <CardContent className="pt-6">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Shipping to
            </p>
            <p className="text-sm font-medium">{pendingOrder.address.street}</p>
            <p className="text-sm text-muted-foreground">
              {pendingOrder.address.city}, {pendingOrder.address.state}
            </p>
          </CardContent>
        </Card>

        {/* Payment block */}
        {pendingOrder.paymentMethod === "BANK_TRANSFER" ? (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" />
                Bank Transfer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Transfer exactly{" "}
                <span className="font-semibold text-foreground">{formatCurrency(orderTotal)}</span>{" "}
                to the account below. Once your payment is received, we&apos;ll confirm your order
                within 24 hours.
              </p>

              <div className="rounded-xl bg-muted/60 p-5 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Bank</p>
                  <p className="font-semibold">{BANK_NAME}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account Name</p>
                  <p className="font-semibold">{BANK_ACCOUNT_NAME}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Account Number</p>
                  <div className="flex items-center">
                    <p className="font-mono text-xl font-bold tracking-widest">
                      {BANK_ACCOUNT_NUMBER}
                    </p>
                    <CopyButton text={BANK_ACCOUNT_NUMBER} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <div className="flex items-center">
                    <p className="font-mono text-xl font-bold text-primary">
                      {formatCurrency(orderTotal)}
                    </p>
                    <CopyButton text={orderTotal.toFixed(2)} />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  Use your phone number or name as the transfer description so we can match
                  your payment to your order.
                </p>
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
              )}

              <Button
                onClick={handleBankTransferConfirm}
                disabled={placing}
                className="w-full rounded-full"
                size="lg"
              >
                {placing ? "Placing order..." : "I've made the transfer →"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                By confirming, your order will be queued and processed once payment is verified.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Pay Online via Paystack
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You&apos;ll be redirected to Paystack to complete your payment securely. Your order
                is confirmed instantly once payment succeeds.
              </p>

              {error && (
                <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
              )}

              <Button
                onClick={handleOnlinePayment}
                disabled={placing}
                className="w-full rounded-full"
                size="lg"
              >
                Pay {formatCurrency(orderTotal)} Now →
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
