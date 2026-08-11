import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency, formatPackSize } from "@sierra/shared";
import { AddToCartButton } from "./add-to-cart-button";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const caller = await api();
  const product = await caller.product.byId({ id: params.id });

  if (!product) return {};

  const packLabel = product.volumeMl
    ? formatPackSize(product.volumeMl, product.unitsPerPack)
    : null;

  return {
    title: `${product.name}${packLabel ? ` (${packLabel})` : ""} — Delivery in Osapa & Lekki, Lagos`,
    description:
      product.description ??
      `Buy ${product.name}${packLabel ? ` ${packLabel}` : ""} with fast, same-day water delivery in Osapa, Lekki and environs, Lagos. Order via WhatsApp or online with WATA.`,
    alternates: { canonical: `/products/${product.id}` },
    openGraph: product.images[0] ? { images: [product.images[0]] } : undefined,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const caller = await api();
  const product = await caller.product.byId({ id: params.id });

  if (!product) notFound();

  const packLabel = product.volumeMl
    ? formatPackSize(product.volumeMl, product.unitsPerPack)
    : null;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.images,
    brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
    offers: {
      "@type": "Offer",
      price: Number(product.price),
      priceCurrency: "NGN",
      availability: "https://schema.org/InStock",
      areaServed: "Osapa, Lekki & environs, Lagos",
    },
  };

  return (
    <div className="grid gap-12 md:grid-cols-2">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <div className="overflow-hidden rounded-3xl bg-muted shadow-sm">
        <img
          src={product.images[0] ?? "/images/placeholder.svg"}
          alt={product.name}
          className="aspect-square w-full object-cover"
        />
      </div>

      <div className="flex flex-col justify-center">
        {/* Brand + type breadcrumb */}
        <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary/70">
          {product.brand && (
            <Link href={`/brands/${product.brand.slug}`} className="hover:text-primary">
              {product.brand.name}
            </Link>
          )}
          {product.brand && product.productType && <span>·</span>}
          {product.productType && <span>{product.productType.name}</span>}
        </div>

        <h1 className="text-4xl font-bold tracking-tight">{product.name}</h1>

        {packLabel && (
          <p className="mt-2 font-mono text-lg font-semibold text-foreground/70">{packLabel}</p>
        )}

        <p className="mt-4 text-4xl font-bold text-primary">{formatCurrency(Number(product.price))}</p>

        <div className="my-8 h-px bg-border" />

        {product.description && (
          <p className="leading-relaxed text-muted-foreground">{product.description}</p>
        )}

        <p className="mt-4 text-sm text-muted-foreground">
          Same-day water delivery in Osapa, Lekki and environs, Lagos. Order here or on WhatsApp.
        </p>

        <AddToCartButton
          productId={product.id}
          name={product.name}
          price={Number(product.price)}
          image={product.images[0] ?? null}
        />
      </div>
    </div>
  );
}
