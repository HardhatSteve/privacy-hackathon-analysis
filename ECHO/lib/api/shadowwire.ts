/**
 * Radr Labs ShadowWire Client
 * Private transfers with zero-knowledge proofs
 */

import { ShadowWireClient } from "@radr/shadowwire";

const shadowwire = new ShadowWireClient({ debug: true });

// Valid token types for ShadowWire
export type ShadowWireToken = "USDC" | "SOL" | "RADR" | "ORE" | "BONK" | "JIM" | "GODL" | "HUSTLE" | "ZEC" | "CRT" | "BLACKCOIN" | "GIL" | "ANON" | "WLFI" | "USD1" | "AOL" | "IQLABS";

export interface ShadowWireBalance {
  available: number;
  poolAddress: string;
}

/**
 * Check ShadowWire balance
 */
export async function getShadowWireBalance(
  address: string,
  token: ShadowWireToken = "SOL"
): Promise<ShadowWireBalance> {
  try {
    const balance = await shadowwire.getBalance(address, token);
    return {
      available: balance.available || 0,
      poolAddress: balance.pool_address || "",
    };
  } catch (error) {
    console.error("ShadowWire balance error:", error);
    return { available: 0, poolAddress: "" };
  }
}

/**
 * Make a private transfer
 */
export async function makePrivateTransfer(params: {
  sender: string;
  recipient: string;
  amount: number;
  token: ShadowWireToken;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
}): Promise<{
  success: boolean;
  signature?: string;
  error?: string;
}> {
  try {
    const result = await shadowwire.transfer({
      sender: params.sender,
      recipient: params.recipient,
      amount: params.amount,
      token: params.token,
      type: "internal", // Private transfer
      wallet: { signMessage: params.signMessage },
    });

    return {
      success: true,
      signature: result.tx_signature,
    };
  } catch (error: any) {
    console.error("ShadowWire transfer error:", error);
    return {
      success: false,
      error: error.message || "Transfer failed",
    };
  }
}

/**
 * Simulate a private transfer (check if possible)
 */
export async function simulatePrivateTransfer(params: {
  sender: string;
  recipient: string;
  amount: number;
  token: ShadowWireToken;
}): Promise<{
  possible: boolean;
  reason?: string;
  estimatedFee: number;
}> {
  try {
    // Check sender balance
    const balance = await getShadowWireBalance(params.sender, params.token);
    const amountInLamports =
      params.token === "SOL" ? params.amount * 1e9 : params.amount;
    const fee = amountInLamports * 0.01; // 1% relayer fee

    if (balance.available < amountInLamports + fee) {
      return {
        possible: false,
        reason: "Insufficient ShadowWire balance",
        estimatedFee: fee,
      };
    }

    return {
      possible: true,
      estimatedFee: fee,
    };
  } catch (error) {
    console.error("ShadowWire simulation error:", error);
    return {
      possible: false,
      reason: "Simulation failed",
      estimatedFee: 0,
    };
  }
}

/**
 * Check if an address is a ShadowWire user
 */
export async function isShadowWireUser(address: string): Promise<boolean> {
  try {
    const balance = await getShadowWireBalance(address);
    return balance.poolAddress !== "";
  } catch {
    return false;
  }
}
