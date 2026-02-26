import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import { TRPCProvider } from "@/lib/trpc-provider";
import { CartProvider } from "@/lib/cart-context";
import { NavBar } from "@/components/nav-bar";
import { Toaster } from "sonner";
import { APP_NAME } from "@sierra/shared";
import "./globals.css";

export const metadata: Metadata = {
  title: `${APP_NAME} - Shop`,
  description: "Your one-stop shop for quality products",
  manifest: "/manifest.json",
  appleWebApp: {
    statusBarStyle: "default",
    title: APP_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TRPCProvider>
        <CartProvider>{children}</CartProvider>
      </TRPCProvider>
    </SessionProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <Providers>
          <NavBar />
          <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
