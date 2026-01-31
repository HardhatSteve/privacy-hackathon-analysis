import { PublicKey } from "@solana/web3.js";
import idl from "../solana_program.json";

// Always derive the program id from the IDL to avoid mismatches after redeploys
export const PROGRAM_ID = new PublicKey(idl.address);
export const MAX_MESSAGE_LENGTH = 280;
export const MAX_MESSAGES_PER_CHAT = 10;
export const MIN_ENCRYPTED_LENGTH = 12 + 16; // Nonce (12) + Poly1305 tag (16)
