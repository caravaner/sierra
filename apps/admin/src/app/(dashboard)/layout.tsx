export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-white">
        <div className="p-6">
          <h1 className="text-xl font-bold">Sierra Admin</h1>
        </div>
        <nav className="space-y-1 px-3">
          <a
            href="/"
            className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Dashboard
          </a>
          <a
            href="/orders"
            className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Orders
          </a>
          <a
            href="/products"
            className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Products
          </a>
          <a
            href="/inventory"
            className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100"
          >
            Inventory
          </a>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
