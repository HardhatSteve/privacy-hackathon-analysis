import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Proxy other API requests to Python backend
  // analyze-wallet now uses its own API route with extended timeout
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000'
    return [
      {
        source: '/portfolio/:path*',
        destination: `${backendUrl}/portfolio/:path*`,
      },
    ]
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}

export default nextConfig
