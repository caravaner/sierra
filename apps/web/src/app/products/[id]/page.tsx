"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@sierra/shared";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: product, isLoading } = trpc.product.byId.useQuery({
    id: params.id,
  });

  if (isLoading) {
    return <p className="py-10 text-center text-gray-500">Loading...</p>;
  }

  if (!product) {
    return <p className="py-10 text-center text-gray-500">Product not found.</p>;
  }

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="aspect-square rounded-lg bg-gray-100" />
      <div>
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="mt-1 text-sm text-gray-500">{product.category}</p>
        <p className="mt-4 text-2xl font-bold">
          {formatCurrency(product.price)}
        </p>
        <p className="mt-4 text-gray-700">{product.description}</p>
        <button className="mt-8 rounded-lg bg-black px-8 py-3 font-semibold text-white hover:bg-gray-800">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
