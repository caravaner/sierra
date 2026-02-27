"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@sierra/shared";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

type FilterStatus = "PENDING" | "CONFIRMED" | "DENIED" | undefined;

function statusBadge(status: string) {
  switch (status) {
    case "CONFIRMED": return <Badge variant="success">Confirmed</Badge>;
    case "DENIED": return <Badge variant="destructive">Denied</Badge>;
    default: return <Badge variant="outline">Pending</Badge>;
  }
}

export default function PaymentsPage() {
  const [filter, setFilter] = useState<FilterStatus>(undefined);
  const [denyTarget, setDenyTarget] = useState<{ id: string; orderId: string } | null>(null);
  const [denyNote, setDenyNote] = useState("");
  const [actioning, setActioning] = useState<string | null>(null);

  const { data, isLoading, refetch } = trpc.payment.list.useQuery({
    status: filter,
    limit: 100,
    offset: 0,
  });

  const confirm = trpc.payment.confirm.useMutation();
  const deny = trpc.payment.deny.useMutation();

  async function handleConfirm(id: string) {
    setActioning(id);
    try {
      await confirm.mutateAsync({ id });
      toast.success("Payment confirmed — order updated to CONFIRMED.");
      void refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm payment.");
    } finally {
      setActioning(null);
    }
  }

  async function handleDeny() {
    if (!denyTarget) return;
    setActioning(denyTarget.id);
    try {
      await deny.mutateAsync({ id: denyTarget.id, note: denyNote || undefined });
      toast.success("Payment denied.");
      setDenyTarget(null);
      setDenyNote("");
      void refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to deny payment.");
    } finally {
      setActioning(null);
    }
  }

  const filterTabs: { label: string; value: FilterStatus }[] = [
    { label: "All", value: undefined },
    { label: "Pending", value: "PENDING" },
    { label: "Confirmed", value: "CONFIRMED" },
    { label: "Denied", value: "DENIED" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Payment Verifications</h1>
        <p className="text-muted-foreground">Review and confirm bank transfer payments</p>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-2">
        {filterTabs.map((tab) => (
          <button
            key={String(tab.value)}
            onClick={() => setFilter(tab.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        {isLoading ? (
          <p className="p-8 text-center text-muted-foreground">Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-sm">
                    #{v.orderId.slice(0, 8).toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{v.customerName}</p>
                      {v.customerEmail && (
                        <p className="text-xs text-muted-foreground">{v.customerEmail}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{formatCurrency(v.amount)}</TableCell>
                  <TableCell>{statusBadge(v.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(new Date(v.createdAt))}
                  </TableCell>
                  <TableCell className="max-w-[200px] text-sm text-muted-foreground">
                    {v.note ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {v.status === "PENDING" && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-700 border-green-300 hover:bg-green-50"
                          disabled={actioning === v.id}
                          onClick={() => handleConfirm(v.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/30 hover:bg-destructive/5"
                          disabled={actioning === v.id}
                          onClick={() => setDenyTarget({ id: v.id, orderId: v.orderId })}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Deny
                        </Button>
                      </div>
                    )}
                    {v.status !== "PENDING" && (
                      <span className="text-xs text-muted-foreground">
                        {v.reviewedAt ? formatDate(new Date(v.reviewedAt)) : "—"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                    <p className="text-muted-foreground">No payment verifications found.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Deny dialog */}
      <Dialog open={!!denyTarget} onOpenChange={(open) => !open && setDenyTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Payment</DialogTitle>
            <DialogDescription>
              Order #{denyTarget?.orderId.slice(0, 8).toUpperCase()} will remain pending.
              The customer can retry or contact support.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm font-medium">Reason (optional)</p>
            <Textarea
              placeholder="e.g. Payment amount didn't match, reference not found…"
              value={denyNote}
              onChange={(e) => setDenyNote(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDenyTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!!actioning}
              onClick={handleDeny}
            >
              Deny Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
