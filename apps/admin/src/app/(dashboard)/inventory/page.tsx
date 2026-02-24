"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

// ─── Add to Inventory Dialog ──────────────────────────────────────────────────

function AddInventoryDialog({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.inventory.productsWithoutInventory.useQuery();
  const create = trpc.inventory.create.useMutation({
    onSuccess: () => {
      utils.inventory.list.invalidate();
      utils.inventory.productsWithoutInventory.invalidate();
      toast.success("Inventory record created");
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const [productId, setProductId] = useState("");
  const [reorderPoint, setReorderPoint] = useState("10");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) { toast.error("Select a product"); return; }
    create.mutate({ productId, reorderPoint: parseInt(reorderPoint, 10) || 10 });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to Inventory</DialogTitle>
          <DialogDescription>Create an inventory record for a product.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Loading products…</p>
        ) : !products?.length ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            All products already have inventory records.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-select">Product</Label>
              <select
                id="product-select"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select a product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.sku}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-reorder">Reorder Point</Label>
              <Input
                id="add-reorder"
                type="number"
                min="0"
                step="1"
                value={reorderPoint}
                onChange={(e) => setReorderPoint(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Flagged as Low Stock when available qty falls at or below this.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Creating…" : "Add to Inventory"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit / Replenish Dialog ──────────────────────────────────────────────────

function EditInventoryDialog({
  productId,
  productName,
  currentReorderPoint,
  onClose,
}: {
  productId: string;
  productName: string;
  currentReorderPoint: number;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();

  const replenish = trpc.inventory.replenish.useMutation({
    onSuccess: () => { utils.inventory.list.invalidate(); toast.success("Stock updated"); },
    onError: (err) => toast.error(err.message),
  });
  const update = trpc.inventory.update.useMutation({
    onSuccess: () => { utils.inventory.list.invalidate(); toast.success("Reorder point saved"); },
    onError: (err) => toast.error(err.message),
  });

  const [quantity, setQuantity] = useState("");
  const [reorderPoint, setReorderPoint] = useState(String(currentReorderPoint));

  const busy = replenish.isPending || update.isPending;

  function handleReplenish(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) { toast.error("Enter a positive quantity"); return; }
    replenish.mutate({ productId, quantity: qty }, {
      onSuccess: () => setQuantity(""),
    });
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    update.mutate({ productId, reorderPoint: parseInt(reorderPoint, 10) });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Inventory</DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Replenish */}
          <form onSubmit={handleReplenish} className="space-y-3">
            <p className="text-sm font-medium">Add Stock</p>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="Quantity to add"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                autoFocus
              />
              <Button type="submit" disabled={busy}>
                {replenish.isPending ? "Adding…" : "Add"}
              </Button>
            </div>
          </form>

          <Separator />

          {/* Reorder point */}
          <form onSubmit={handleUpdate} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="edit-reorder" className="text-sm font-medium">Reorder Point</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-reorder"
                  type="number"
                  min="0"
                  step="1"
                  value={reorderPoint}
                  onChange={(e) => setReorderPoint(e.target.value)}
                />
                <Button type="submit" variant="outline" disabled={busy}>
                  {update.isPending ? "Saving…" : "Save"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Flagged as Low Stock when available qty falls at or below this.
              </p>
            </div>
          </form>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { data, isLoading } = trpc.inventory.list.useQuery({ limit: 50, offset: 0 });
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ productId: string; productName: string; reorderPoint: number } | null>(null);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Monitor stock levels and reorder points</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add to Inventory
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <p className="p-8 text-center text-muted-foreground">Loading inventory...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>On Hand</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Reorder Point</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell>{item.quantityOnHand}</TableCell>
                  <TableCell>{item.quantityReserved}</TableCell>
                  <TableCell className="font-medium">{item.quantityAvailable}</TableCell>
                  <TableCell>{item.reorderPoint}</TableCell>
                  <TableCell>
                    <Badge variant={item.needsReorder ? "warning" : "success"}>
                      {item.needsReorder ? "Low Stock" : "In Stock"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Edit inventory"
                      onClick={() => setEditTarget({ productId: item.productId, productName: item.productName, reorderPoint: item.reorderPoint })}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No inventory items found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {addOpen && <AddInventoryDialog onClose={() => setAddOpen(false)} />}
      {editTarget && (
        <EditInventoryDialog
          productId={editTarget.productId}
          productName={editTarget.productName}
          currentReorderPoint={editTarget.reorderPoint}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
