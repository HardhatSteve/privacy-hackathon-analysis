import * as esbuild from 'esbuild';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
  '@solana/web3.js', // Don't bundle web3.js from core package
];

const watchMode = process.argv.includes('--watch');

const config = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  external,
  platform: 'node',
  target: 'node25',
  format: 'esm',
  outfile: 'dist/index.js',
  sourcemap: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
};

async function build() {
  try {
    await esbuild.build(config);

    // Copy known-addresses.json from core package
    const { copyFileSync, mkdirSync } = await import('fs');
    mkdirSync('dist', { recursive: true });
    copyFileSync('../core/dist/known-addresses.json', 'dist/known-addresses.json');

    console.log('✓ CLI build complete');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

if (watchMode) {
  const ctx = await esbuild.context(config);
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await build();
}
