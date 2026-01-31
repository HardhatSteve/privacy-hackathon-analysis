import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ws"],
  // Empty turbopack config to use Turbopack (default in Next.js 16)
  // Source map warnings are harmless dev noise
  turbopack: {},
};

export default nextConfig;
