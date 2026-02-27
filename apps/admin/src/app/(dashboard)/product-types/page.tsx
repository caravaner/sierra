"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { slugify } from "@sierra/shared";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";

interface TypeItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

function TypeDialog({ type, open, onClose }: { type?: TypeItem; open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const isEdit = !!type;

  const create = trpc.productType.create.useMutation({
    onSuccess: () => { utils.productType.adminList.invalidate(); toast.success("Product type created"); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.productType.update.useMutation({
    onSuccess: () => { utils.productType.adminList.invalidate(); toast.success("Product type updated"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const [name, setName] = useState(type?.name ?? "");
  const [slug, setSlug] = useState(type?.slug ?? "");
  const [description, setDescription] = useState(type?.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(type?.sortOrder ?? 0));

  function handleNameChange(v: string) {
    setName(v);
    if (!isEdit) setSlug(slugify(v));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name,
      slug,
      description: description || undefined,
      sortOrder: parseInt(sortOrder) || 0,
    };
    if (isEdit) update.mutate({ id: type.id, data: payload });
    else create.mutate(payload);
  }

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product Type" : "New Product Type"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this product type." : "Add a new product type (e.g. Dispenser Refill, Bottled Water)."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type-name">Name *</Label>
            <Input id="type-name" value={name} onChange={(e) => handleNameChange(e.target.value)} required placeholder="e.g. Dispenser Refill" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type-slug">Slug *</Label>
            <Input
              id="type-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              required
              placeholder="e.g. dispenser-refill"
            />
            <p className="text-xs text-muted-foreground">Used for filtering: /?type={slug || "..."}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type-desc">Description</Label>
            <Textarea id="type-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Brief description of this product type" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type-order">Sort Order</Label>
            <Input id="type-order" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            <p className="text-xs text-muted-foreground">Lower number = shown first on homepage</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Type"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProductTypesPage() {
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editType, setEditType] = useState<TypeItem | null>(null);

  const { data, isLoading } = trpc.productType.adminList.useQuery();

  const toggle = trpc.productType.toggleActive.useMutation({
    onSuccess: () => { utils.productType.adminList.invalidate(); toast.success("Product type updated"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Types</h1>
          <p className="text-muted-foreground">Define the types of products you sell (e.g. Dispenser Refill, Bottled Water)</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Type
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
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((type) => (
                <TableRow key={type.id} className={!type.isActive ? "opacity-50" : undefined}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{type.slug}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{type.description ?? "—"}</TableCell>
                  <TableCell>{type.productCount}</TableCell>
                  <TableCell>{type.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={type.isActive ? "success" : "secondary"}>
                      {type.isActive ? "Active" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditType(type as TypeItem)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon"
                        className={`h-8 w-8 ${type.isActive ? "text-destructive hover:text-destructive" : "text-green-700 hover:text-green-700"}`}
                        disabled={toggle.isPending} onClick={() => toggle.mutate({ id: type.id })}>
                        {type.isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No product types yet. Add your first one — e.g. "Dispenser Refill", "Bottled Water".
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <TypeDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      {editType && <TypeDialog type={editType} open onClose={() => setEditType(null)} />}
    </div>
  );
}
