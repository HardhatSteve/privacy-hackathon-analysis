import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        os: false,
        zlib: false,
      };

      config.resolve.alias = {
        ...config.resolve.alias,
        'safe-buffer': 'buffer',
        'bs58': 'bs58',
      };

      const webpack = require('webpack');
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
    }
    
    // Ignore snarkjs worker dependencies during build
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        'snarkjs': 'commonjs snarkjs',
        'ffjavascript': 'commonjs ffjavascript',
        'web-worker': 'commonjs web-worker'
      });
    }
    
    return config;
  },
};

export default nextConfig;
