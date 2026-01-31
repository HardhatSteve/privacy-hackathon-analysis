import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./chatConstants";

/**
 * Orders two public keys lexicographically
 * @returns Tuple with keys in canonical order
 */
export const orderParticipants = (
  a: PublicKey,
  b: PublicKey
): [PublicKey, PublicKey] => {
  return Buffer.compare(a.toBuffer(), b.toBuffer()) <= 0 ? [a, b] : [b, a];
};

/**
 * Derives the PDA for a chat account between two participants
 */
export const getChatPda = (a: PublicKey, b: PublicKey) => {
  const seed = Buffer.from("chat");
  const [first, second] = orderParticipants(a, b);
  return PublicKey.findProgramAddressSync(
    [seed, first.toBuffer(), second.toBuffer()],
    PROGRAM_ID
  );
};
