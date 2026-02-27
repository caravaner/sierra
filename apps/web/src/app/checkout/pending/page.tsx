import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export default function CheckoutPendingPage() {
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
        Once we verify your payment (usually within a few hours), you&apos;ll receive a
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
