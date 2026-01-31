const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const path = require('path');

module.exports = function (context, options) {
  return {
    name: 'custom-webpack-config',
    configureWebpack(config, isServer, utils) {
      return {
        plugins: [
          new NodePolyfillPlugin({
            includeAliases: ['Buffer', 'process'],
          }),
        ],
        resolve: {
          fallback: {
            buffer: require.resolve('buffer/'),
            crypto: false,
            stream: false,
            path: false,
            fs: false,
          },
          alias: {
            'solana-privacy-scanner-core': path.resolve(__dirname, '../../packages/core/src'),
          },
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
          extensionAlias: {
            '.js': ['.ts', '.tsx', '.js'],
            '.mjs': ['.mts', '.mjs'],
          },
        },
        module: {
          rules: [
            {
              test: /\.m?[jt]sx?$/,
              include: path.resolve(__dirname, '../../packages/core/src'),
              use: {
                loader: 'babel-loader',
                options: {
                  presets: [
                    '@babel/preset-typescript',
                    ['@babel/preset-react', { runtime: 'automatic' }],
                  ],
                },
              },
            },
          ],
        },
      };
    },
  };
};
