import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Privacy Scanner | Solana Wallet Analysis',
  description: 'Professional privacy analysis tool for Solana wallets. Detect CEX exposure, clustering patterns, and identity leaks.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full bg-[#FAFAFA] text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
