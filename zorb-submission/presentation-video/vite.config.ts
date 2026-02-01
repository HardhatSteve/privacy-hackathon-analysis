import {defineConfig} from 'vite';
import motionCanvasPlugin from '@motion-canvas/vite-plugin';
import ffmpegExporter from '@motion-canvas/ffmpeg';

// Handle both ESM default and CJS exports
const motionCanvas = (motionCanvasPlugin as any).default || motionCanvasPlugin;
const ffmpeg = (ffmpegExporter as any).default || ffmpegExporter;

export default defineConfig({
  plugins: [
    motionCanvas({
      project: './src/project.ts',
      output: './output/animations',
      export: {
        exporter: ffmpeg({
          fastStart: true,
        }),
      },
    }),
  ],
});
