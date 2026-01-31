import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { Config } from "@privacy-devkit/sdk";

const CONFIG_DIR = ".privacy";
const CONFIG_FILE = "config.json";

function configPath(dir: string): string {
  return join(dir, CONFIG_DIR, CONFIG_FILE);
}

/**
 * Resolve config directory (cwd first, then home).
 */
export function resolveConfigDir(): string | null {
  const cwd = process.cwd();
  const home = homedir();
  if (existsSync(configPath(cwd))) return join(cwd, CONFIG_DIR);
  if (home && existsSync(configPath(home))) return join(home, CONFIG_DIR);
  return null;
}

/**
 * Load config from .privacy/config.json (cwd then home).
 */
export function loadConfig(): Config | null {
  const dir = resolveConfigDir();
  if (!dir) return null;
  const path = join(dir, CONFIG_FILE);
  try {
    const raw = readFileSync(path, "utf-8");
    const data = JSON.parse(raw) as {
      rpcUrl?: string;
      network?: string;
      shadowwireApiKey?: string;
      shadowwireWallet?: string;
    };
    return {
      rpcUrl: data.rpcUrl ?? "https://api.devnet.solana.com",
      network: "devnet",
      ...(data.shadowwireApiKey ? { shadowwireApiKey: data.shadowwireApiKey } : {}),
      ...(data.shadowwireWallet ? { shadowwireWallet: data.shadowwireWallet } : {}),
    };
  } catch {
    return null;
  }
}

/**
 * Write config to .privacy/config.json in the given directory.
 */
export function writeConfig(
  dir: string,
  config: {
    rpcUrl: string;
    network: string;
    shadowwireApiKey?: string;
    shadowwireWallet?: string;
  }
): void {
  const fullDir = join(dir, CONFIG_DIR);
  mkdirSync(fullDir, { recursive: true });
  const path = join(fullDir, CONFIG_FILE);
  writeFileSync(path, JSON.stringify(config, null, 2), "utf-8");
}

export { CONFIG_DIR, CONFIG_FILE };
