"use client";

import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatPackSize, slugify } from "@sierra/shared";
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

interface CatalogRef { id: string; name: string; slug: string }

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  price: number | string;
  images: string[];
  description?: string | null;
  isActive: boolean;
  volumeMl?: number | null;
  unitsPerPack: number;
  brand?: CatalogRef | null;
  productType?: CatalogRef | null;
}

// ─── Image uploader ───────────────────────────────────────────────────────────

interface UploadedImage { url: string; preview: string; name: string }

function ImageUploader({ images, onChange }: { images: UploadedImage[]; onChange: (images: UploadedImage[]) => void }) {
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
      } catch { toast.error(`${file.name}: Network error`); URL.revokeObjectURL(preview); }
    }
    if (results.length > 0) onChange([...images, ...results]);
    setUploading(false);
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        disabled={uploading}
        className={cn("flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-6 text-sm transition-colors",
          dragging ? "border-primary bg-primary/5 text-primary" : "border-muted-foreground/25 text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/30",
          uploading && "cursor-not-allowed opacity-50")}>
        {uploading ? <><Loader2 className="h-5 w-5 animate-spin" /><span>Uploading…</span></>
          : <><ImagePlus className="h-5 w-5" /><span><span className="font-medium">Click to upload</span> or drag and drop</span><span className="text-xs">PNG, JPG, WEBP — max 5 MB</span></>}
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((img, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-md border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.preview} alt={img.name} className="h-full w-full object-cover" />
              <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Catalog selects ──────────────────────────────────────────────────────────

const selectClass = "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function BrandSelect({ value, onChange, brands }: { value: string; onChange: (v: string) => void; brands: CatalogRef[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
      <option value="">— No brand —</option>
      {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
    </select>
  );
}

