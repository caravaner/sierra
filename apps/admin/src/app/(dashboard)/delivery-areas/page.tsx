"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Power, PowerOff } from "lucide-react";
import { formatCurrency } from "@sierra/shared";
import { toast } from "sonner";

interface AreaItem {
  id: string;
  name: string;
  description?: string | null;
  deliveryFee?: unknown;
  isActive: boolean;
  sortOrder: number;
  addressCount: number;
}

function AreaDialog({
  area,
  open,
  onClose,
}: {
  area?: AreaItem;
  open: boolean;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const isEdit = !!area;

  const create = trpc.deliveryArea.create.useMutation({
    onSuccess: () => { utils.deliveryArea.adminList.invalidate(); toast.success("Delivery area created"); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.deliveryArea.update.useMutation({
    onSuccess: () => { utils.deliveryArea.adminList.invalidate(); toast.success("Delivery area updated"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const [name, setName] = useState(area?.name ?? "");
  const [description, setDescription] = useState(area?.description ?? "");
  const [deliveryFee, setDeliveryFee] = useState(
    area?.deliveryFee != null ? String(Number(area.deliveryFee)) : "",
  );
  const [sortOrder, setSortOrder] = useState(String(area?.sortOrder ?? 0));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fee = deliveryFee.trim() !== "" ? parseFloat(deliveryFee) : undefined;
    const payload = {
      name,
      description: description || undefined,
      deliveryFee: fee,
      sortOrder: parseInt(sortOrder) || 0,
    };
    if (isEdit) {
      update.mutate({ id: area.id, ...payload });
    } else {
      create.mutate(payload);
    }
  }

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Delivery Area" : "New Delivery Area"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this delivery area." : "Add a new serviceable delivery location."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="area-name">Name *</Label>
            <Input
              id="area-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vetrocam Estate"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area-desc">Description</Label>
            <Textarea
              id="area-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional — shown to customers at checkout"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area-fee">
              Delivery Fee{" "}
              <span className="text-xs font-normal text-muted-foreground">(leave blank to use store default)</span>
            </Label>
            <Input
              id="area-fee"
              type="number"
              min="0"
              step="0.01"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              placeholder="e.g. 500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area-order">Sort Order</Label>
            <Input
              id="area-order"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Lower number = shown first in dropdown</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Area"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function DeliveryAreasPage() {
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editArea, setEditArea] = useState<AreaItem | null>(null);

  const { data, isLoading } = trpc.deliveryArea.adminList.useQuery();

  const toggle = trpc.deliveryArea.update.useMutation({
    onSuccess: () => { utils.deliveryArea.adminList.invalidate(); toast.success("Area updated"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Delivery Areas</h1>
          <p className="text-muted-foreground">Manage serviceable locations for delivery</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Area
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <p className="p-8 text-center text-muted-foreground">Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Delivery Fee</TableHead>
                <TableHead>Addresses</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((area: AreaItem) => (
                <TableRow key={area.id} className={!area.isActive ? "opacity-50" : undefined}>
                  <TableCell className="font-medium">{area.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                    {area.description ?? "—"}
                  </TableCell>
                  <TableCell>
                    {area.deliveryFee != null ? (
                      <span className="font-medium">{formatCurrency(Number(area.deliveryFee))}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Store default</span>
                    )}
                  </TableCell>
                  <TableCell>{area.addressCount}</TableCell>
                  <TableCell>{area.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={area.isActive ? "success" : "secondary"}>
                      {area.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditArea(area)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${area.isActive ? "text-destructive hover:text-destructive" : "text-green-700 hover:text-green-700"}`}
                        disabled={toggle.isPending}
                        onClick={() => toggle.mutate({ id: area.id, isActive: !area.isActive })}
                      >
                        {area.isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No delivery areas yet. Add your first one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <AreaDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      {editArea && <AreaDialog area={editArea} open onClose={() => setEditArea(null)} />}
    </div>
  );
}
