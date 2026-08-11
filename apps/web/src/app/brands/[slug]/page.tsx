import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { formatPackSize } from "@sierra/shared";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type BrandProduct = {
  volumeMl: number | null;
  productType: { name: string; slug: string } | null;
};

/**
 * Describes what a brand actually sells, based on its live products — not every
 * brand carries dispenser (18.9L) refills, so this must never be hardcoded.
 * Returns e.g. "bottled water", "dispenser water", "bottled and dispenser water".
 */
function describeOffering(products: BrandProduct[]): string {
  let hasDispenser = false;
  let hasBottled = false;

  for (const p of products) {
    const type = `${p.productType?.slug ?? ""} ${p.productType?.name ?? ""}`.toLowerCase();
    // Fall back to volume when a product has no type: dispenser refills are the
    // only sizes that run into the litres (18.9L), bottles are 50cl–1.5L.
    if (type.includes("dispenser") || (p.volumeMl !== null && p.volumeMl >= 5000)) {
      hasDispenser = true;
    } else {
      hasBottled = true;
    }
  }

  if (hasBottled && hasDispenser) return "bottled and dispenser water";
  if (hasDispenser) return "dispenser water";
  if (hasBottled) return "bottled water";
  return "water";
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const caller = await api();
  const brand = await caller.brand.bySlug({ slug: params.slug });

  if (!brand) return {};

  const offering = describeOffering(brand.products);

  return {
    title: `${brand.name} Water Delivery in Osapa, Lekki & Environs, Lagos`,
    description:
      brand.description ??
      `Order ${brand.name} ${offering} for fast, same-day delivery in Osapa, Lekki and surrounding areas of Lagos. Shop via WhatsApp or online with WATA.`,
    alternates: { canonical: `/brands/${brand.slug}` },
  };
}

export default async function BrandPage({ params }: { params: { slug: string } }) {
  const caller = await api();
  const brand = await caller.brand.bySlug({ slug: params.slug });

  if (!brand) notFound();

  const offering = describeOffering(brand.products);
  const offeringLabel = offering.charAt(0).toUpperCase() + offering.slice(1);

  // Group products by product type name
  const grouped = new Map<string, typeof brand.products>();
  for (const product of brand.products) {
    const key = product.productType?.name ?? "Other";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(product);
  }

  // Sort groups so those with a productType sortOrder come first; "Other" last
  const groups = Array.from(grouped.entries()).sort(([a], [b]) =>
    a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b),
  );

  return (
    <div>
      {/* Back */}
      <Link
        href="/#products"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All Products
      </Link>

      {/* Brand header */}
      <div className="mb-12 flex items-center gap-6 rounded-3xl bg-gradient-to-br from-primary/8 via-primary/3 to-transparent p-8">
        {brand.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brand.logo}
            alt={brand.name}
            className="h-20 w-32 shrink-0 object-contain"
          />
        )}
        <div>
          <h1 className="text-4xl font-bold tracking-tight">{brand.name}</h1>
          <p className="mt-2 max-w-xl text-lg text-muted-foreground">
            {offeringLabel} delivery in Osapa, Lekki &amp; environs, Lagos
          </p>
          {brand.description && (
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">{brand.description}</p>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            {brand.products.length} product{brand.products.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {brand.products.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-muted-foreground">No products available for this brand yet.</p>
        </div>
      ) : (
        <div className="space-y-14">
          {groups.map(([typeName, products]) => (
            <section key={typeName}>
              <h2 className="mb-6 text-xl font-bold tracking-tight">{typeName}</h2>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    images={product.images}
                    brand={{ name: brand.name, slug: brand.slug }}
                    productType={product.productType}
                    volumeMl={product.volumeMl}
                    unitsPerPack={product.unitsPerPack}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
