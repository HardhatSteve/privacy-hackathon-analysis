import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypePrettyCode from 'rehype-pretty-code';
import bundleAnalyzer from '@next/bundle-analyzer';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  transpilePackages: ['@velumdotcash/sdk'],
  serverExternalPackages: ['snarkjs', '@lightprotocol/hasher.rs'],
  async headers() {
    // CSP needs 'unsafe-eval' for WASM/snarkjs ZK proofs and 'unsafe-inline' for Next.js
    // In production, consider using nonces for scripts
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.helius-rpc.com https://*.solana.com https://*.upstash.io wss://*.solana.com https://api.velum.cash https://velum-rpc.velum.cash https://*.privacycash.org",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    // Resolve WASM files for @lightprotocol/hasher.rs
    const hasherDir = path.dirname(require.resolve('@lightprotocol/hasher.rs/package.json'));
    config.resolve.alias = {
      ...config.resolve.alias,
      'light_wasm_hasher_bg.wasm': path.join(hasherDir, 'dist', 'light_wasm_hasher_bg.wasm'),
      'hasher_wasm_simd_bg.wasm': path.join(hasherDir, 'dist', 'hasher_wasm_simd_bg.wasm'),
    };

    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    // Ignore node-specific modules in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypePrettyCode,
        {
          theme: 'github-dark',
          keepBackground: true,
        },
      ],
    ],
  },
});

export default withBundleAnalyzer(withMDX(nextConfig));
