"use client";

import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@sierra/shared";

export default function OrdersPage() {
  const { data, isLoading } = trpc.order.myOrders.useQuery();

  if (isLoading) {
    return <p className="py-10 text-center text-gray-500">Loading orders...</p>;
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">My Orders</h1>
      {data?.items.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-gray-500">You haven&apos;t placed any orders yet.</p>
          <a
            href="/"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            Start Shopping
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.items.map((order) => (
            <div key={order.id} className="rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Order #{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(new Date(order.createdAt))}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
                    {order.status}
                  </span>
                  <p className="mt-1 font-bold">
                    {formatCurrency(order.totalAmount)}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>
                      {item.name} x{item.quantity}
                    </span>
                    <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
