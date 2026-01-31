import * as esbuild from 'esbuild';
import { readFileSync, copyFileSync, mkdirSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {})
];

const watchMode = process.argv.includes('--watch');

const baseConfig = {
  bundle: true,
  external,
  platform: 'node',
  target: 'node25',
  sourcemap: true,
};

async function build() {
  try {
    // Ensure dist directory exists
    mkdirSync('dist', { recursive: true });

    // Main package builds
    await esbuild.build({
      ...baseConfig,
      entryPoints: ['src/index.ts'],
      format: 'esm',
      outfile: 'dist/index.js',
    });

    await esbuild.build({
      ...baseConfig,
      entryPoints: ['src/index.ts'],
      format: 'cjs',
      outfile: 'dist/index.cjs',
    });

    // Matchers builds (separate entry point)
    await esbuild.build({
      ...baseConfig,
      entryPoints: ['src/matchers.ts'],
      format: 'esm',
      outfile: 'dist/matchers.js',
    });

    await esbuild.build({
      ...baseConfig,
      entryPoints: ['src/matchers.ts'],
      format: 'cjs',
      outfile: 'dist/matchers.cjs',
    });

    // Narrative builds (separate entry point for browser import)
    await esbuild.build({
      ...baseConfig,
      entryPoints: ['src/narrative.ts'],
      format: 'esm',
      outfile: 'dist/narrative.js',
    });

    await esbuild.build({
      ...baseConfig,
      entryPoints: ['src/narrative.ts'],
      format: 'cjs',
      outfile: 'dist/narrative.cjs',
    });

    // Normalizer builds (separate entry point for browser import)
    await esbuild.build({
      ...baseConfig,
      entryPoints: ['src/normalizer.ts'],
      format: 'esm',
      outfile: 'dist/normalizer.js',
    });

    await esbuild.build({
      ...baseConfig,
      entryPoints: ['src/normalizer.ts'],
      format: 'cjs',
      outfile: 'dist/normalizer.cjs',
    });

    // Scanner builds (separate entry point for browser import)
    await esbuild.build({
      ...baseConfig,
      entryPoints: ['src/scanner.ts'],
      format: 'esm',
      outfile: 'dist/scanner.js',
    });

    await esbuild.build({
      ...baseConfig,
      entryPoints: ['src/scanner.ts'],
      format: 'cjs',
      outfile: 'dist/scanner.cjs',
    });

    // Copy static assets (JSON label file from repository root)
    // This allows the database to be updated via PRs without package releases
    copyFileSync('../../known-addresses.json', 'dist/known-addresses.json');

    console.log('✓ Build complete');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

if (watchMode) {
  // Watch both entry points in ESM mode
  const ctxMain = await esbuild.context({
    ...baseConfig,
    entryPoints: ['src/index.ts'],
    format: 'esm',
    outfile: 'dist/index.js',
  });

  const ctxMatchers = await esbuild.context({
    ...baseConfig,
    entryPoints: ['src/matchers.ts'],
    format: 'esm',
    outfile: 'dist/matchers.js',
  });

  await ctxMain.watch();
  await ctxMatchers.watch();
  console.log('Watching for changes...');
} else {
  await build();
}
