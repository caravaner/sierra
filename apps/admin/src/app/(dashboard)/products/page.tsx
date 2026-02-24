"use client";

import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@sierra/shared";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, X, ImagePlus, Loader2, Pencil, PowerOff, Power } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  category?: string | null;
  price: number;
  images: string[];
  description?: string | null;
  isActive: boolean;
}

// ─── Image uploader ───────────────────────────────────────────────────────────

interface UploadedImage {
  url: string;
  preview: string;
  name: string;
}

function ImageUploader({
  images,
  onChange,
}: {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const results: UploadedImage[] = [];

    for (const file of Array.from(files)) {
      const preview = URL.createObjectURL(file);
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) { toast.error(`${file.name}: ${data.error ?? "Upload failed"}`); URL.revokeObjectURL(preview); continue; }
        results.push({ url: data.url, preview, name: file.name });
      } catch {
        toast.error(`${file.name}: Network error`);
        URL.revokeObjectURL(preview);
      }
    }

    if (results.length > 0) onChange([...images, ...results]);
    setUploading(false);
  }

  function remove(index: number) {
    const img = images[index];
    if (img) URL.revokeObjectURL(img.preview);
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        disabled={uploading}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-6 text-sm transition-colors",
          dragging ? "border-primary bg-primary/5 text-primary" : "border-muted-foreground/25 text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/30",
          uploading && "cursor-not-allowed opacity-50",
        )}
      >
        {uploading ? (
          <><Loader2 className="h-5 w-5 animate-spin" /><span>Uploading…</span></>
        ) : (
          <><ImagePlus className="h-5 w-5" /><span><span className="font-medium">Click to upload</span> or drag and drop</span><span className="text-xs">PNG, JPG, WEBP — max 5 MB</span></>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-md border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.preview} alt={img.name} className="h-full w-full object-cover" />
              <button type="button" onClick={() => remove(i)} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Add Dialog ───────────────────────────────────────────────────────────────

function AddProductDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const createProduct = trpc.product.create.useMutation({
    onSuccess: () => { utils.product.adminList.invalidate(); toast.success("Product created"); handleClose(); },
    onError: (err) => toast.error(err.message),
  });

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);

  function handleClose() {
    images.forEach((i) => URL.revokeObjectURL(i.preview));
    setName(""); setSku(""); setPrice(""); setCategory(""); setDescription(""); setImages([]);
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createProduct.mutate({
      name,
      sku,
      price: parseFloat(price),
      category: category || undefined,
      description: description || undefined,
      images: images.map((i) => i.url),
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>Fill in the details to create a new product.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="add-name">Name *</Label><Input id="add-name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="add-sku">SKU *</Label><Input id="add-sku" value={sku} onChange={(e) => setSku(e.target.value)} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="add-price">Price *</Label><Input id="add-price" type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="add-category">Category</Label><Input id="add-category" value={category} onChange={(e) => setCategory(e.target.value)} /></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-desc">Description</Label>
            <textarea id="add-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
          </div>
          <div className="space-y-2">
            <Label>Images <span className="text-xs font-normal text-muted-foreground">(optional)</span></Label>
            <ImageUploader images={images} onChange={setImages} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={createProduct.isPending}>{createProduct.isPending ? "Creating…" : "Create Product"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

function EditProductDialog({ product, onClose }: { product: ProductItem; onClose: () => void }) {
  const utils = trpc.useUtils();
  const updateProduct = trpc.product.update.useMutation({
    onSuccess: () => { utils.product.adminList.invalidate(); toast.success("Product updated"); onClose(); },
    onError: (err) => toast.error(err.message),
  });

  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [category, setCategory] = useState(product.category ?? "");
  const [description, setDescription] = useState(product.description ?? "");
  const [existingUrls, setExistingUrls] = useState<string[]>(product.images);
  const [newImages, setNewImages] = useState<UploadedImage[]>([]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateProduct.mutate({
      id: product.id,
      data: {
        name,
        price: parseFloat(price),
        category: category || null,
        description: description || null,
        images: [...existingUrls, ...newImages.map((i) => i.url)],
      },
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Update the product details below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="edit-name">Name *</Label><Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div className="space-y-2"><Label>SKU</Label><Input value={product.sku} disabled className="opacity-60" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="edit-price">Price *</Label><Input id="edit-price" type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="edit-category">Category</Label><Input id="edit-category" value={category} onChange={(e) => setCategory(e.target.value)} /></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-desc">Description</Label>
            <textarea id="edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
          </div>

          {existingUrls.length > 0 && (
            <div className="space-y-2">
              <Label>Current Images</Label>
              <div className="grid grid-cols-4 gap-2">
                {existingUrls.map((url, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-md border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setExistingUrls(existingUrls.filter((_, j) => j !== i))} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Add More Images</Label>
            <ImageUploader images={newImages} onChange={setNewImages} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={updateProduct.isPending}>{updateProduct.isPending ? "Saving…" : "Save Changes"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const utils = trpc.useUtils();
  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductItem | null>(null);

  const { data, isLoading } = trpc.product.adminList.useQuery({ limit: 50, offset: 0 });

  const activate = trpc.product.activate.useMutation({
    onSuccess: () => { utils.product.adminList.invalidate(); toast.success("Product activated"); },
    onError: (err) => toast.error(err.message),
  });
  const deactivate = trpc.product.deactivate.useMutation({
    onSuccess: () => { utils.product.adminList.invalidate(); toast.success("Product suspended"); },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product catalogue</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <p className="p-8 text-center text-muted-foreground">Loading products...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((product) => (
                <TableRow key={product.id} className={!product.isActive ? "opacity-50" : undefined}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{product.sku}</TableCell>
                  <TableCell className="text-muted-foreground">{product.category ?? "—"}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(product.price)}</TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? "success" : "secondary"}>
                      {product.isActive ? "Active" : "Suspended"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Edit product"
                        onClick={() => setEditProduct(product as ProductItem)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {product.isActive ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Suspend product"
                          disabled={deactivate.isPending}
                          onClick={() => deactivate.mutate({ id: product.id })}
                        >
                          <PowerOff className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs text-green-700 hover:text-green-700"
                          disabled={activate.isPending}
                          onClick={() => activate.mutate({ id: product.id })}
                        >
                          <Power className="h-3.5 w-3.5" />
                          Resume
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No products yet. Add your first one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <AddProductDialog open={addOpen} onClose={() => setAddOpen(false)} />
      {editProduct && <EditProductDialog product={editProduct} onClose={() => setEditProduct(null)} />}
    </div>
  );
}
