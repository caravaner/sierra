"use client";

import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@sierra/shared";

export default function OrdersPage() {
  const { data, isLoading } = trpc.order.list.useQuery({
    limit: 50,
    offset: 0,
  });

  if (isLoading) {
    return <p className="text-gray-500">Loading orders...</p>;
  }

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Order Management</h1>
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.items.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  {order.id.slice(0, 8)}...
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {order.customerId.slice(0, 8)}...
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium">
                    {order.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  {formatCurrency(Number(order.totalAmount))}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatDate(new Date(order.createdAt))}
                </td>
              </tr>
            ))}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
