import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { TRPCProvider } from "@/lib/trpc-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sierra Admin",
  description: "Sierra Order Platform - Admin Dashboard",
};

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TRPCProvider>{children}</TRPCProvider>
    </SessionProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Providers>
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
        </Providers>
      </body>
    </html>
  );
}
