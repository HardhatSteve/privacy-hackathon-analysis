const webpack = require('webpack');
const path = require('path');

module.exports = function override(config, env) {
  const cryptoPolyfillPath = path.resolve(__dirname, 'src/utils/crypto-polyfill.js');
  
  // Fix for process/browser resolution
  config.resolve.alias = {
    ...config.resolve.alias,
    'process/browser': require.resolve('process/browser.js'),
  };

  // Use our polyfill for crypto - it has hkdfSync
  // @noble packages don't import 'crypto' so they're completely safe
  config.resolve.fallback = {
    ...config.resolve.fallback,
    crypto: cryptoPolyfillPath,
    stream: require.resolve('stream-browserify'),
    buffer: require.resolve('buffer'),
    util: require.resolve('util'),
    assert: require.resolve('assert'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    os: require.resolve('os-browserify/browser'),
    url: require.resolve('url'),
    zlib: require.resolve('browserify-zlib'),
    process: require.resolve('process/browser.js'),
  };

  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
    }),
  ];

  return config;
};
