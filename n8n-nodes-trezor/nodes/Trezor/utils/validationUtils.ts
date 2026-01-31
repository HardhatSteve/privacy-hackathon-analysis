/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateDerivationPath(path: string): ValidationResult {
  const pattern = /^m(\/\d+'?)+$/;
  if (!pattern.test(path)) {
    return {
      valid: false,
      error: "Invalid derivation path format. Expected format: m/44'/0'/0'/0/0",
    };
  }
  return { valid: true };
}

export function validateHexString(hex: string): ValidationResult {
  const pattern = /^(0x)?[a-fA-F0-9]*$/;
  if (!pattern.test(hex)) {
    return {
      valid: false,
      error: 'Invalid hexadecimal string',
    };
  }
  return { valid: true };
}

export function validateAmount(amount: string | number, minAmount: number = 0): ValidationResult {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(value)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }
  if (value < minAmount) {
    return { valid: false, error: `Amount must be at least ${minAmount}` };
  }
  return { valid: true };
}

export function validateChainId(chainId: number): ValidationResult {
  if (!Number.isInteger(chainId) || chainId <= 0) {
    return { valid: false, error: 'Chain ID must be a positive integer' };
  }
  return { valid: true };
}

export function validateTransactionHash(hash: string): ValidationResult {
  const pattern = /^(0x)?[a-fA-F0-9]{64}$/;
  if (!pattern.test(hash)) {
    return { valid: false, error: 'Invalid transaction hash format' };
  }
  return { valid: true };
}

export function validatePublicKey(publicKey: string): ValidationResult {
  const pattern = /^(0x)?[a-fA-F0-9]{66,130}$/;
  if (!pattern.test(publicKey)) {
    return { valid: false, error: 'Invalid public key format' };
  }
  return { valid: true };
}

export function validateSignature(signature: string): ValidationResult {
  const pattern = /^(0x)?[a-fA-F0-9]{128,144}$/;
  if (!pattern.test(signature)) {
    return { valid: false, error: 'Invalid signature format' };
  }
  return { valid: true };
}

export function validatePin(pin: string, maxLength: number = 50): ValidationResult {
  if (pin.length === 0) {
    return { valid: false, error: 'PIN cannot be empty' };
  }
  if (pin.length > maxLength) {
    return { valid: false, error: `PIN cannot exceed ${maxLength} characters` };
  }
  if (!/^\d+$/.test(pin)) {
    return { valid: false, error: 'PIN must contain only digits' };
  }
  return { valid: true };
}

export function validateLabel(label: string, maxLength: number = 16): ValidationResult {
  if (label.length > maxLength) {
    return { valid: false, error: `Label cannot exceed ${maxLength} characters` };
  }
  return { valid: true };
}

export function validateMnemonic(mnemonic: string): ValidationResult {
  const words = mnemonic.trim().split(/\s+/);
  const validLengths = [12, 18, 24];
  if (!validLengths.includes(words.length)) {
    return {
      valid: false,
      error: 'Mnemonic must be 12, 18, or 24 words',
    };
  }
  return { valid: true };
}

export function validateEmail(email: string): ValidationResult {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!pattern.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true };
}

export function validateUrl(url: string): ValidationResult {
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}
