"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

const ORDER_ID_KEY = "sierra-pending-order-id";
const INITIAL_DELAY = 5_000;   // 5s
const MAX_DELAY = 120_000;      // 1m — at this point we stop and redirect
const BACKOFF_FACTOR = 2;

export default function CheckoutPendingPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayRef = useRef(INITIAL_DELAY);

  const statusQuery = trpc.order.myOrderStatus.useQuery(
    { orderId: orderId ?? "" },
    {
      enabled: false, // manual refetch
      retry: false,
    },
  );

  // Load order ID from sessionStorage on mount
  useEffect(() => {
    const id = sessionStorage.getItem(ORDER_ID_KEY);
    if (id) setOrderId(id);
  }, []);

  // Start polling once we have an order ID
  useEffect(() => {
    if (!orderId) return;

    function scheduleNext() {
      timerRef.current = setTimeout(async () => {
        try {
          const data = await statusQuery.refetch();
          const status = data.data?.paymentStatus;
          const verification = data.data?.verificationStatus;

          if (status === "CONFIRMED" || verification === "CONFIRMED") {
            sessionStorage.removeItem(ORDER_ID_KEY);
            setConfirmed(true);
            // Show success screen briefly then navigate
            setTimeout(() => router.push("/orders"), 3000);
            return;
          }
        } catch {
          // Silently continue polling on error
        }

        if (delayRef.current >= MAX_DELAY) {
          // Max interval reached — give up and go to orders
          sessionStorage.removeItem(ORDER_ID_KEY);
          router.push("/orders");
          return;
        }

        delayRef.current = Math.min(delayRef.current * BACKOFF_FACTOR, MAX_DELAY);
        scheduleNext();
      }, delayRef.current);
    }

    scheduleNext();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (confirmed) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="mb-3 text-3xl font-bold tracking-tight">Payment Confirmed!</h1>
        <p className="mb-2 max-w-sm text-muted-foreground">
          Your payment has been verified. Your order is now being processed.
        </p>
        <p className="text-sm text-muted-foreground">Taking you to your orders…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
        <Clock className="h-10 w-10 text-amber-600" />
      </div>
      <h1 className="mb-3 text-3xl font-bold tracking-tight">Awaiting Payment</h1>
      <p className="mb-2 max-w-sm text-muted-foreground">
        Your order has been placed! We&apos;re waiting to confirm your bank transfer.
      </p>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground">
        Once we verify your payment (usually within a few minutes), you&apos;ll receive a
        confirmation and your order will be processed.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <a href="/orders">View My Orders</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/">Continue Shopping</a>
        </Button>
      </div>
    </div>
  );
}
