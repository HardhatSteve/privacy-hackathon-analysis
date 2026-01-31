import { getDefaultClient } from "./client.js";
import type { ShieldResult, TransferResult, UnshieldResult } from "./interfaces.js";

export type { ShieldResult, TransferResult, UnshieldResult } from "./interfaces.js";

/**
 * Shield an amount of a token into a private pool (uses client backend).
 */
export async function shieldAmount(amount: number, token: string): Promise<ShieldResult> {
  return getDefaultClient().backend.shieldAmount(amount, token);
}

/**
 * Create a private transfer to a recipient (uses client backend).
 */
export async function createPrivateTransfer(
  recipient: string,
  amount: number
): Promise<TransferResult> {
  return getDefaultClient().backend.createPrivateTransfer(recipient, amount);
}

/**
 * Unshield an amount of a token from a private pool (uses client backend).
 */
export async function unshieldAmount(amount: number, token: string): Promise<UnshieldResult> {
  return getDefaultClient().backend.unshieldAmount(amount, token);
}
