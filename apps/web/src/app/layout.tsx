import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import { TRPCProvider } from "@/lib/trpc-provider";
import { CartProvider } from "@/lib/cart-context";
import { NavBar } from "@/components/nav-bar";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Toaster } from "sonner";
import { APP_NAME } from "@sierra/shared";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "https://wata.ng";

const META_TITLE = "Water Delivery in Osapa, Lekki & Environs, Lagos | WATA";
const META_DESCRIPTION =
  "Get fast, same-day bottled and refill or dispenser water delivery in Osapa and Lekki, Lagos. Shop trusted brands like CWAY, Aquafina, EVA, Aquadana & Nestle via WhatsApp or website.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: META_TITLE,
    template: `%s | ${APP_NAME}`,
  },
  description: META_DESCRIPTION,
  keywords: [
    "water delivery Lekki",
    "water delivery Osapa",
    "bottled water Lagos",
    "dispenser water delivery Lagos",
    "refill water Lekki",
    "CWAY water delivery",
    "Aquafina Lagos",
    "EVA water Lagos",
    "Aquadana water",
    "Nestle Pure Life Lagos",
  ],
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    url: SITE_URL,
    title: META_TITLE,
    description: META_DESCRIPTION,
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: META_TITLE,
    description: META_DESCRIPTION,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    statusBarStyle: "default",
    title: APP_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: "#1171B0",
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
          <WhatsAppButton />
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
