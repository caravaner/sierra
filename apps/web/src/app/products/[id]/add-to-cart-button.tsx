"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Check } from "lucide-react";

interface AddToCartButtonProps {
  productId: string;
  name: string;
  price: number;
  image: string | null;
}

export function AddToCartButton({ productId, name, price, image }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    addItem({ productId, name, price, image, quantity });
    toast.success(`${name} added to cart`);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="mt-8 flex items-center gap-3">
      <div className="flex items-center rounded-full border px-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-10 text-center font-semibold">{quantity}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={() => setQuantity((q) => Math.min(99, q + 1))}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Button onClick={handleAddToCart} size="lg" className="flex-1 rounded-full font-semibold">
        {added ? (
          <>
            <Check className="h-4 w-4" />
            Added!
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </>
        )}
      </Button>
    </div>
  );
}
