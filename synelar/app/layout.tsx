import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "synelar-ashum9",
  description:
    "Reclaim what Big Tech steals. Turn your Solana wallet into a secure, earning ID. Mint your MetaID NFT. Apps pay you SOL to access it.",
  generator: "v0.app",
  icons: {
    icon: "https://ik.imagekit.io/ashum9/Logo.jpg",
    shortcut: "https://ik.imagekit.io/ashum9/Logo.jpg",
    apple: "https://ik.imagekit.io/ashum9/Logo.jpg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
