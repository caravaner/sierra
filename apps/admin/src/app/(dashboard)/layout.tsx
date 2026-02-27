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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r bg-card">
        <div className="px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{APP_NAME}</p>
          <h1 className="text-lg font-bold">Admin</h1>
        </div>
        <Separator />
        <nav className="flex-1 space-y-4 p-3">
          {navSections.map((section, si) => (
            <div key={si}>
              {section.label && (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(({ href, label, icon: Icon }) => (
                  <a
                    key={href}
                    href={href}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <Separator />
        <div className="p-4 text-xs text-muted-foreground">v0.0.0</div>
      </aside>
      <main className="flex-1 overflow-auto bg-muted/30">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