function TypeSelect({ value, onChange, types }: { value: string; onChange: (v: string) => void; types: CatalogRef[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
      <option value="">— No type —</option>
      {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
    </select>
  );
}

// Volume helpers: user enters number + unit, we store ml
function toMl(value: string, unit: "cl" | "L"): number | undefined {
  const n = parseFloat(value);
  if (isNaN(n) || n <= 0) return undefined;
  return unit === "L" ? Math.round(n * 1000) : Math.round(n * 10);
}

function fromMl(ml: number | null | undefined): { value: string; unit: "cl" | "L" } {
  if (!ml) return { value: "", unit: "cl" };
  if (ml >= 1000) return { value: String(ml / 1000), unit: "L" };
  return { value: String(ml / 10), unit: "cl" };
}

// ─── Shared form fields ────────────────────────────────────────────────────────

interface CatalogFieldsProps {
  brands: CatalogRef[];
  types: CatalogRef[];
  brandId: string; setBrandId: (v: string) => void;
  typeId: string; setTypeId: (v: string) => void;
  volValue: string; setVolValue: (v: string) => void;
  volUnit: "cl" | "L"; setVolUnit: (v: "cl" | "L") => void;
  unitsPerPack: string; setUnitsPerPack: (v: string) => void;
}

function CatalogFields({ brands, types, brandId, setBrandId, typeId, setTypeId, volValue, setVolValue, volUnit, setVolUnit, unitsPerPack, setUnitsPerPack }: CatalogFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Brand</Label>
          <BrandSelect value={brandId} onChange={setBrandId} brands={brands} />
        </div>
        <div className="space-y-2">
          <Label>Product Type</Label>
          <TypeSelect value={typeId} onChange={setTypeId} types={types} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Volume per unit</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0.1"
              step="0.1"
              placeholder="e.g. 50"
              value={volValue}
              onChange={(e) => setVolValue(e.target.value)}
              className="flex-1"
            />
            <select value={volUnit} onChange={(e) => setVolUnit(e.target.value as "cl" | "L")} className="h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="cl">cl</option>
              <option value="L">L</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Units per pack</Label>
          <Input
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 20"
            value={unitsPerPack}
            onChange={(e) => setUnitsPerPack(e.target.value)}
          />
        </div>
      </div>
    </>
  );
}

// ─── Add Dialog ───────────────────────────────────────────────────────────────

function AddProductDialog({ open, onClose, brands, types }: { open: boolean; onClose: () => void; brands: CatalogRef[]; types: CatalogRef[] }) {
  const utils = trpc.useUtils();
  const createProduct = trpc.product.create.useMutation({
    onSuccess: () => { utils.product.adminList.invalidate(); toast.success("Product created"); handleClose(); },
    onError: (err) => toast.error(err.message),
  });

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [brandId, setBrandId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [volValue, setVolValue] = useState("");
  const [volUnit, setVolUnit] = useState<"cl" | "L">("cl");
  const [unitsPerPack, setUnitsPerPack] = useState("1");

  function handleClose() {
    images.forEach((i) => URL.revokeObjectURL(i.preview));
    setName(""); setSku(""); setPrice(""); setDescription(""); setImages([]);
    setBrandId(""); setTypeId(""); setVolValue(""); setVolUnit("cl"); setUnitsPerPack("1");
    onClose();
  }

  // Auto-suggest SKU from brand + name + volume
  function autoSku() {
    const brand = brands.find((b) => b.id === brandId);
    const type = types.find((t) => t.id === typeId);
    const parts = [
      brand ? slugify(brand.name) : null,
      type ? slugify(type.name) : null,
      volValue ? `${volValue}${volUnit}` : null,
      parseInt(unitsPerPack) > 1 ? `x${unitsPerPack}` : null,
    ].filter(Boolean);
    setSku(parts.join("-").toUpperCase());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createProduct.mutate({
      name,
      sku,
      price: parseFloat(price),
      description: description || undefined,
      images: images.map((i) => i.url),
      brandId: brandId || undefined,
      productTypeId: typeId || undefined,
      volumeMl: toMl(volValue, volUnit),
      unitsPerPack: parseInt(unitsPerPack) || 1,
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
          <div className="space-y-2">
            <Label htmlFor="add-name">Name *</Label>
            <Input id="add-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <CatalogFields
            brands={brands} types={types}
            brandId={brandId} setBrandId={setBrandId}
            typeId={typeId} setTypeId={setTypeId}
            volValue={volValue} setVolValue={setVolValue}
            volUnit={volUnit} setVolUnit={setVolUnit}
            unitsPerPack={unitsPerPack} setUnitsPerPack={setUnitsPerPack}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-price">Price (₦) *</Label>
              <Input id="add-price" type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-sku">SKU *</Label>
              <div className="flex gap-2">
                <Input id="add-sku" value={sku} onChange={(e) => setSku(e.target.value)} required className="flex-1" />
                <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={autoSku} title="Auto-generate SKU">Auto</Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-desc">Description</Label>
            <textarea id="add-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
          </div>

          <div className="space-y-2">
            <Label>Images</Label>
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

function EditProductDialog({ product, onClose, brands, types }: { product: ProductItem; onClose: () => void; brands: CatalogRef[]; types: CatalogRef[] }) {
  const utils = trpc.useUtils();
  const updateProduct = trpc.product.update.useMutation({
    onSuccess: () => { utils.product.adminList.invalidate(); toast.success("Product updated"); onClose(); },
    onError: (err) => toast.error(err.message),
  });

  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [description, setDescription] = useState(product.description ?? "");
  const [existingUrls, setExistingUrls] = useState<string[]>(product.images);
  const [newImages, setNewImages] = useState<UploadedImage[]>([]);
  const [brandId, setBrandId] = useState(product.brand?.id ?? "");
  const [typeId, setTypeId] = useState(product.productType?.id ?? "");
  const { value: initVol, unit: initUnit } = fromMl(product.volumeMl);
  const [volValue, setVolValue] = useState(initVol);
  const [volUnit, setVolUnit] = useState<"cl" | "L">(initUnit);
  const [unitsPerPack, setUnitsPerPack] = useState(String(product.unitsPerPack));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateProduct.mutate({
      id: product.id,
      data: {
        name,
        price: parseFloat(price),
        description: description || null,
        images: [...existingUrls, ...newImages.map((i) => i.url)],
        brandId: brandId || null,
        productTypeId: typeId || null,
        volumeMl: toMl(volValue, volUnit) ?? null,
        unitsPerPack: parseInt(unitsPerPack) || 1,
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
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name *</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <CatalogFields
            brands={brands} types={types}
            brandId={brandId} setBrandId={setBrandId}
            typeId={typeId} setTypeId={setTypeId}
            volValue={volValue} setVolValue={setVolValue}
            volUnit={volUnit} setVolUnit={setVolUnit}
            unitsPerPack={unitsPerPack} setUnitsPerPack={setUnitsPerPack}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price (₦) *</Label>
              <Input id="edit-price" type="number" step="0.01" min="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input value={product.sku} disabled className="opacity-60" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>

          {existingUrls.length > 0 && (
            <div className="space-y-2">
              <Label>Current Images</Label>
              <div className="grid grid-cols-4 gap-2">
                {existingUrls.map((url, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-md border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setExistingUrls(existingUrls.filter((_, j) => j !== i))}
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
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

  const { data, isLoading } = trpc.product.adminList.useQuery({ limit: 100, offset: 0 });
  const { data: brandsData } = trpc.brand.adminList.useQuery();
  const { data: typesData } = trpc.productType.adminList.useQuery();

  const brands: CatalogRef[] = (brandsData ?? []).map((b) => ({ id: b.id, name: b.name, slug: b.slug }));
  const types: CatalogRef[] = (typesData ?? []).map((t) => ({ id: t.id, name: t.name, slug: t.slug }));

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
                <TableHead>Brand</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((product) => (
                <TableRow key={product.id} className={!product.isActive ? "opacity-50" : undefined}>
                  <TableCell>
                    <p className="font-medium">{product.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{product.sku}</p>
                  </TableCell>
                  <TableCell className="text-sm">{product.brand?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-sm">{product.productType?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="text-sm font-mono">
                    {product.volumeMl
                      ? formatPackSize(product.volumeMl, product.unitsPerPack)
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(Number(product.price))}</TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? "success" : "secondary"}>
                      {product.isActive ? "Active" : "Suspended"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => setEditProduct(product as ProductItem)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {product.isActive ? (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Suspend" disabled={deactivate.isPending} onClick={() => deactivate.mutate({ id: product.id })}>
                          <PowerOff className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-green-700 hover:text-green-700" disabled={activate.isPending} onClick={() => activate.mutate({ id: product.id })}>
                          <Power className="h-3.5 w-3.5" />Resume
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No products yet. Add your first one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <AddProductDialog open={addOpen} onClose={() => setAddOpen(false)} brands={brands} types={types} />
      {editProduct && <EditProductDialog product={editProduct} onClose={() => setEditProduct(null)} brands={brands} types={types} />}
    </div>
  );
}
