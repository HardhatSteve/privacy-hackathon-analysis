import type { Metadata } from "next";
import "./globals.css";
import { WalletProviderWrapper } from "@/components/WalletProvider";

export const metadata: Metadata = {
  title: "Solana Privacy Devkit Demo",
  description: "Demo app for the Solana Privacy Devkit",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <WalletProviderWrapper>{children}</WalletProviderWrapper>
      </body>
    </html>
  );
}
