// Polyfills required by Solana/web3 + wallet adapter stack in production builds.
// IMPORTANT: This module must be imported BEFORE any Solana-related imports.

import { Buffer } from "buffer";
import process from "process";

const g = globalThis as any;

// Only assign if missing to avoid clobbering environments that already provide them.
if (!g.Buffer) g.Buffer = Buffer;
if (!g.process) g.process = process;
if (!g.global) g.global = g;
