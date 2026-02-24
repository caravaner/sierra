"use client";

import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

export function NavBar() {
  const { data: session } = useSession();
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 h-16">
        <a href="/" className="text-lg font-bold tracking-tight">
          Sierra
        </a>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <a href="/products">Products</a>
          </Button>

          <Button variant="ghost" size="sm" className="relative" asChild>
            <a href="/cart">
              <ShoppingBag className="h-4 w-4" />
              <span>Cart</span>
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </a>
          </Button>

          {session?.user && (
            <Button variant="ghost" size="sm" asChild>
              <a href="/orders">Orders</a>
            </Button>
          )}

          {session?.user ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign Out
            </Button>
          ) : (
            <Button size="sm" asChild>
              <a href="/auth/signin">Sign In</a>
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
