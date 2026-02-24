import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { formatCurrency } from "@sierra/shared";
import { AddToCartButton } from "./add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const caller = await api();
  const product = await caller.product.byId({ id: params.id });

  if (!product) {
    notFound();
  }

  return (
    <div className="grid gap-12 md:grid-cols-2">
      <div className="overflow-hidden rounded-xl bg-muted">
        <img
          src={product.images[0] ?? "/images/placeholder.svg"}
          alt={product.name}
          className="aspect-square w-full object-cover"
        />
      </div>

      <div className="flex flex-col">
        <Badge variant="secondary" className="mb-3 w-fit">{product.category}</Badge>
        <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
        <p className="mt-4 text-3xl font-bold">{formatCurrency(product.price)}</p>

        <Separator className="my-6" />

        <p className="text-muted-foreground leading-relaxed">{product.description}</p>

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
