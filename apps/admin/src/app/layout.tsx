import type { Metadata } from "next";
import { TRPCProvider } from "@/lib/trpc-provider";
import { Toaster } from "sonner";
import { APP_NAME } from "@sierra/shared";
import "./globals.css";

export const metadata: Metadata = {
  title: `${APP_NAME} Admin`,
  description: `${APP_NAME} Order Platform - Admin Dashboard`,
};

function Providers({ children }: { children: React.ReactNode }) {
  return <TRPCProvider>{children}</TRPCProvider>;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <Providers>{children}</Providers>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
