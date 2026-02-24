import { api } from "@/lib/api";
import { ProductCard } from "@/components/product-card";

export default async function HomePage() {
  const caller = await api();
  const data = await caller.product.list({ limit: 20, offset: 0 });

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Featured Products</h1>
        <p className="mt-2 text-muted-foreground">Discover our latest collection</p>
      </div>

      {data.items.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">No products available yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.items.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              category={product.category ?? null}
              images={product.images}
            />
          ))}
        </div>
      )}
    </div>
  );
}
