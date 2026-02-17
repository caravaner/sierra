"use client";

import { trpc } from "@/lib/trpc";

export default function DashboardPage() {
  const orders = trpc.order.list.useQuery({ limit: 5, offset: 0 });
  const products = trpc.product.list.useQuery({ limit: 1, offset: 0 });
  const inventory = trpc.inventory.list.useQuery({
    limit: 1,
    offset: 0,
    lowStock: true,
  });

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
          <p className="mt-2 text-3xl font-bold">{orders.data?.total ?? "—"}</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
          <p className="mt-2 text-3xl font-bold">
            {products.data?.total ?? "—"}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Low Stock Items</h3>
          <p className="mt-2 text-3xl font-bold">
            {inventory.data?.total ?? "—"}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Recent Orders</h2>
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.data?.items.map((order) => (
                <tr key={order.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium">
                      {order.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {order.itemCount}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    ${Number(order.totalAmount).toFixed(2)}
                  </td>
                </tr>
              ))}
              {orders.data?.items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
