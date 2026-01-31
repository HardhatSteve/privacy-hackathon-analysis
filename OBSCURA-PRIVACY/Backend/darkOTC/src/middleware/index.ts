/**
 * Middleware Exports
 * 
 * Central export point for all middleware functions.
 */

// Signature verification middleware
export {
  // Main middleware factory
  verifySignature,
  
  // Specialized middleware for each operation type
  verifyQuoteRequestSignature,
  verifyQuoteSignature,
  verifyQuoteAcceptanceSignature,
  verifyCancellationSignature,
  verifyMessageSignature,
  verifyWhitelistSignature,
  
  // Standalone verification function
  verifySignatureStandalone,
  
  // Helper functions
  buildSignatureMessage,
  
  // Types
  SignatureVerifiedRequest,
  SignatureVerificationOptions,
} from './signature-verification.middleware';

// Error handling middleware
export {
  // Error handler
  errorHandler,
  asyncHandler,
  notFoundHandler,
  
  // Error classes
  ValidationError,
  NotFoundError,
  AuthorizationError,
  CryptographicError,
  InsufficientBalanceError,
  SignatureError,
  TimeoutError,
  
  // Types
  ErrorResponse,
} from './error-handler.middleware';

// Validation middleware
export {
  // Validation functions
  validateRequiredFields,
  validateAssetPair,
  validateSolanaAddress,
  validateEthereumAddress,
  validateAmount,
  validateFutureTimestamp,
  validateDirection,
  validateSignature as validateSignatureFormat,
  validatePublicKey,
  validateChainId,
  
  // Validation middleware
  validateQuoteRequestCreation,
  validateQuoteSubmission,
  validateQuoteAcceptance,
  validateMessageSending,
  validateWhitelistOperation,
} from './validation.middleware';

// Admin authentication middleware
export {
  verifyAdminPublicKey,
} from './admin-auth.middleware';
