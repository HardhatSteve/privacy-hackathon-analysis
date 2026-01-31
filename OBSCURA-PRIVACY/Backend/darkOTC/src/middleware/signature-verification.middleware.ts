/**
 * Signature Verification Middleware
 * 
 * Middleware for verifying WOTS+ signatures on all RFQ operations.
 * Implements signature verification and reuse detection for:
 * - Quote requests
 * - Quotes
 * - Quote selections
 * - Cancellations
 * - Messages
 * 
 * Requirements:
 * - 35.1: Require WOTS+ signature for all RFQ operations
 * - 35.2: Validate signatures against claimed sender's public key
 * - 35.3: Reject operations with invalid signatures
 * - 35.4: Reject operations with reused signatures
 * - 35.5: Maintain record of used signature hashes
 */

import { Request, Response, NextFunction } from 'express';
import { signatureService } from '../services/signature.service';
import {
  buildErrorResponse,
  ErrorCode,
  getHttpStatusForErrorCode,
} from '../types/api.types';
import { WOTSSignature, WOTSPublicKey } from '../types/common.types';

/**
 * Signature verification request extension
 * 
 * Extends Express Request to include verified signature information.
 */
export interface SignatureVerifiedRequest extends Request {
  /** Verified signature hash (for tracking) */
  signatureHash?: string;
  
  /** Verified public key */
  verifiedPublicKey?: WOTSPublicKey;
  
  /** Operation type (for signature tracking) */
  operationType?: string;
}

/**
 * Signature verification options
 */
export interface SignatureVerificationOptions {
  /** Operation type (e.g., 'quote_request', 'quote', 'accept', 'cancel', 'message') */
  operationType: string;
  
  /** Whether to check for signature reuse (default: true) */
  checkReuse?: boolean;
  
  /** Whether to mark signature as used after verification (default: true) */
  markAsUsed?: boolean;
  
  /** Custom message builder (for creating the message to verify) */
  messageBuilder?: (req: Request) => string | Uint8Array;
}

/**
 * Default message builder
 * 
 * Creates a message to verify from the request body.
 * Excludes the signature and publicKey fields.
 * 
 * @param req - Express request
 * @returns Message string
 */
function defaultMessageBuilder(req: Request): string {
  const { signature, publicKey, ...messageData } = req.body;
  return JSON.stringify(messageData);
}

/**
 * Verify Signature Middleware
 * 
 * Middleware factory that creates a signature verification middleware
 * for a specific operation type.
 * 
 * Usage:
 * ```typescript
 * router.post('/quote-request',
 *   verifySignature({ operationType: 'quote_request' }),
 *   createQuoteRequestHandler
 * );
 * ```
 * 
 * @param options - Verification options
 * @returns Express middleware function
 */
