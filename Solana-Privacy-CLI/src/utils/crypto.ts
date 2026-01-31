import { ethers } from "ethers";
import { mulPointEscalar, Base8 } from "@zk-kit/baby-jubjub";

export interface ViewingKey {
  publicKey: string;
  privateKey: string;
}

/**
 * Generates a secure viewing key for privacy
 * @returns Promise<ViewingKey> The generated viewing key
 */
export async function generateViewingKey(): Promise<ViewingKey> {
  // Generate a random private key
  const privateKey = ethers.randomBytes(32);
  const privateKeyBigInt = BigInt(ethers.hexlify(privateKey));

  // Convert to BabyJubJub format using scalar multiplication
  const publicKey = mulPointEscalar(Base8, privateKeyBigInt);

  // Convert bigint coordinates to hex strings
  const xHex = "0x" + publicKey[0].toString(16);
  const yHex = "0x" + publicKey[1].toString(16);

  return {
    publicKey: xHex + yHex.slice(2),
    privateKey: ethers.hexlify(privateKey),
  };
}

/**
 * Encrypts a value using a viewing key
 * @param value The value to encrypt
 * @param viewingKey The viewing key to use
 * @returns Promise<string> The encrypted value
 */
export async function encryptValue(
  value: string,
  viewingKey: string,
): Promise<string> {
  const key = ethers.keccak256(viewingKey);
  const encrypted = ethers.keccak256(ethers.concat([key, value]));
  return encrypted;
}

/**
 * Decrypts a value using a viewing key
 * @param encryptedValue The encrypted value
 * @param viewingKey The viewing key to use
 * @returns Promise<string> The decrypted value
 */
export async function decryptValue(
  encryptedValue: string,
  viewingKey: string,
): Promise<string> {
  const key = ethers.keccak256(viewingKey);
  const decrypted = ethers.keccak256(ethers.concat([key, encryptedValue]));
  return decrypted;
}

export function encryptMessage(message: string, publicKey: string): string {
  // TODO: Implement message encryption using the public key
  return message;
}

export function decryptMessage(encryptedMessage: string, privateKey: string): string {
  // TODO: Implement message decryption using the private key
  return encryptedMessage;
}
