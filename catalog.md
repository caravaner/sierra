# Product Catalog Plan — Brands, Types & Sizes

## Problem

The current `Product` model is a flat bag: `name`, `price`, `category`, `images`. This doesn't
express the real structure of the catalogue:

- **Brands** (CWAY, Eva, Voltic, etc.) each have a distinct identity and logo
- **Product types** (dispenser refill, dispenser bottle, PET bottle) are fundamentally
  different customer journeys — not just categories
- **Pack sizes** (50cl × 20, 33cl × 25, 19L × 1) are first-class product information
  that customers use to compare and make decisions

---

## Worked Example

**CWAY product range:**

| Display name | Type | Volume | Pack |
|---|---|---|---|
| CWAY Dispenser Refill | Refill (water only) | 19 L | 1 |
| CWAY Empty Dispenser Bottle | Empty bottle | 19 L | 1 |
| CWAY Dispenser Bottle + Water | Full unit (new buyers) | 19 L | 1 |
| CWAY Still Water 50cl | PET bottle | 50 cl | 20 |
| CWAY Still Water 33cl | PET bottle | 33 cl | 25 |

Each row is a **separate SKU / Product record** — no variant selector needed in the cart. The
customer picks the exact pack they want. This keeps the cart and order model simple.

---

## 1. Schema Changes

### New model: `Brand`

```prisma
model Brand {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique          -- url-safe: "cway", "eva"
  logo        String?                   -- image URL
  description String?
  isActive    Boolean  @default(true)   @map("is_active")
  sortOrder   Int      @default(0)      @map("sort_order")  -- controls homepage order
  createdAt   DateTime @default(now())  @map("created_at")

  products Product[]

  @@map("brands")
  @@schema("main")
}
```

### New enum: `ProductType`

```prisma
enum ProductType {
  PET_BOTTLE        -- 33cl, 50cl, 75cl, 1L, 1.5L — sold in packs
  DISPENSER_REFILL  -- 19L/20L water only; customer returns bottle for a refill
  DISPENSER_BOTTLE  -- Empty 19L/20L bottle, no water
  DISPENSER_FULL    -- Bottle + water (first-time buyer bundle)

  @@schema("main")
}
```

### `Product` — new fields

```prisma
model Product {
  // ... existing fields unchanged ...

  brandId       String?      @map("brand_id")
  productType   ProductType? @map("product_type")
  volumeMl      Int?         @map("volume_ml")       -- 500 = 50cl, 19000 = 19L
  unitsPerPack  Int          @default(1) @map("units_per_pack")

  brand Brand? @relation(fields: [brandId], references: [id])
}
```

> The existing `category` field is kept for backwards compatibility but is superseded
> by `productType` + `brand`. Existing products without the new fields continue to work.

---

## 2. Display Helpers

Add to `packages/shared/src/utils/index.ts`:

```typescript
/** 500 → "50cl", 1500 → "1.5L", 19000 → "19L" */
export function formatVolume(ml: number): string {
  if (ml >= 1000) {
    const l = ml / 1000;
    return `${Number.isInteger(l) ? l : l.toFixed(1)}L`;
  }
  return `${ml / 10}cl`;
}

/** "50cl × 20", "19L", "1.5L × 12" */
export function formatPackSize(volumeMl: number, unitsPerPack: number): string {
  const vol = formatVolume(volumeMl);
  return unitsPerPack === 1 ? vol : `${vol} × ${unitsPerPack}`;
}

export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  PET_BOTTLE:       "Bottled Water",
  DISPENSER_REFILL: "Dispenser Refill",
  DISPENSER_BOTTLE: "Dispenser Bottle",
  DISPENSER_FULL:   "Dispenser + Water",
};
```

---

## 3. Storefront

### 3a. Homepage

Current hero → products grid becomes:

