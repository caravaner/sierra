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

interface BrandItem {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

function BrandDialog({
  brand,
  open,
  onClose,
}: {
  brand?: BrandItem;
  open: boolean;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const isEdit = !!brand;

  const create = trpc.brand.create.useMutation({
    onSuccess: () => { utils.brand.adminList.invalidate(); toast.success("Brand created"); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const update = trpc.brand.update.useMutation({
    onSuccess: () => { utils.brand.adminList.invalidate(); toast.success("Brand updated"); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const [name, setName] = useState(brand?.name ?? "");
  const [slug, setSlug] = useState(brand?.slug ?? "");
  const [logo, setLogo] = useState(brand?.logo ?? "");
  const [description, setDescription] = useState(brand?.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(brand?.sortOrder ?? 0));
  const [uploading, setUploading] = useState(false);

  function handleNameChange(v: string) {
    setName(v);
    if (!isEdit) setSlug(slugify(v));
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Upload failed"); return; }
      setLogo(data.url);
      toast.success("Logo uploaded");
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name,
      slug,
      logo: logo || undefined,
      description: description || undefined,
      sortOrder: parseInt(sortOrder) || 0,
    };
    if (isEdit) {
      update.mutate({ id: brand.id, data: payload });
    } else {
      create.mutate(payload);
    }
  }

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Brand" : "New Brand"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this brand's details." : "Add a new brand to your catalogue."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand-name">Name *</Label>
            <Input id="brand-name" value={name} onChange={(e) => handleNameChange(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-slug">Slug *</Label>
            <Input
              id="brand-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              required
              placeholder="e.g. cway"
            />
            <p className="text-xs text-muted-foreground">Used in URLs: /brands/{slug || "..."}</p>
          </div>

          <div className="space-y-2">
            <Label>Logo</Label>
            {logo && (
              <div className="mb-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt="brand logo" className="h-12 w-12 rounded-lg object-contain border bg-muted p-1" />
                <button type="button" onClick={() => setLogo("")} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
              </div>
            )}
            <Input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
            {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-desc">Description</Label>
            <Textarea id="brand-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Short description shown on brand page" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand-order">Sort Order</Label>
            <Input id="brand-order" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            <p className="text-xs text-muted-foreground">Lower number = shown first on homepage</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Brand"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function BrandsPage() {
  const utils = trpc.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBrand, setEditBrand] = useState<BrandItem | null>(null);

  const { data, isLoading } = trpc.brand.adminList.useQuery();

  const toggle = trpc.brand.toggleActive.useMutation({
    onSuccess: () => { utils.brand.adminList.invalidate(); toast.success("Brand updated"); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground">Manage brands shown in the storefront</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Brand
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <p className="p-8 text-center text-muted-foreground">Loading brands...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((brand) => (
                <TableRow key={brand.id} className={!brand.isActive ? "opacity-50" : undefined}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {brand.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={brand.logo} alt={brand.name} className="h-8 w-8 rounded object-contain border bg-muted p-0.5" />
                      ) : (
                        <div className="h-8 w-8 rounded border bg-muted" />
                      )}
                      <div>
                        <p className="font-medium">{brand.name}</p>
                        {brand.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{brand.description}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{brand.slug}</TableCell>
                  <TableCell>{brand.productCount}</TableCell>
                  <TableCell>{brand.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={brand.isActive ? "success" : "secondary"}>
                      {brand.isActive ? "Active" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditBrand(brand as BrandItem)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className={`h-8 w-8 ${brand.isActive ? "text-destructive hover:text-destructive" : "text-green-700 hover:text-green-700"}`}
                        disabled={toggle.isPending} onClick={() => toggle.mutate({ id: brand.id })}>
                        {brand.isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No brands yet. Add your first one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <BrandDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
      {editBrand && <BrandDialog brand={editBrand} open onClose={() => setEditBrand(null)} />}
    </div>
  );
}
