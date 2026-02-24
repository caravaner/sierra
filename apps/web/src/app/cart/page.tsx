"use client";

import { toast } from "sonner";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@sierra/shared";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { items, total, removeItem, updateQuantity } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShoppingBag className="mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="mb-2 text-2xl font-bold">Your cart is empty</h1>
        <p className="mb-6 text-muted-foreground">Add some products to get started.</p>
        <Button asChild>
          <a href="/">Continue Shopping</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Your Cart</h1>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-4 rounded-lg border bg-card p-4"
          >
            <a href={`/products/${item.productId}`} className="shrink-0">
              <img
                src={item.image ?? "/images/placeholder.svg"}
                alt={item.name}
                className="h-20 w-20 rounded-md bg-muted object-cover"
              />
            </a>

            <div className="flex-1 min-w-0">
              <a
                href={`/products/${item.productId}`}
                className="font-semibold hover:underline underline-offset-2"
              >
                {item.name}
              </a>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatCurrency(item.price)} each
              </p>
            </div>

            <div className="flex items-center rounded-md border">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-r-none"
                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-l-none"
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <p className="w-20 text-right font-semibold">
              {formatCurrency(item.price * item.quantity)}
            </p>

            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => {
                removeItem(item.productId);
                toast.success("Item removed");
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Separator className="my-6" />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{formatCurrency(total)}</p>
        </div>
        <Button size="lg" asChild>
          <a href="/checkout">Proceed to Checkout</a>
        </Button>
      </div>
    </div>
  );
}
