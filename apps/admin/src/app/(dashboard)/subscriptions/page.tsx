"use client";

import { trpc } from "@/lib/trpc";
import { formatDate } from "@sierra/shared";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type SubscriptionStatus = "ACTIVE" | "PAUSED" | "CANCELLED";

function statusVariant(status: SubscriptionStatus): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "ACTIVE": return "default";
    case "PAUSED": return "secondary";
    case "CANCELLED": return "destructive";
  }
}

export default function SubscriptionsPage() {
  const { data, isLoading } = trpc.subscription.list.useQuery({ limit: 50, offset: 0 });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-muted-foreground">All customer recurring orders</p>
      </div>

      <Card>
        {isLoading ? (
          <p className="p-8 text-center text-muted-foreground">Loading subscriptions...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Interval</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Next Delivery</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No subscriptions found
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-mono text-xs">{sub.id.slice(0, 8).toUpperCase()}</TableCell>
                    <TableCell className="font-mono text-xs">{sub.customerId.slice(0, 8).toUpperCase()}</TableCell>
                    <TableCell>{sub.intervalDays}d</TableCell>
                    <TableCell>{sub.itemCount}</TableCell>
                    <TableCell>{formatDate(new Date(sub.nextDeliveryAt))}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(sub.status as SubscriptionStatus)}>
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(new Date(sub.createdAt))}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