export function verifySignature(options: SignatureVerificationOptions) {
  const {
    operationType,
    checkReuse = true,
    markAsUsed = true,
    messageBuilder = defaultMessageBuilder,
  } = options;

  return async (
    req: SignatureVerifiedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract signature and public key from request body
      const { signature, publicKey } = req.body;

      // Validate presence of signature and public key
      if (!signature || !publicKey) {
        const error = buildErrorResponse(
          ErrorCode.MISSING_FIELD,
          'Signature and public key are required',
          { missingFields: [!signature && 'signature', !publicKey && 'publicKey'].filter(Boolean) }
        );
        res.status(getHttpStatusForErrorCode(ErrorCode.MISSING_FIELD)).json(error);
        return;
      }

      // Build message to verify
      const message = messageBuilder(req);

      // Step 1: Verify signature
      const verificationResult = await signatureService.verifySignature({
        message,
        signature: signature as WOTSSignature,
        publicKey: publicKey as WOTSPublicKey,
      });

      if (!verificationResult.isValid) {
        const error = buildErrorResponse(
          ErrorCode.SIGNATURE_VERIFICATION_FAILED,
          'Signature verification failed',
          { reason: verificationResult.error }
        );
        res.status(getHttpStatusForErrorCode(ErrorCode.SIGNATURE_VERIFICATION_FAILED)).json(error);
        return;
      }

      // Step 2: Check for signature reuse (if enabled)
      if (checkReuse && verificationResult.signatureHash) {
        const reuseCheck = await signatureService.checkSignatureReuse({
          signature: signature as WOTSSignature,
          operationType,
          publicKey: publicKey as WOTSPublicKey,
        });

        if (reuseCheck.isReused) {
          const error = buildErrorResponse(
            ErrorCode.SIGNATURE_REUSED,
            'Signature has already been used. WOTS+ signatures are one-time use only.',
            {
              signatureHash: reuseCheck.signatureHash,
              operationType,
            }
          );
          res.status(getHttpStatusForErrorCode(ErrorCode.SIGNATURE_REUSED)).json(error);
          return;
        }
      }

      // Step 3: Mark signature as used (if enabled)
      if (markAsUsed && verificationResult.signatureHash) {
        try {
          await signatureService.markSignatureUsed(
            signature as WOTSSignature,
            operationType,
            publicKey as WOTSPublicKey
          );
        } catch (error) {
          // Log error but don't fail the request
          // (signature might already be marked by concurrent request)
          console.warn('Failed to mark signature as used:', error);
        }
      }

      // Attach verified information to request
      req.signatureHash = verificationResult.signatureHash;
      req.verifiedPublicKey = publicKey as WOTSPublicKey;
      req.operationType = operationType;

      // Continue to next middleware
      next();
    } catch (error) {
      console.error('Signature verification middleware error:', error);
      const errorResponse = buildErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        'Internal error during signature verification',
        { error: error instanceof Error ? error.message : String(error) }
      );
      res.status(getHttpStatusForErrorCode(ErrorCode.INTERNAL_ERROR)).json(errorResponse);
    }
  };
}

/**
 * Verify Quote Request Signature
 * 
 * Specialized middleware for verifying quote request signatures.
 * 
 * Message format: JSON.stringify({ assetPair, direction, amount, timeout })
 */
export const verifyQuoteRequestSignature = verifySignature({
  operationType: 'quote_request',
  messageBuilder: (req) => {
    const { assetPair, direction, amount, timeout } = req.body;
    return JSON.stringify({ assetPair, direction, amount, timeout });
  },
});

/**
 * Verify Quote Signature
 * 
 * Specialized middleware for verifying quote submission signatures.
 * 
 * Message format: JSON.stringify({ quoteRequestId, price, expirationTime })
 */
export const verifyQuoteSignature = verifySignature({
  operationType: 'quote',
  messageBuilder: (req) => {
    const { quoteRequestId, price, expirationTime } = req.body;
    return JSON.stringify({ quoteRequestId, price, expirationTime });
  },
});

/**
 * Verify Quote Acceptance Signature
 * 
 * Specialized middleware for verifying quote acceptance signatures.
 * 
 * Message format: JSON.stringify({ quoteId, quoteRequestId })
 */
export const verifyQuoteAcceptanceSignature = (req: Request, res: Response, next: NextFunction) => {
  // Get quoteId from URL params
  const quoteId = req.params.id;
  
  // Create custom message builder that includes quoteId from params
  const middleware = verifySignature({
    operationType: 'accept',
    messageBuilder: (req) => {
      const { quoteRequestId } = req.body;
      return JSON.stringify({ quoteId, quoteRequestId });
    },
  });
  
  return middleware(req, res, next);
};

/**
 * Verify Cancellation Signature
 * 
 * Specialized middleware for verifying quote request cancellation signatures.
 * 
 * Message format: JSON.stringify({ quoteRequestId })
 */
export const verifyCancellationSignature = (req: Request, res: Response, next: NextFunction) => {
  // Get quoteRequestId from URL params
  const quoteRequestId = req.params.id;
  
  // Create custom message builder that includes quoteRequestId from params
  const middleware = verifySignature({
    operationType: 'cancel',
    messageBuilder: () => {
      return JSON.stringify({ quoteRequestId });
    },
  });
  
  return middleware(req, res, next);
};

/**
 * Verify Message Signature
 * 
 * Specialized middleware for verifying message signatures.
 * 
 * Message format: JSON.stringify({ quoteRequestId, recipientStealthAddress, encryptedContent })
 */
