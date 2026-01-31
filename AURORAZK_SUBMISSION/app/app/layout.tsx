import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/components/WalletProvider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AuroraZK | Dark Limit Order Book",
  description: "Privacy-first limit order book on Solana using Noir ZK proofs and Light Protocol compression",
  keywords: ["Solana", "DeFi", "ZK", "Zero Knowledge", "Privacy", "Trading", "DEX"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Pre-load wallet adapter styles before globals.css to fix @import order */}
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap"
        />
      </head>
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased bg-zinc-950 text-white min-h-screen`}
      >
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}
