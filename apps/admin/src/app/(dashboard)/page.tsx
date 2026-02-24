"use client";

import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@sierra/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Package, Warehouse, ArrowRight } from "lucide-react";

function statusVariant(status: string) {
  switch (status.toLowerCase()) {
    case "delivered": return "success" as const;
    case "shipped": return "secondary" as const;
    case "cancelled": return "destructive" as const;
    default: return "outline" as const;
  }
}

export default function DashboardPage() {
  const orders = trpc.order.list.useQuery({ limit: 5, offset: 0 });
  const products = trpc.product.list.useQuery({ limit: 1, offset: 0 });
  const inventory = trpc.inventory.list.useQuery({ limit: 1, offset: 0, lowStock: true });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to Sierra Admin</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <a href="/orders">
          <Card className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{orders.data?.total ?? "—"}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                View all orders <ArrowRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </a>

        <a href="/products">
          <Card className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{products.data?.total ?? "—"}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                Manage products <ArrowRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </a>

        <a href="/inventory">
          <Card className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
              <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{inventory.data?.total ?? "—"}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                View inventory <ArrowRight className="h-3 w-3" />
              </p>
            </CardContent>
          </Card>
        </a>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <a href="/orders" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            View all <ArrowRight className="h-3 w-3" />
          </a>
        </div>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.data?.items.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono font-medium">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                  </TableCell>
                  <TableCell>{order.itemCount}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(Number(order.totalAmount))}</TableCell>
                </TableRow>
              ))}
              {orders.data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No orders yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
