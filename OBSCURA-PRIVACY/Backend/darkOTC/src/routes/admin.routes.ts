/**
 * Admin API Routes
 * 
 * Implements REST API endpoints for admin operations:
 * - POST /api/v1/admin/whitelist/add - Add market maker to whitelist
 * - POST /api/v1/admin/whitelist/remove - Remove market maker from whitelist
 * - GET /api/v1/admin/whitelist - Get whitelist
 * 
 * Requirements: 33.1, 33.2, 33.5, 33.6
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { whitelistService } from '../services/whitelist.service';
import {
  WOTSSignatureSchema,
  WOTSPublicKeySchema,
} from '../types/common.types';
import {
  buildSuccessResponse,
  buildErrorResponse,
  ErrorCode,
  getHttpStatusForErrorCode,
} from '../types/api.types';
import { verifyAdminPublicKey } from '../middleware/admin-auth.middleware';

const router = Router();

/**
 * Whitelist Operation Schema
 */
const WhitelistOperationSchema = z.object({
  address: z.string(),
  signature: WOTSSignatureSchema,
  publicKey: WOTSPublicKeySchema,
});

/**
 * POST /api/v1/admin/whitelist/add
 * 
 * Add a market maker to the whitelist.
 * 
 * Requirements: 33.1, 33.6
 */
router.post('/whitelist/add', verifyAdminPublicKey, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = WhitelistOperationSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });
      
      const errorResponse = buildErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        validationResult.error.errors,
        fieldErrors
      );
      
      return res.status(getHttpStatusForErrorCode(ErrorCode.VALIDATION_ERROR)).json(errorResponse);
    }
    
    const { address, signature, publicKey } = validationResult.data;
    
    // Add to whitelist (publicKey verified by verifyAdminPublicKey middleware)
    const result = await whitelistService.addToWhitelist(
      {
        address,
        signature,
      },
      publicKey // adminAddress - verified by middleware
    );
    
    // Return success response
    const successResponse = buildSuccessResponse(result);
    return res.status(201).json(successResponse);
    
  } catch (error) {
    console.error('[Admin Routes] Add to whitelist error:', error);
    
    // Categorize error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    let errorCode = ErrorCode.INTERNAL_ERROR;
    
    if (errorMessage.includes('Signature verification failed')) {
      errorCode = ErrorCode.SIGNATURE_VERIFICATION_FAILED;
    } else if (errorMessage.includes('Signature has already been used')) {
      errorCode = ErrorCode.SIGNATURE_REUSED;
    } else if (errorMessage.includes('already whitelisted')) {
      errorCode = ErrorCode.ALREADY_WHITELISTED;
    } else if (errorMessage.includes('Not authorized')) {
      errorCode = ErrorCode.NOT_AUTHORIZED;
    }
    
    const errorResponse = buildErrorResponse(errorCode, errorMessage);
    return res.status(getHttpStatusForErrorCode(errorCode)).json(errorResponse);
  }
});

/**
 * POST /api/v1/admin/whitelist/remove
 * 
 * Remove a market maker from the whitelist.
 * 
 * Requirements: 33.2, 33.6
 */
router.post('/whitelist/remove', verifyAdminPublicKey, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = WhitelistOperationSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      const fieldErrors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });
      
      const errorResponse = buildErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        validationResult.error.errors,
        fieldErrors
      );
      
      return res.status(getHttpStatusForErrorCode(ErrorCode.VALIDATION_ERROR)).json(errorResponse);
    }
    
    const { address, signature, publicKey } = validationResult.data;
    
    // Remove from whitelist (publicKey verified by verifyAdminPublicKey middleware)
    const result = await whitelistService.removeFromWhitelist(
      {
        address,
        signature,
      },
      publicKey // adminAddress - verified by middleware
    );
    
    // Return success response
    const successResponse = buildSuccessResponse(result);
    return res.status(200).json(successResponse);
    
  } catch (error) {
    console.error('[Admin Routes] Remove from whitelist error:', error);
    
    // Categorize error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    let errorCode = ErrorCode.INTERNAL_ERROR;
    
    if (errorMessage.includes('Signature verification failed')) {
      errorCode = ErrorCode.SIGNATURE_VERIFICATION_FAILED;
    } else if (errorMessage.includes('Signature has already been used')) {
      errorCode = ErrorCode.SIGNATURE_REUSED;
    } else if (errorMessage.includes('not whitelisted')) {
      errorCode = ErrorCode.NOT_WHITELISTED;
    } else if (errorMessage.includes('Not authorized')) {
      errorCode = ErrorCode.NOT_AUTHORIZED;
    }
    
    const errorResponse = buildErrorResponse(errorCode, errorMessage);
    return res.status(getHttpStatusForErrorCode(errorCode)).json(errorResponse);
  }
});

/**
 * GET /api/v1/admin/whitelist
 * 
 * Get all whitelisted market makers.
 * 
 * Requirements: 33.5
 */
router.get('/whitelist', async (_req: Request, res: Response) => {
  try {
    // Get whitelist
    const whitelist = await whitelistService.getWhitelist();
    
    // Return success response
    const successResponse = buildSuccessResponse({ whitelist });
    return res.status(200).json(successResponse);
    
  } catch (error) {
    console.error('[Admin Routes] Get whitelist error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = buildErrorResponse(ErrorCode.INTERNAL_ERROR, errorMessage);
    return res.status(getHttpStatusForErrorCode(ErrorCode.INTERNAL_ERROR)).json(errorResponse);
  }
});

export default router;
