import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ECHO | Solana Privacy Intelligence",
  description: "Making blockchain privacy risks visible and actionable. Analyze wallet privacy, detect deanonymization paths, and simulate privacy improvements on Solana.",
  keywords: ["Solana", "privacy", "blockchain", "deanonymization", "wallet analysis", "Range Protocol", "Helius", "QuickNode"],
  authors: [{ name: "Shawn Chee", url: "https://linkedin.com/in/shawn-chee-b39384267" }],
  creator: "Shawn Chee",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://github.com/Shawnchee/ECHO",
    title: "ECHO | Solana Privacy Intelligence",
    description: "Making blockchain privacy risks visible and actionable on Solana.",
    siteName: "ECHO",
  },
  twitter: {
    card: "summary_large_image",
    title: "ECHO | Solana Privacy Intelligence",
    description: "Making blockchain privacy risks visible and actionable on Solana.",
    creator: "@shawnchee",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Providers>
        <body
          suppressHydrationWarning
          className={`${inter.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </Providers>
    </html>
  );
}
