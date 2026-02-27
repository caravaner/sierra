"use client";

import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";
import { APP_NAME } from "@sierra/shared";
import Link from "next/link";

export function NavBar() {
  const { data: session, status } = useSession();
  const { itemCount } = useCart();
  const pathname = usePathname();

  function navClass(href: string) {
    const isActive = pathname === href || pathname.startsWith(`${href}/`);
    return isActive ? "bg-accent text-accent-foreground" : "";
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 h-16">
        <Link href="/" className="text-lg font-bold tracking-tight">
          {APP_NAME}
        </Link>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className={navClass("/products")} asChild>
            <Link href="/#products">Products</Link>
          </Button>

          <Button variant="ghost" size="sm" className={`relative ${navClass("/cart")}`} asChild>
            <Link href="/cart">
              <ShoppingBag className="h-4 w-4" />
              <span>Cart</span>
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
          </Button>

          {status !== "loading" && (
            <>
              {session?.user && (
                <>
                  <Button variant="ghost" size="sm" className={navClass("/orders")} asChild>
                    <Link href="/orders">Orders</Link>
                  </Button>
                  <Button variant="ghost" size="sm" className={navClass("/subscriptions")} asChild>
                    <Link href="/subscriptions">Subscriptions</Link>
                  </Button>
                  <Button variant="ghost" size="sm" className={navClass("/account")} asChild>
                    <Link href="/account/change-password">Account</Link>
                  </Button>
                </>
              )}

              {session?.user ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: window.location.origin })}
                >
                  Sign Out
                </Button>
              ) : (
                <Button size="sm" asChild>
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
