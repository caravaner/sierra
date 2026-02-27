"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPackSize } from "@sierra/shared";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";
import Link from "next/link";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  images: string[];
  brand?: { name: string; slug: string } | null;
  productType?: { name: string } | null;
  volumeMl?: number | null;
  unitsPerPack?: number;
}

export function ProductCard({ id, name, price, images, brand, productType, volumeMl, unitsPerPack = 1 }: ProductCardProps) {
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
    <div className="group flex flex-col rounded-2xl bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/products/${id}`} className="overflow-hidden rounded-t-2xl bg-muted">
        <img
          src={images[0] ?? "/images/placeholder.svg"}
          alt={name}
          className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary/70">
          {brand && <Link href={`/brands/${brand.slug}`} className="hover:text-primary">{brand.name}</Link>}
          {brand && productType && <span>·</span>}
          {productType && <span>{productType.name}</span>}
        </div>
        {volumeMl && (
          <p className="mb-1 font-mono text-sm font-semibold text-foreground/80">
            {formatPackSize(volumeMl, unitsPerPack)}
          </p>
        )}

        <Link href={`/products/${id}`} className="mb-auto">
          <h2 className="line-clamp-2 font-semibold leading-snug tracking-tight hover:text-primary transition-colors">
            {name}
          </h2>
        </Link>

        <p className="mt-3 text-xl font-bold text-primary">{formatCurrency(price)}</p>

        <div className="mt-4 flex items-center gap-2">
          <div className="flex items-center rounded-full border px-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-7 text-center text-sm font-semibold">{qty}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <Button
            size="sm"
            className="h-9 flex-1 rounded-full text-xs font-semibold"
            onClick={handleAdd}
          >
            {added ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Added!
              </>
            ) : (
              <>
                <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
                Add to Cart
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
