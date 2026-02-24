import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function CheckoutSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle className="h-10 w-10 text-primary" />
      </div>
      <h1 className="mb-3 text-3xl font-bold tracking-tight">Order Placed!</h1>
      <p className="mb-8 max-w-sm text-muted-foreground">
        Thank you for your order. You can track it from your orders page.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <a href="/orders">View Orders</a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/">Continue Shopping</a>
        </Button>
      </div>
    </div>
  );
}
