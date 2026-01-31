import {
  ShadowWireClient,
  TokenUtils,
  verifyRangeProof,
  initWASM,
  type TokenSymbol,
} from "@radr/shadowwire";
import type {
  PrivateTransferProvider,
  ZKVerifier,
  ShieldResult,
  TransferResult,
  UnshieldResult,
} from "../interfaces.js";
import { validateProofFormat } from "../proof-utils.js";

export interface ShadowWireBackendConfig {
  /** Wallet address for deposit/withdraw/transfer */
  wallet: string;
  /** Optional API key (ShadowWire API is open; key for custom endpoints) */
  apiKey?: string;
  /** Optional custom API base URL */
  apiBaseUrl?: string;
}

/**
 * ShadowWire backend (Radr Labs) implementing PrivateTransferProvider.
 * Uses @radr/shadowwire SDK (see https://github.com/Radrdotfun/ShadowWire).
 * - shieldAmount: deposit() → returns unsigned tx (base64); caller must sign and send.
 * - createPrivateTransfer: transfer() with type 'internal' (amount in lamports, converted to human for SDK).
 * - unshieldAmount: withdraw().
 * ZKVerifier.verifyProof: when publicInputs[0] is commitment (hex), uses Bulletproofs verifyRangeProof; else format-only stub.
 * Note: @radr/shadowwire uses network 'mainnet-beta'; when Radr supports devnet, apiBaseUrl can be set.
 */
export class ShadowWireBackend implements PrivateTransferProvider, ZKVerifier {
  private client: ShadowWireClient;
  private wallet: string;

  constructor(config: ShadowWireBackendConfig) {
    this.wallet = config.wallet;
    this.client = new ShadowWireClient({
      apiKey: config.apiKey,
      apiBaseUrl: config.apiBaseUrl,
      network: "mainnet-beta",
      debug: false,
    });
  }

  private assertToken(token: string): asserts token is TokenSymbol {
    if (!TokenUtils.isValidToken(token)) {
      throw new Error(
        `Unsupported token "${token}". ShadowWire supports: ${TokenUtils.getAllTokens().join(", ")}`
      );
    }
  }

  async shieldAmount(amount: number, token: string): Promise<ShieldResult> {
    this.assertToken(token);
    const res = await this.client.deposit({
      wallet: this.wallet,
      amount,
    });
    return {
      success: res.success,
      unsignedTransaction: res.unsigned_tx_base64,
      commitment: res.user_balance_pda,
    };
  }

  async createPrivateTransfer(recipient: string, amount: number): Promise<TransferResult> {
    this.assertToken("SOL"); // default; could accept token param - our interface only has recipient, amount
    const amountHuman = TokenUtils.fromSmallestUnit(amount, "SOL");
    const res = await this.client.transfer({
      sender: this.wallet,
      recipient,
      amount: amountHuman,
      token: "SOL",
      type: "internal",
    });
    return {
      success: res.success,
      signature: res.tx_signature,
    };
  }

  async unshieldAmount(amount: number, token: string): Promise<UnshieldResult> {
    this.assertToken(token);
    const res = await this.client.withdraw({
      wallet: this.wallet,
      amount,
    });
    return {
      success: res.success,
      signature: res.tx_signature,
      txId: res.tx_signature,
    };
  }

  async verifyProof(proof: string | Buffer, publicInputs: string[]): Promise<boolean> {
    if (publicInputs.length >= 1) {
      const proofStr = typeof proof === "string" ? proof : Buffer.from(proof).toString("hex");
      const commitmentStr = publicInputs[0];
      await initWASM();
      return verifyRangeProof(proofStr, commitmentStr);
    }
    return validateProofFormat(proof, publicInputs);
  }
}
