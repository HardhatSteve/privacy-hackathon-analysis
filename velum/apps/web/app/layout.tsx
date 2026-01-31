import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Providers } from "@/components/providers";
import { GLBackground } from "@/components/gl-background";
import { GlobalFooter } from "@/components/layout/global-footer";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Velum | Private Payments on Solana",
  description:
    "Send and receive private payments on Solana. Share a link, get paid without revealing your wallet address.",
  keywords: [
    "Velum",
    "Solana",
    "privacy",
    "payments",
    "cryptocurrency",
    "ZK",
    "zero-knowledge",
  ],
  authors: [{ name: "Velum" }],
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "Velum Cash",
  },
  openGraph: {
    type: "website",
    title: "Velum",
    description:
      "Private payments on Solana. Share a link, get paid anonymously.",
    siteName: "Velum",
  },
  twitter: {
    card: "summary_large_image",
    title: "Velum",
    description: "Private payments on Solana",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geistMono.variable}>
      <body className="min-h-dvh bg-background text-foreground antialiased" suppressHydrationWarning>
        <Providers>
          {/* Skip link for keyboard navigation */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-background focus:font-mono focus:text-sm"
          >
            Skip to main content
          </a>
          <GLBackground />
          <div className="relative z-10 min-h-dvh flex flex-col">
            {children}
            <GlobalFooter />
          </div>
          <Toaster position="bottom-right" theme="dark" closeButton />
        </Providers>
      </body>
    </html>
  );
}
