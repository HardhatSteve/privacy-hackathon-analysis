import type { PublicKey } from "@solana/web3.js";
import type { BN } from "@coral-xyz/anchor";

/**
 * Represents a single message in a chat conversation.
 * Messages are end-to-end encrypted and stored on-chain.
 */
export interface Message {
  /** The sender's Solana public key */
  sender: PublicKey;
  /** Decrypted message content */
  text: string;
  /** Unix timestamp of when the message was sent */
  timestamp: BN;
}

/**
 * Represents a chat conversation between two participants.
 * Chats are identified by the deterministic PDA derived from both participants.
 */
export interface Chat {
  /** The other participant's wallet address (base58 encoded) */
  receiver: string;
  /** Array of messages in this conversation */
  messages: Message[];
  /** True if the current user's pubkey is lexicographically first */
  isSentByMe: boolean;
}

/**
 * Raw on-chain message structure before decryption.
 * Used when fetching directly from the program account.
 */
export interface RawOnChainMessage {
  sender: PublicKey;
  encryptedPayload: Uint8Array | number[];
  payloadLen: number | BN;
  timestamp: BN;
}
