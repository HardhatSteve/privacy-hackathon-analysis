import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SolanaWalletProvider } from "@/components/ui/WalletProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PrivyLocker",
  description: "Privacy-focused Document Verification on Solana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SolanaWalletProvider>
          {children}
        </SolanaWalletProvider>
      </body>
    </html>
  );
}

