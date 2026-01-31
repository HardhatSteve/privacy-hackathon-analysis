import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'PrivacyLens - Privacy Analysis for Solana Programs',
    template: '%s | PrivacyLens',
  },
  description:
    'Automated privacy analysis and scoring for Solana smart contracts. Identify privacy leaks, timing attacks, and PII exposure before deployment.',
  keywords: [
    'Solana',
    'privacy',
    'security',
    'smart contract',
    'audit',
    'analysis',
    'vulnerability',
    'blockchain',
  ],
  authors: [{ name: 'PrivacyLens Team' }],
  creator: 'PrivacyLens',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://privacylens.io',
    siteName: 'PrivacyLens',
    title: 'PrivacyLens - Privacy Analysis for Solana Programs',
    description:
      'Automated privacy analysis and scoring for Solana smart contracts.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PrivacyLens',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PrivacyLens - Privacy Analysis for Solana Programs',
    description:
      'Automated privacy analysis and scoring for Solana smart contracts.',
    images: ['/og-image.png'],
    creator: '@privacylens',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${GeistSans.variable} ${GeistMono.variable}`}
        suppressHydrationWarning
      >
        <body className="min-h-screen bg-background font-sans antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              {children}
              <Toaster richColors position="top-right" />
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
