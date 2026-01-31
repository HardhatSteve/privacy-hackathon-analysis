import type {
  PrivateTransferProvider,
  ZKVerifier,
  ShieldResult,
  TransferResult,
  UnshieldResult,
} from "../interfaces.js";
import { validateProofFormat } from "../proof-utils.js";

/**
 * Mock backend implementing PrivateTransferProvider and ZKVerifier.
 * Logs what would happen and returns fake success/signatures.
 */
export class MockBackend implements PrivateTransferProvider, ZKVerifier {
  async shieldAmount(amount: number, token: string): Promise<ShieldResult> {
    console.log(`[MockBackend] Would shield amount=${amount} token=${token}`);
    return {
      success: true,
      txId: "mock-tx-shield-" + Date.now(),
      commitment: "mock-commitment-" + Math.random().toString(36).slice(2),
    };
  }

  async createPrivateTransfer(recipient: string, amount: number): Promise<TransferResult> {
    console.log(`[MockBackend] Would create private transfer to=${recipient} amount=${amount}`);
    return {
      success: true,
      signature: "mock-sig-" + Date.now(),
      slot: 0,
    };
  }

  async unshieldAmount(amount: number, token: string): Promise<UnshieldResult> {
    console.log(`[MockBackend] Would unshield amount=${amount} token=${token}`);
    return {
      success: true,
      txId: "mock-tx-unshield-" + Date.now(),
      signature: "mock-unshield-sig",
    };
  }

  async verifyProof(proof: string | Buffer, publicInputs: string[]): Promise<boolean> {
    const valid = validateProofFormat(proof, publicInputs);
    console.log(
      `[MockBackend] Verify proof format: ${valid ? "valid" : "invalid"} (proof length=${typeof proof === "string" ? proof.length : proof.length}, publicInputs=${publicInputs.length})`
    );
    return valid;
  }
}
