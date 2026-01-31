import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration (default in Next.js 16)
  turbopack: {
    // WASM support for Noir ZK proofs and Light Protocol
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.wasm'],
  },
  
  // Webpack configuration for browser polyfills (Light Protocol SDK)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Polyfill or ignore Node.js modules in browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        worker_threads: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
      };
      
      // Provide Buffer globally (required by Light Protocol)
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
    }
    
    // Handle .wasm files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    return config;
  },
  
  // Transpile Solana packages (Light Protocol uses dynamic import, no transpile needed)
  transpilePackages: [
    '@solana/web3.js',
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-react',
    '@solana/wallet-adapter-react-ui',
  ],
  
  // Headers for WASM files
  async headers() {
    return [
      {
        source: '/:path*.wasm',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/wasm',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
