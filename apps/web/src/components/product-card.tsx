"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@sierra/shared";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  category: string | null;
  images: string[];
}

export function ProductCard({ id, name, price, category, images }: ProductCardProps) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addItem({ productId: id, name, price, image: images[0] ?? null, quantity: qty });
    toast.success(`${name} added to cart`);
    setAdded(true);
    setQty(1);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="group flex flex-col rounded-lg border bg-card transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <a href={`/products/${id}`} className="overflow-hidden rounded-t-lg bg-muted">
        <img
          src={images[0] ?? "/images/placeholder.svg"}
          alt={name}
          className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </a>

      <div className="flex flex-1 flex-col p-4">
        {/* Reserve a fixed-height row so names align whether or not a badge is present */}
        <div className="mb-2 h-5">
          {category && (
            <Badge variant="secondary" className="w-fit text-xs">
              {category}
            </Badge>
          )}
        </div>
        <a href={`/products/${id}`} className="hover:underline">
          <h2 className="line-clamp-2 font-semibold leading-snug">{name}</h2>
        </a>
        {/* mt-auto pushes price + CTA to the bottom of every card in the row */}
        <p className="mt-auto pt-3 text-lg font-bold">{formatCurrency(price)}</p>

        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center rounded-md border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-r-none"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">{qty}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-l-none"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <Button
            size="sm"
            className="h-8 w-8 text-xs sm:w-auto sm:flex-1"
            onClick={handleAdd}
            title="Add to cart"
          >
            {added ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Added!</span>
              </>
            ) : (
              <>
                <ShoppingCart className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add to Cart</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
