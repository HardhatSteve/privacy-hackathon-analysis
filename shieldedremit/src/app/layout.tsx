import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "ShieldedRemit | Privacy-Preserving Cross-Border Remittances",
  description:
    "Send money across borders with privacy-by-default. Built on Solana with SilentSwap and ShadowWire for secure, instant, low-cost transfers.",
  keywords: [
    "remittance",
    "crypto",
    "Solana",
    "privacy",
    "cross-border payments",
    "blockchain",
  ],
  authors: [{ name: "ShieldedRemit Team" }],
  openGraph: {
    title: "ShieldedRemit | Privacy-Preserving Cross-Border Remittances",
    description:
      "Send money across borders with privacy-by-default. Built on Solana.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col font-sans">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
