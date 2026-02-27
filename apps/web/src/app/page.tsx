import Link from "next/link";
import { api } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@sierra/shared";

export default async function HomePage() {
  const caller = await api();
  const [productData, brands] = await Promise.all([
    caller.product.list({ limit: 20, offset: 0 }),
    caller.brand.list(),
  ]);

  return (
    <div>
      {/* Hero */}
      <div className="mb-16 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-10 py-20 text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary/70">
          Fresh &amp; Pure
        </p>
        <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
          Water that&apos;s worth
          <br />
          <span className="text-primary">every drop.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-lg text-muted-foreground">
          Premium still and sparkling water delivered fresh to your door.
        </p>
        <Button size="lg" className="mt-8 rounded-full px-8 text-base font-semibold" asChild>
          <a href="#products">Shop Now →</a>
        </Button>
      </div>

      {/* Brand banners */}
      {brands.length > 0 && (
        <section className="mb-14">
          <h2 className="mb-5 text-xl font-bold tracking-tight">Shop by Brand</h2>
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
          <h2 className="text-2xl font-bold tracking-tight">All Products</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {productData.items.length} product{productData.items.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </div>

      {productData.items.length === 0 ? (
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
