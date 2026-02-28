"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {trpc} from "@/lib/trpc";
import {useCart} from "@/lib/cart-context";
import {formatCurrency, formatDate} from "@sierra/shared";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardFooter, CardHeader} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";
import {Package, RotateCcw} from "lucide-react";

function statusVariant(status: string): "default" | "secondary" | "outline" {
    switch (status.toLowerCase()) {
        case "delivered":
            return "default";
        case "shipped":
            return "secondary";
        default:
            return "outline";
    }
}

type Order = {
    id: string;
    items: { productId: string; name: string; quantity: number; unitPrice: number }[];
    [key: string]: unknown;
};

function RepeatOrderButton({order}: { order: Order }) {
    const {addItem} = useCart();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    function handleRepeat() {
        setLoading(true);
        for (const item of order.items) {
            addItem({
                productId: item.productId,
                name: item.name,
                price: item.unitPrice,
                image: null,
                quantity: item.quantity
            });
        }
        toast.success("Items added to cart", {
            action: {label: "View Cart", onClick: () => router.push("/cart")},
        });
        setLoading(false);
        router.push("/cart");
    }

    return (
        <Button variant="outline" size="sm" disabled={loading} onClick={handleRepeat}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5"/>
            Repeat Order
        </Button>
    );
}

export default function OrdersPage() {
    const {data, isLoading} = trpc.order.myOrders.useQuery();

    if (isLoading) {
        return <p className="py-10 text-center text-muted-foreground">Loading orders...</p>;
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
                <p className="mt-1 text-muted-foreground">Track and manage your orders</p>
            </div>

            {data?.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Package className="mb-4 h-12 w-12 text-muted-foreground"/>
                    <p className="mb-4 text-muted-foreground">You haven&apos;t placed any orders yet.</p>
                    <Button asChild>
                        <a href="/">Start Shopping</a>
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {data?.items.map((order) => (
                        <Card key={order.id}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDate(new Date(order.createdAt))}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                                        <p className="mt-1 text-sm font-semibold">{formatCurrency(order.totalAmount)}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <Separator/>
                            <CardContent className="pt-4">
                                <div className="space-y-2">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.name} <span className="font-medium text-foreground">×{item.quantity}</span>
                      </span>
                                            <span
                                                className="font-medium">{formatCurrency(item.unitPrice * item.quantity)}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0">
                                <RepeatOrderButton order={order}/>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
