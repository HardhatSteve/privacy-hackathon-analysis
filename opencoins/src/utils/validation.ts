import { ethers } from "ethers";
import { PublicKey } from "@solana/web3.js";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Validates an Ethereum address
 */
export function validateEvmAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Validates a Solana address
 */
export function validateSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates token name
 */
export function validateTokenName(name: string): void {
  if (!name || name.trim().length === 0) {
    throw new ValidationError("Token name cannot be empty");
  }
  if (name.length > 100) {
    throw new ValidationError("Token name must be 100 characters or less");
  }
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
    throw new ValidationError("Token name contains invalid characters");
  }
}

/**
 * Validates token symbol
 */
export function validateTokenSymbol(symbol: string): void {
  if (!symbol || symbol.trim().length === 0) {
    throw new ValidationError("Token symbol cannot be empty");
  }
  if (symbol.length > 20) {
    throw new ValidationError("Token symbol must be 20 characters or less");
  }
  if (!/^[A-Z0-9]+$/.test(symbol)) {
    throw new ValidationError(
      "Token symbol must be uppercase alphanumeric characters only",
    );
  }
}

/**
 * Validates token decimals
 */
export function validateDecimals(
  decimals: number,
  chain: "evm" | "solana",
): void {
  if (!Number.isInteger(decimals)) {
    throw new ValidationError("Decimals must be an integer");
  }
  if (chain === "evm") {
    if (decimals < 0 || decimals > 18) {
      throw new ValidationError("EVM token decimals must be between 0 and 18");
    }
  } else {
    if (decimals < 0 || decimals > 9) {
      throw new ValidationError(
        "Solana token decimals must be between 0 and 9",
      );
    }
  }
}

/**
 * Validates and parses total supply
 */
export function validateAndParseSupply(
  supply: string,
  decimals: number,
): bigint {
  try {
    // Remove any commas or spaces
    const cleanSupply = supply.replace(/[,\s]/g, "");

    // Check if it's a valid number
    if (!/^\d+(\.\d+)?$/.test(cleanSupply)) {
      throw new ValidationError("Invalid supply format");
    }

    // Parse to number and convert to smallest unit
    const supplyNumber = parseFloat(cleanSupply);
    if (supplyNumber <= 0) {
      throw new ValidationError("Supply must be greater than 0");
    }

    // Check for reasonable limits (1 trillion tokens max)
    if (supplyNumber > 1_000_000_000_000) {
      throw new ValidationError("Supply exceeds maximum limit of 1 trillion");
    }

    // Convert to bigint with decimals
    const multiplier = BigInt(10 ** decimals);
    const wholePart = BigInt(Math.floor(supplyNumber));
    const decimalPart = supplyNumber - Math.floor(supplyNumber);
    const decimalPartBigInt = BigInt(
      Math.floor(decimalPart * Number(multiplier)),
    );

    return wholePart * multiplier + decimalPartBigInt;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(
      "Failed to parse supply: " + (error as Error).message,
    );
  }
}

/**
 * Validates private key format (EVM)
 */
export function validateEvmPrivateKey(privateKey: string): void {
  // Check if it's a valid hex string with or without 0x prefix
  const cleanKey = privateKey.startsWith("0x")
    ? privateKey.slice(2)
    : privateKey;

  if (cleanKey.length !== 64) {
    throw new ValidationError("Invalid private key length");
  }

  if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
    throw new ValidationError("Private key must be a valid hex string");
  }
}

/**
 * Sanitizes user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>'"]/g, "");
}

/**
 * Validates network name
 */
export function validateNetwork(
  network: string,
  validNetworks: string[],
): void {
  if (!validNetworks.includes(network.toLowerCase())) {
    throw new ValidationError(
      `Invalid network. Supported networks: ${validNetworks.join(", ")}`,
    );
  }
}