export const verifyMessageSignature = verifySignature({
  operationType: 'message',
  messageBuilder: (req) => {
    const { quoteRequestId, recipientStealthAddress, encryptedContent } = req.body;
    return JSON.stringify({ quoteRequestId, recipientStealthAddress, encryptedContent });
  },
});

/**
 * Verify Whitelist Operation Signature
 * 
 * Specialized middleware for verifying whitelist add/remove signatures.
 * 
 * Message format: JSON.stringify({ address, operation })
 */
export function verifyWhitelistSignature(operation: 'add' | 'remove') {
  return verifySignature({
    operationType: `whitelist_${operation}`,
    messageBuilder: (req) => {
      const { address } = req.body;
      return JSON.stringify({ address, operation });
    },
  });
}

/**
 * Helper: Verify Signature Without Middleware
 * 
 * Standalone function for verifying signatures outside of Express middleware.
 * Useful for testing or non-HTTP contexts.
 * 
 * @param params - Verification parameters
 * @returns Verification result with error details
 */
export async function verifySignatureStandalone(params: {
  message: string | Uint8Array;
  signature: WOTSSignature;
  publicKey: WOTSPublicKey;
  operationType: string;
  checkReuse?: boolean;
  markAsUsed?: boolean;
}): Promise<{
  success: boolean;
  signatureHash?: string;
  error?: string;
  errorCode?: ErrorCode;
}> {
  const {
    message,
    signature,
    publicKey,
    operationType,
    checkReuse = true,
    markAsUsed = true,
  } = params;

  try {
    // Step 1: Verify signature
    const verificationResult = await signatureService.verifySignature({
      message,
      signature,
      publicKey,
    });

    if (!verificationResult.isValid) {
      return {
        success: false,
        error: verificationResult.error || 'Signature verification failed',
        errorCode: ErrorCode.SIGNATURE_VERIFICATION_FAILED,
      };
    }

    // Step 2: Check for signature reuse
    if (checkReuse && verificationResult.signatureHash) {
      const reuseCheck = await signatureService.checkSignatureReuse({
        signature,
        operationType,
        publicKey,
      });

      if (reuseCheck.isReused) {
        return {
          success: false,
          signatureHash: reuseCheck.signatureHash,
          error: 'Signature has already been used',
          errorCode: ErrorCode.SIGNATURE_REUSED,
        };
      }
    }

    // Step 3: Mark signature as used
    if (markAsUsed && verificationResult.signatureHash) {
      await signatureService.markSignatureUsed(
        signature,
        operationType,
        publicKey
      );
    }

    return {
      success: true,
      signatureHash: verificationResult.signatureHash,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      errorCode: ErrorCode.INTERNAL_ERROR,
    };
  }
}

/**
 * Helper: Build Signature Message
 * 
 * Helper function to build the message that should be signed for each operation type.
 * This ensures consistency between signature creation and verification.
 * 
 * @param operationType - Type of operation
 * @param data - Operation data
 * @returns Message string to sign
 */
export function buildSignatureMessage(
  operationType: string,
  data: Record<string, any>
): string {
  switch (operationType) {
    case 'quote_request':
      return JSON.stringify({
        assetPair: data.assetPair,
        direction: data.direction,
        amount: data.amount,
        timeout: data.timeout,
      });
    
    case 'quote':
      return JSON.stringify({
        quoteRequestId: data.quoteRequestId,
        price: data.price,
        expirationTime: data.expirationTime,
      });
    
    case 'accept':
      return JSON.stringify({
        quoteId: data.quoteId,
        quoteRequestId: data.quoteRequestId,
      });
    
    case 'cancel':
      return JSON.stringify({
        quoteRequestId: data.quoteRequestId,
      });
    
    case 'message':
      return JSON.stringify({
        quoteRequestId: data.quoteRequestId,
        recipientStealthAddress: data.recipientStealthAddress,
        encryptedContent: data.encryptedContent,
      });
    
    case 'whitelist_add':
    case 'whitelist_remove':
      return JSON.stringify({
        address: data.address,
        operation: operationType.split('_')[1],
      });
    
    default:
      throw new Error(`Unknown operation type: ${operationType}`);
  }
}
