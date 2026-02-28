"use client";

import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@sierra/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RefreshCw } from "lucide-react";

type SubscriptionStatus = "ACTIVE" | "PAUSED" | "CANCELLED";

function statusVariant(status: SubscriptionStatus): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "ACTIVE": return "default";
    case "PAUSED": return "secondary";
    case "CANCELLED": return "destructive";
  }
}

export default function SubscriptionsPage() {
  const { data, isLoading, refetch } = trpc.subscription.mySubscriptions.useQuery();
  const pauseMutation = trpc.subscription.pause.useMutation({ onSuccess: () => { toast.success("Subscription paused"); refetch(); } });
  const resumeMutation = trpc.subscription.resume.useMutation({ onSuccess: () => { toast.success("Subscription resumed"); refetch(); } });
  const cancelMutation = trpc.subscription.cancel.useMutation({ onSuccess: () => { toast.success("Subscription cancelled"); refetch(); } });

  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  if (isLoading) {
    return <p className="py-10 text-center text-muted-foreground">Loading subscriptions...</p>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Subscriptions</h1>
        <p className="mt-1 text-muted-foreground">Manage your recurring orders</p>
      </div>

      {!data?.items.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <RefreshCw className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-4 text-muted-foreground">You have no active subscriptions.</p>
          <Button asChild>
            <a href="/">Browse Products</a>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.items.map((sub) => (
            <Card key={sub.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      Every {sub.intervalDays} day{sub.intervalDays !== 1 ? "s" : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Next delivery: {formatDate(new Date(sub.nextDeliveryAt))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created {formatDate(new Date(sub.createdAt))}
                    </p>
                  </div>
                  <Badge variant={statusVariant(sub.status as SubscriptionStatus)}>
                    {sub.status}
                  </Badge>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <div className="space-y-2">
                  {sub.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.name} <span className="font-medium text-foreground">×{item.quantity}</span>
                      </span>
                      <span className="font-medium">{formatCurrency(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {sub.status !== "CANCELLED" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {sub.status === "ACTIVE" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pauseMutation.isPending}
                        onClick={() => pauseMutation.mutate({ id: sub.id })}
                      >
                        Pause
                      </Button>
                    )}
                    {sub.status === "PAUSED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={resumeMutation.isPending}
                        onClick={() => resumeMutation.mutate({ id: sub.id })}
                      >
                        Resume
                      </Button>
                    )}

                    {confirmCancel === sub.id ? (
                      <>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={cancelMutation.isPending}
                          onClick={() => { cancelMutation.mutate({ id: sub.id }); setConfirmCancel(null); }}
                        >
                          Confirm Cancel
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmCancel(null)}
                        >
                          Keep
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setConfirmCancel(sub.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
