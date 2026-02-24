"use client";

import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@sierra/shared";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function statusVariant(status: string) {
  switch (status.toLowerCase()) {
    case "delivered": return "success" as const;
    case "shipped": return "secondary" as const;
    case "cancelled": return "destructive" as const;
    default: return "outline" as const;
  }
}

export default function OrdersPage() {
  const { data, isLoading } = trpc.order.list.useQuery({ limit: 50, offset: 0 });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">Manage and track customer orders</p>
      </div>

      <Card>
        {isLoading ? (
          <p className="p-8 text-center text-muted-foreground">Loading orders...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono font-medium">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {order.customerId.slice(0, 8)}…
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(Number(order.totalAmount))}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(new Date(order.createdAt))}</TableCell>
                </TableRow>
              ))}
              {data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
