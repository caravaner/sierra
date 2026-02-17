"use client";

import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@sierra/shared";

export default function HomePage() {
  const { data, isLoading } = trpc.product.list.useQuery({
    limit: 20,
    offset: 0,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Loading products...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">Featured Products</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data?.items.map((product) => (
          <a
            key={product.id}
            href={`/products/${product.id}`}
            className="group rounded-lg border p-4 transition-shadow hover:shadow-md"
          >
            <div className="mb-4 aspect-square rounded-md bg-gray-100" />
            <h2 className="font-semibold group-hover:text-blue-600">
              {product.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{product.category}</p>
            <p className="mt-2 text-lg font-bold">
              {formatCurrency(product.price)}
            </p>
          </a>
        ))}
      </div>
      {data?.items.length === 0 && (
        <p className="py-10 text-center text-gray-500">
          No products available yet.
        </p>
      )}
    </div>
  );
}
