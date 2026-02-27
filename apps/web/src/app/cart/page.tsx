"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@sierra/shared";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const { items, total, removeItem, updateQuantity } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <ShoppingBag className="h-9 w-9 text-primary" />
        </div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight">Your cart is empty</h1>
        <p className="mb-8 text-muted-foreground">Add some products to get started.</p>
        <Button className="rounded-full px-8" asChild>
          <Link href="/">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-10 text-3xl font-bold tracking-tight">Your Cart</h1>

      <div className="rounded-2xl bg-card shadow-sm">
        {items.map((item, idx) => (
          <div
            key={item.productId}
            className={`flex items-center gap-4 p-5 ${idx < items.length - 1 ? "border-b" : ""}`}
          >
            <Link href={`/products/${item.productId}`} className="shrink-0">
              <img
                src={item.image ?? "/images/placeholder.svg"}
                alt={item.name}
                className="h-20 w-20 rounded-xl bg-muted object-cover"
              />
            </Link>

            <div className="flex-1 min-w-0">
              <Link
                href={`/products/${item.productId}`}
                className="font-semibold tracking-tight hover:text-primary transition-colors"
              >
                {item.name}
              </Link>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {formatCurrency(item.price)} each
              </p>
            </div>

            <div className="flex items-center rounded-full border px-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full"
                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <p className="w-24 text-right font-bold text-primary">
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

      <div className="mt-6 rounded-2xl bg-primary/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Order total</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(total)}</p>
          </div>
          <Button size="lg" className="rounded-full px-8 font-semibold" asChild>
            <Link href="/checkout">Checkout →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
