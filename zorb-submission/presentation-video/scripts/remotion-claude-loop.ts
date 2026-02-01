#!/usr/bin/env bun
/**
 * Remotion + Claude Fast Iteration Loop
 *
 * Renders key frames from a Remotion composition for Claude to review.
 * Optimized for multimodal feedback - renders PNGs, not full videos.
 *
 * Usage:
 *   bun scripts/remotion-claude-loop.ts <composition> [--frames=0,30,60] [--scale=0.5]
 *
 * Then in Claude Code:
 *   "Review the frames in preview/ and suggest improvements"
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const PREVIEW_DIR = "preview";

interface Options {
  composition: string;
  frames: number[];
  scale: number;
  outputDir: string;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const composition = args.find((a) => !a.startsWith("--")) || "Main";

  const framesArg = args.find((a) => a.startsWith("--frames="));
  const frames = framesArg
    ? framesArg.split("=")[1].split(",").map(Number)
    : [0, 30, 60, 90, 120]; // Default key frames

  const scaleArg = args.find((a) => a.startsWith("--scale="));
  const scale = scaleArg ? Number.parseFloat(scaleArg.split("=")[1]) : 0.5;

  const outputArg = args.find((a) => a.startsWith("--output="));
  const outputDir = outputArg ? outputArg.split("=")[1] : PREVIEW_DIR;

  return { composition, frames, scale, outputDir };
}

async function renderFrame(
  composition: string,
  frame: number,
  scale: number,
  outputPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      "npx",
      [
        "remotion",
        "still",
        composition,
        `--frame=${frame}`,
        `--scale=${scale}`,
        `--output=${outputPath}`,
        "--log=error",
      ],
      { stdio: "inherit" },
    );

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Frame ${frame} failed with code ${code}`));
      }
    });
  });
}

async function main() {
  const opts = parseArgs();

  console.log("🎬 Remotion Fast Iterator for Claude");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Composition: ${opts.composition}`);
  console.log(`Frames: ${opts.frames.join(", ")}`);
  console.log(`Scale: ${opts.scale}x`);
  console.log("");

  // Clean and create output directory
  if (existsSync(opts.outputDir)) {
    rmSync(opts.outputDir, { recursive: true });
  }
  mkdirSync(opts.outputDir, { recursive: true });

  // Render all frames in parallel
  console.log("Rendering frames in parallel...\n");

  const renderPromises = opts.frames.map(async (frame) => {
    const outputPath = join(
      opts.outputDir,
      `frame-${String(frame).padStart(4, "0")}.png`,
    );
    console.log(`  → Frame ${frame}...`);
    await renderFrame(opts.composition, frame, opts.scale, outputPath);
    console.log(`  ✓ Frame ${frame} done`);
    return outputPath;
  });

  try {
    const _outputs = await Promise.all(renderPromises);

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Preview frames ready!\n");

    // List generated files
    const files = readdirSync(opts.outputDir).filter((f) => f.endsWith(".png"));
    for (const file of files) {
      console.log(`  📸 ${opts.outputDir}/${file}`);
    }

    console.log("\n💡 Next: Ask Claude to review these frames:");
    console.log(
      `   "Read the PNG files in ${opts.outputDir}/ and suggest improvements"\n`,
    );
  } catch (err) {
    console.error("❌ Rendering failed:", err);
    process.exit(1);
  }
}

void main();
