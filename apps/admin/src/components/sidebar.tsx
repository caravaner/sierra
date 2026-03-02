"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Users,
  RefreshCw,
  Settings,
  Banknote,
  Tag,
  Award,
  Menu,
  X,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@sierra/shared";

const navSections = [
  {
    label: null,
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/orders", label: "Orders", icon: ShoppingCart },
      { href: "/payments", label: "Payments", icon: Banknote },
      { href: "/subscriptions", label: "Subscriptions", icon: RefreshCw },
    ],
  },
  {
    label: "Catalogue",
    items: [
      { href: "/products", label: "Products", icon: Package },
      { href: "/brands", label: "Brands", icon: Award },
      { href: "/product-types", label: "Product Types", icon: Tag },
      { href: "/inventory", label: "Inventory", icon: Warehouse },
    ],
  },
  {
    label: null,
    items: [
      { href: "/users", label: "Users", icon: Users },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const close = () => setIsOpen(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {APP_NAME}
          </p>
          <h1 className="text-sm font-bold leading-tight">Admin</h1>
        </div>
        <button onClick={() => setIsOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r bg-card transition-transform duration-200",
          "md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {APP_NAME}
            </p>
            <h1 className="text-lg font-bold">Admin</h1>
          </div>
          <button className="md:hidden" onClick={close} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <Separator />
        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          {navSections.map((section, si) => (
            <div key={si}>
              {section.label && (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon }) => {
                  const active =
                    href === "/" ? pathname === "/" : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={close}
                      className={[
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      ].join(" ")}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <Separator />
        <div className="p-4 text-xs text-muted-foreground">v0.0.0</div>
      </aside>
    </>
  );
}
