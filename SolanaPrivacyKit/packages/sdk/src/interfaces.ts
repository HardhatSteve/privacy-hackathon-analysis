/**
 * Result types for privacy operations
 */
export interface ShieldResult {
  success: boolean;
  txId?: string;
  commitment?: string;
  /** Base64-encoded unsigned transaction (e.g. ShadowWire deposit); caller must sign and send */
  unsignedTransaction?: string;
}

export interface TransferResult {
  success: boolean;
  signature?: string;
  slot?: number;
}

export interface UnshieldResult {
  success: boolean;
  txId?: string;
  signature?: string;
}

/**
 * Provider for private transfers (shield, transfer, unshield)
 */
export interface PrivateTransferProvider {
  shieldAmount(amount: number, token: string): Promise<ShieldResult>;
  createPrivateTransfer(recipient: string, amount: number): Promise<TransferResult>;
  unshieldAmount(amount: number, token: string): Promise<UnshieldResult>;
}

/**
 * ZK proof verifier
 */
export interface ZKVerifier {
  verifyProof(proof: string | Buffer, publicInputs: string[]): Promise<boolean>;
}

/**
 * Backend identifier (only 'mock' implemented for now)
 */
export type PrivacyBackend = "shadowwire" | "arcium" | "mock";
