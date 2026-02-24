import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Users,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/products", label: "Products", icon: Package },
  { href: "/inventory", label: "Inventory", icon: Warehouse },
  { href: "/users", label: "Users", icon: Users },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-r bg-card">
        <div className="px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Sierra</p>
          <h1 className="text-lg font-bold">Admin</h1>
        </div>
        <Separator />
        <nav className="flex-1 space-y-0.5 p-3">
          {navItems.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </a>
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
