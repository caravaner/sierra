import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { TRPCProvider } from "@/lib/trpc-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sierra - Shop",
  description: "Your one-stop shop for quality products",
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
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <Providers>
          <header className="border-b">
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <a href="/" className="text-xl font-bold">
                Sierra
              </a>
              <div className="flex items-center gap-6">
                <a href="/products" className="hover:text-gray-600">
                  Products
                </a>
                <a href="/cart" className="hover:text-gray-600">
                  Cart
                </a>
                <a href="/orders" className="hover:text-gray-600">
                  Orders
                </a>
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
