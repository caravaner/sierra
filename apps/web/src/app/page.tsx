import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@sierra/shared";

const SITE_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "https://wata.ng";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: APP_NAME,
  alternateName: "WATA",
  description:
    "Fast, same-day bottled and refill or dispenser water delivery in Osapa, Lekki and environs, Lagos.",
  url: SITE_URL,
  image: `${SITE_URL}/icon-512x512.png`,
  priceRange: "₦₦",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Lekki",
    addressRegion: "Lagos",
    addressCountry: "NG",
  },
  areaServed: ["Osapa London", "Lekki", "Lekki Phase 1", "Agungi", "Ikate", "Lagos"].map((name) => ({
    "@type": "Place",
    name,
  })),
};

export default async function HomePage() {
  const caller = await api();
  let productData: Awaited<ReturnType<typeof caller.product.list>> = { items: [], total: 0 };
  let brands: Awaited<ReturnType<typeof caller.brand.list>> = [];
  let catalogUnavailable = false;
  try {
    [productData, brands] = await Promise.all([
      caller.product.list({ limit: 20, offset: 0 }),
      caller.brand.list(),
    ]);
  } catch (err) {
    console.error("HomePage catalog fetch failed", err);
    catalogUnavailable = true;
  }

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />

      {/* Hero */}
      <div className="mb-6 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 py-14 text-center sm:px-10">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary/70">
          Same-Day Delivery in Lekki
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
          Fast &amp; Reliable Water Delivery in{" "}
          <span className="text-primary">Osapa, Lekki &amp; Environs</span>, Lagos
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          We deliver bottled and refill water straight to your doorstep in Osapa, Lekki and
          surrounding areas.
        </p>
        <Button size="lg" className="mt-8 rounded-full px-8 text-base font-semibold" asChild>
          <a href="#products">Shop Now →</a>
        </Button>
      </div>

      {/* Quick facts — keeps the brand, size and ordering keywords on the page
          without a wall of copy in the hero. */}
      <section className="mb-14 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-3">
        {[
          {
            label: "Trusted brands",
            value: "Aquafina · CWAY · EVA · Nestle · Aquadana",
          },
          {
            label: "Sizes available",
            value: "50cl · 75cl · 18.9L dispenser",
          },
          {
            label: "How to order",
            value: "WhatsApp or online — same-day delivery",
          },
        ].map((fact) => (
          <div key={fact.label} className="bg-background px-6 py-5 text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
              {fact.label}
            </p>
            <p className="mt-1.5 text-sm font-medium leading-snug">{fact.value}</p>
          </div>
        ))}
      </section>

      {/* Brand banners */}
      {brands.length > 0 && (
        <section className="mb-14">
          <h2 className="mb-1 text-xl font-bold tracking-tight">
            Shop Trusted Water Brands in Lekki
          </h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Aquafina, CWAY, EVA, Nestle, Aquadana and more — delivered same-day across Osapa, Lekki
            and environs.
          </p>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/brands/${brand.slug}`}
                className="group flex shrink-0 flex-col items-center gap-3 rounded-2xl border bg-card px-8 py-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                {brand.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="h-12 w-24 object-contain"
                  />
                ) : (
                  <div className="flex h-12 w-24 items-center justify-center">
                    <span className="text-lg font-bold text-primary">{brand.name}</span>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                    {brand.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {brand.productCount} product{brand.productCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Products */}
      <div id="products" className="mb-8 flex items-baseline justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Bottled, Refill &amp; Dispenser Water for Delivery
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            50cl, 75cl and 18.9L dispenser water at competitive prices
            {!catalogUnavailable &&
              ` — ${productData.items.length} product${productData.items.length !== 1 ? "s" : ""} available`}
            .
          </p>
        </div>
      </div>

      {catalogUnavailable ? (
        <div className="py-24 text-center">
          <p className="text-muted-foreground">
            We couldn&apos;t load products right now. Please refresh in a moment.
          </p>
        </div>
      ) : productData.items.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-muted-foreground">No products available yet — check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {productData.items.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={Number(product.price)}
              images={product.images}
              brand={product.brand}
              productType={product.productType}
              volumeMl={product.volumeMl}
              unitsPerPack={product.unitsPerPack}
            />
          ))}
        </div>
      )}
    </div>
  );
}
