import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { formatPackSize } from "@sierra/shared";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function BrandPage({ params }: { params: { slug: string } }) {
  const caller = await api();
  const brand = await caller.brand.bySlug({ slug: params.slug });

  if (!brand) notFound();

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
          {brand.description && (
            <p className="mt-2 max-w-xl text-muted-foreground">{brand.description}</p>
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
