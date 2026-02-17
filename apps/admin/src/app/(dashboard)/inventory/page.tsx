"use client";

import { trpc } from "@/lib/trpc";

export default function InventoryPage() {
  const { data, isLoading } = trpc.inventory.list.useQuery({
    limit: 50,
    offset: 0,
  });

  if (isLoading) {
    return <p className="text-gray-500">Loading inventory...</p>;
  }

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Inventory Management</h1>
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Product ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                On Hand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Reserved
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Available
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Reorder Point
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  {item.productId.slice(0, 8)}...
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  {item.quantityOnHand}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  {item.quantityReserved}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                  {item.quantityAvailable}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  {item.reorderPoint}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      item.needsReorder
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {item.needsReorder ? "Low Stock" : "In Stock"}
                  </span>
                </td>
              </tr>
            ))}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                  No inventory items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
