/**
 * Request Validation Middleware
 * 
 * Provides validation for API request fields including required fields,
 * types, formats, and business rules.
 * 
 * Requirements: 37.1, 37.2
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './error-handler.middleware';

/**
 * Validation result
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate required fields are present
 * 
 * Requirements: 37.1
 */
export function validateRequiredFields(
  data: any,
  requiredFields: string[]
): ValidationResult {
  const errors: string[] = [];
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate asset pair format (TOKEN1/TOKEN2)
 * 
 * Requirements: 37.2
 */
export function validateAssetPair(assetPair: string): ValidationResult {
  const errors: string[] = [];
  
  if (typeof assetPair !== 'string') {
    errors.push('Asset pair must be a string');
    return { isValid: false, errors };
  }
  
  const parts = assetPair.split('/');
  if (parts.length !== 2) {
    errors.push('Asset pair must be in format TOKEN1/TOKEN2');
  } else {
    const [token1, token2] = parts;
    if (!token1 || !token2) {
      errors.push('Asset pair tokens cannot be empty');
    }
    if (token1.length < 2 || token2.length < 2) {
      errors.push('Asset pair tokens must be at least 2 characters');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Solana address format
 * 
 * Requirements: 37.2
 */
export function validateSolanaAddress(address: string): ValidationResult {
  const errors: string[] = [];
  
  if (typeof address !== 'string') {
    errors.push('Solana address must be a string');
    return { isValid: false, errors };
  }
  
  // Solana addresses are base58 encoded, typically 32-44 characters
  if (address.length < 32 || address.length > 44) {
    errors.push('Invalid Solana address length');
  }
  
  // Check for valid base58 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  if (!base58Regex.test(address)) {
    errors.push('Solana address contains invalid characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Ethereum address format
 * 
 * Requirements: 37.2
 */
export function validateEthereumAddress(address: string): ValidationResult {
  const errors: string[] = [];
  
  if (typeof address !== 'string') {
    errors.push('Ethereum address must be a string');
    return { isValid: false, errors };
  }
  
  // Ethereum addresses are 0x followed by 40 hex characters
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!ethAddressRegex.test(address)) {
    errors.push('Invalid Ethereum address format');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate amount (positive number, minimum 0.0003)
 * 
 * Requirements: 37.2
 */
export function validateAmount(amount: any, minAmount: number = 0.0003): ValidationResult {
  const errors: string[] = [];
  
  if (typeof amount !== 'number') {
    errors.push('Amount must be a number');
    return { isValid: false, errors };
  }
  
  if (isNaN(amount) || !isFinite(amount)) {
    errors.push('Amount must be a valid number');
  }
  
  if (amount <= 0) {
    errors.push('Amount must be positive');
  }
  
  if (amount < minAmount) {
    errors.push(`Amount must be at least ${minAmount}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate timestamp (must be in the future for expiration)
 * 
 * Requirements: 37.2
 */
export function validateFutureTimestamp(timestamp: any, fieldName: string = 'timestamp'): ValidationResult {
  const errors: string[] = [];
  
  if (typeof timestamp !== 'number') {
    errors.push(`${fieldName} must be a number (Unix timestamp in milliseconds)`);
    return { isValid: false, errors };
  }
  
  if (isNaN(timestamp) || !isFinite(timestamp)) {
    errors.push(`${fieldName} must be a valid number`);
    return { isValid: false, errors };
  }
  
  const now = Date.now();
  if (timestamp <= now) {
    errors.push(`${fieldName} must be in the future`);
  }
  
  // Reasonable upper bound (10 years from now)
  const maxFuture = now + (10 * 365 * 24 * 60 * 60 * 1000);
  if (timestamp > maxFuture) {
    errors.push(`${fieldName} is too far in the future (max 10 years)`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate direction (buy/sell)
 * 
 * Requirements: 37.2
 */
export function validateDirection(direction: any): ValidationResult {
  const errors: string[] = [];
  
  if (typeof direction !== 'string') {
    errors.push('Direction must be a string');
    return { isValid: false, errors };
  }
  
  const validDirections = ['buy', 'sell'];
  if (!validDirections.includes(direction.toLowerCase())) {
    errors.push('Direction must be either "buy" or "sell"');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate WOTS+ signature format
 * 
 * Requirements: 37.2
 */
export function validateSignature(signature: any): ValidationResult {
  const errors: string[] = [];
  
  if (typeof signature !== 'string') {
    errors.push('Signature must be a string');
    return { isValid: false, errors };
  }
  
  // WOTS+ signatures are hex encoded, typically very long (2208 bytes = 4416 hex chars)
  if (signature.length < 100) {
    errors.push('Signature is too short');
  }
  
  // Check for valid hex characters
  const hexRegex = /^[a-fA-F0-9]+$/;
  if (!hexRegex.test(signature)) {
    errors.push('Signature must be hex encoded');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate public key format
 * 
 * Requirements: 37.2
 */
export function validatePublicKey(publicKey: any): ValidationResult {
  const errors: string[] = [];
  
  if (typeof publicKey !== 'string') {
    errors.push('Public key must be a string');
    return { isValid: false, errors };
  }
  
  // WOTS+ public keys are hex encoded, typically 2208 bytes = 4416 hex chars
  if (publicKey.length < 100) {
    errors.push('Public key is too short');
  }
  
  // Check for valid hex characters
  const hexRegex = /^[a-fA-F0-9]+$/;
  if (!hexRegex.test(publicKey)) {
    errors.push('Public key must be hex encoded');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate chain ID
 * 
 * Requirements: 37.2
 */
export function validateChainId(chainId: any): ValidationResult {
  const errors: string[] = [];
  
  if (typeof chainId !== 'number') {
    errors.push('Chain ID must be a number');
    return { isValid: false, errors };
  }
  
  // Valid chain IDs for our system
  const validChainIds = [
    900, // Solana Devnet (custom ID)
    11155111, // Sepolia Testnet
  ];
  
  if (!validChainIds.includes(chainId)) {
    errors.push(`Chain ID must be one of: ${validChainIds.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Middleware factory for validating quote request creation
 * 
 * Requirements: 37.1, 37.2
 */
export function validateQuoteRequestCreation(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const { assetPair, direction, amount, timeout, signature, publicKey, chainId } = req.body;
  
  const allErrors: string[] = [];
  
  // Check required fields
  const requiredResult = validateRequiredFields(req.body, [
    'assetPair',
    'direction',
    'amount',
    'timeout',
    'signature',
    'publicKey',
    'chainId',
  ]);
  if (!requiredResult.isValid) {
    allErrors.push(...requiredResult.errors);
  }
  
  // Validate each field
  if (assetPair !== undefined) {
    const assetPairResult = validateAssetPair(assetPair);
    if (!assetPairResult.isValid) {
      allErrors.push(...assetPairResult.errors);
    }
  }
  
  if (direction !== undefined) {
    const directionResult = validateDirection(direction);
    if (!directionResult.isValid) {
      allErrors.push(...directionResult.errors);
    }
  }
  
  if (amount !== undefined) {
    const amountResult = validateAmount(amount);
    if (!amountResult.isValid) {
      allErrors.push(...amountResult.errors);
    }
  }
  
  if (timeout !== undefined) {
    const timeoutResult = validateFutureTimestamp(timeout, 'timeout');
    if (!timeoutResult.isValid) {
      allErrors.push(...timeoutResult.errors);
    }
  }
  
  if (signature !== undefined) {
    const signatureResult = validateSignature(signature);
    if (!signatureResult.isValid) {
      allErrors.push(...signatureResult.errors);
    }
  }
  
  if (publicKey !== undefined) {
    const publicKeyResult = validatePublicKey(publicKey);
    if (!publicKeyResult.isValid) {
      allErrors.push(...publicKeyResult.errors);
    }
  }
  
  if (chainId !== undefined) {
    const chainIdResult = validateChainId(chainId);
    if (!chainIdResult.isValid) {
      allErrors.push(...chainIdResult.errors);
    }
  }
  
  // If there are errors, throw ValidationError
  if (allErrors.length > 0) {
    throw new ValidationError('Quote request validation failed', {
      fields: allErrors,
    });
  }
  
  next();
}

/**
 * Middleware factory for validating quote submission
 * 
 * Requirements: 37.1, 37.2
 */
export function validateQuoteSubmission(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const { price, expirationTime, signature, publicKey } = req.body;
  
  const allErrors: string[] = [];
  
  // Check required fields
  const requiredResult = validateRequiredFields(req.body, [
    'quoteRequestId',
    'price',
    'expirationTime',
    'signature',
    'publicKey',
  ]);
  if (!requiredResult.isValid) {
    allErrors.push(...requiredResult.errors);
  }
  
  // Validate price
  if (price !== undefined) {
    const priceResult = validateAmount(price, 0.0001);
    if (!priceResult.isValid) {
      allErrors.push(...priceResult.errors);
    }
  }
  
  // Validate expiration time
  if (expirationTime !== undefined) {
    const expirationResult = validateFutureTimestamp(expirationTime, 'expirationTime');
    if (!expirationResult.isValid) {
      allErrors.push(...expirationResult.errors);
    }
  }
  
  // Validate signature
  if (signature !== undefined) {
    const signatureResult = validateSignature(signature);
    if (!signatureResult.isValid) {
      allErrors.push(...signatureResult.errors);
    }
  }
  
  // Validate public key
  if (publicKey !== undefined) {
    const publicKeyResult = validatePublicKey(publicKey);
    if (!publicKeyResult.isValid) {
      allErrors.push(...publicKeyResult.errors);
    }
  }
  
  // If there are errors, throw ValidationError
  if (allErrors.length > 0) {
    throw new ValidationError('Quote submission validation failed', {
      fields: allErrors,
    });
  }
  
  next();
}

/**
 * Middleware factory for validating quote acceptance
 * 
 * Requirements: 37.1, 37.2
 */
export function validateQuoteAcceptance(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const { signature, publicKey, commitment } = req.body;
  
  const allErrors: string[] = [];
  
  // Check required fields
  const requiredResult = validateRequiredFields(req.body, [
    'signature',
    'publicKey',
    'commitment',
  ]);
  if (!requiredResult.isValid) {
    allErrors.push(...requiredResult.errors);
  }
  
  // Validate signature
  if (signature !== undefined) {
    const signatureResult = validateSignature(signature);
    if (!signatureResult.isValid) {
      allErrors.push(...signatureResult.errors);
    }
  }
  
  // Validate public key
  if (publicKey !== undefined) {
    const publicKeyResult = validatePublicKey(publicKey);
    if (!publicKeyResult.isValid) {
      allErrors.push(...publicKeyResult.errors);
    }
  }
  
  // Validate commitment (hex string)
  if (commitment !== undefined) {
    if (typeof commitment !== 'string') {
      allErrors.push('Commitment must be a string');
    } else {
      const hexRegex = /^[a-fA-F0-9]+$/;
      if (!hexRegex.test(commitment)) {
        allErrors.push('Commitment must be hex encoded');
      }
    }
  }
  
  // If there are errors, throw ValidationError
  if (allErrors.length > 0) {
    throw new ValidationError('Quote acceptance validation failed', {
      fields: allErrors,
    });
  }
  
  next();
}

/**
 * Middleware factory for validating message sending
 * 
 * Requirements: 37.1, 37.2
 */
export function validateMessageSending(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const { encryptedContent, signature, publicKey } = req.body;
  
  const allErrors: string[] = [];
  
  // Check required fields
  const requiredResult = validateRequiredFields(req.body, [
    'quoteRequestId',
    'recipientStealthAddress',
    'encryptedContent',
    'signature',
    'publicKey',
  ]);
  if (!requiredResult.isValid) {
    allErrors.push(...requiredResult.errors);
  }
  
  // Validate encrypted content
  if (encryptedContent !== undefined) {
    if (typeof encryptedContent !== 'string') {
      allErrors.push('Encrypted content must be a string');
    } else if (encryptedContent.length === 0) {
      allErrors.push('Encrypted content cannot be empty');
    }
  }
  
  // Validate signature
  if (signature !== undefined) {
    const signatureResult = validateSignature(signature);
    if (!signatureResult.isValid) {
      allErrors.push(...signatureResult.errors);
    }
  }
  
  // Validate public key
  if (publicKey !== undefined) {
    const publicKeyResult = validatePublicKey(publicKey);
    if (!publicKeyResult.isValid) {
      allErrors.push(...publicKeyResult.errors);
    }
  }
  
  // If there are errors, throw ValidationError
  if (allErrors.length > 0) {
    throw new ValidationError('Message sending validation failed', {
      fields: allErrors,
    });
  }
  
  next();
}

/**
 * Middleware factory for validating whitelist operations
 * 
 * Requirements: 37.1, 37.2
 */
export function validateWhitelistOperation(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const { address, signature, publicKey } = req.body;
  
  const allErrors: string[] = [];
  
  // Check required fields
  const requiredResult = validateRequiredFields(req.body, [
    'address',
    'signature',
    'publicKey',
  ]);
  if (!requiredResult.isValid) {
    allErrors.push(...requiredResult.errors);
  }
  
  // Validate address (can be Solana or Ethereum)
  if (address !== undefined) {
    const solanaResult = validateSolanaAddress(address);
    const ethResult = validateEthereumAddress(address);
    
    if (!solanaResult.isValid && !ethResult.isValid) {
      allErrors.push('Address must be a valid Solana or Ethereum address');
    }
  }
  
  // Validate signature
  if (signature !== undefined) {
    const signatureResult = validateSignature(signature);
    if (!signatureResult.isValid) {
      allErrors.push(...signatureResult.errors);
    }
  }
  
  // Validate public key
  if (publicKey !== undefined) {
    const publicKeyResult = validatePublicKey(publicKey);
    if (!publicKeyResult.isValid) {
      allErrors.push(...publicKeyResult.errors);
    }
  }
  
  // If there are errors, throw ValidationError
  if (allErrors.length > 0) {
    throw new ValidationError('Whitelist operation validation failed', {
      fields: allErrors,
    });
  }
  
  next();
}