```
Hero section
─────────────────────────────────────────────────────
Shop by Brand          (scrollable row of brand cards)
  [CWAY logo]  [Eva logo]  [Voltic logo]  [Aquafina ...]
─────────────────────────────────────────────────────
Shop by Type           (4 type cards)
  [🫙 Dispenser Refill]  [🚰 Dispenser Bottle]
  [💧 Bottled Water]     [📦 Dispenser + Water]
─────────────────────────────────────────────────────
All Products           (existing grid, with filters)
  Filter: [All] [CWAY] [Eva] [Voltic]   Type: [All] [Refill] [Bottles]
```

### 3b. Brand page: `/brands/[slug]`

```
CWAY banner (logo + description)
─────────────────────────────────────────────────────
Dispenser Products
  [Refill 19L]  [Empty Bottle]  [Bottle + Water]
─────────────────────────────────────────────────────
Bottled Water
  [50cl × 20]  [33cl × 25]  [1.5L × 12]
```

Products are grouped by `productType` within the brand page.

### 3c. Product card update

The card subtitle changes from `category` badge to:

```
CWAY  ·  Bottled Water        ← brand name + type label
50cl × 20                     ← pack size (large, prominent)
₦1,800.00                     ← price
```

### 3d. Product detail page update

Prominently display:
- Brand logo
- Product type
- Volume per unit + units per pack
- Total volume in pack (e.g., "10 litres total")

---

## 4. Admin Changes

### Brand management: `/brands`

New admin page with a simple table + create/edit dialogs:
- Name, slug (auto-generated from name, editable), logo upload, description, sort order, active toggle

### Product form additions

The create/edit product dialog gains 4 new fields:
1. **Brand** — searchable dropdown of active brands (optional)
2. **Product Type** — select: PET Bottle | Dispenser Refill | Dispenser Bottle | Dispenser Full
3. **Volume** — numeric input with unit toggle (cl / L), stored as `volumeMl`
4. **Units per pack** — numeric input (default 1)

SKU suggestion: auto-generate from brand + type + volume, e.g., `CWAY-PET-50CL-20` (admin can override).

---

## 5. API / tRPC Changes

### Shared validators

```typescript
// Add to createProductSchema and updateProductSchema:
brandId:      z.string().optional(),
productType:  z.enum(["PET_BOTTLE","DISPENSER_REFILL","DISPENSER_BOTTLE","DISPENSER_FULL"]).optional(),
volumeMl:     z.number().int().positive().optional(),
unitsPerPack: z.number().int().positive().default(1),
```

```typescript
// New productFilterSchema fields:
brandId:     z.string().optional(),
productType: z.enum([...]).optional(),
```

### New `brand` router

```typescript
brand.list   // all active brands in sort order
brand.get    // brand by slug (for brand page)
brand.create // admin: create brand
brand.update // admin: update brand
brand.delete // admin: deactivate brand
```

---

## 6. URL Structure

| URL | Description |
|---|---|
| `/` | Homepage with brand banners + type sections |
| `/brands/[slug]` | All products for one brand, grouped by type |
| `/products/[id]` | Single product detail |
| `/?brand=cway` | Filter homepage grid by brand |
| `/?type=pet_bottle` | Filter homepage grid by type |
| `/?brand=cway&type=pet_bottle` | Combined filter |

---

## 7. Implementation Order

1. **Schema** — add `Brand` model + `ProductType` enum + product fields → `db push`
2. **Shared utils** — `formatVolume`, `formatPackSize`, `PRODUCT_TYPE_LABELS`
3. **API** — brand router, update product router with new fields + filters
4. **Admin** — brand management page, update product form
5. **Storefront** — brand banners on homepage, brand page `/brands/[slug]`, updated product card + detail
6. **Data entry** — add brands, re-enter products with proper types and sizes

---

## 8. Open Questions

| Question | Options |
|---|---|
| Should the homepage show brands or types first? | Brand banners first (more visual, brand recognition), then type section |
| What brands do you carry? | CWAY confirmed; list others to seed the DB |
| Are there products that don't belong to any brand? | Yes — generic table water; leave `brandId` nullable |
| Pagination on brand page? | Start with all (likely <20 products per brand); add pagination later |
| Should the 19L refill show a "return deposit" note? | Yes — add to product description for now; field later |
