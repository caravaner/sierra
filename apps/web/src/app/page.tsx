import { api } from "@/lib/api";
import { formatCurrency } from "@sierra/shared";
import { Badge } from "@/components/ui/badge";

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
            <a
              key={product.id}
              href={`/products/${product.id}`}
              className="group flex flex-col rounded-lg border bg-card transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="overflow-hidden rounded-t-lg bg-muted">
                <img
                  src={product.images[0] ?? "/images/placeholder.svg"}
                  alt={product.name}
                  className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <Badge variant="secondary" className="mb-2 w-fit text-xs">
                  {product.category}
                </Badge>
                <h2 className="font-semibold leading-snug">{product.name}</h2>
                <p className="mt-auto pt-3 text-lg font-bold">
                  {formatCurrency(product.price)}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
