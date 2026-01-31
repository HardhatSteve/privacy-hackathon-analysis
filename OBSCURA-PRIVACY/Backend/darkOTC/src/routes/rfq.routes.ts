/**
 * RFQ API Routes
 * 
 * Implements REST API endpoints for RFQ operations:
 * - POST /api/v1/rfq/quote-request - Create quote request
 * - POST /api/v1/rfq/quote-request/:id/cancel - Cancel quote request
 * - GET /api/v1/rfq/quote-request/:id - Get quote request
 * 
 * Requirements: 1.1-1.7, 10.1-10.8
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { rfqService } from '../services/rfq.service';
import { supabaseConfig } from '../config/supabase.config';
import {
  AssetPairSchema,
  TradeDirectionSchema,
  AmountSchema,
  FutureTimestampSchema,
  WOTSSignatureSchema,
  WOTSPublicKeySchema,
  NetworkSchema,
} from '../types/common.types';
import {
  buildSuccessResponse,
  buildErrorResponse,
  ErrorCode,
  getHttpStatusForErrorCode,
} from '../types/api.types';

const router = Router();

/**
 * Create Quote Request Schema
 */
const CreateQuoteRequestSchema = z.object({
  assetPair: AssetPairSchema,
  direction: TradeDirectionSchema,
  amount: AmountSchema,
  timeout: FutureTimestampSchema,
  signature: WOTSSignatureSchema,
  publicKey: WOTSPublicKeySchema,
  message: z.string().min(1, 'Message is required'),
  commitment: z.string().optional(),
  chainId: NetworkSchema.optional(),
});

/**
 * Cancel Quote Request Schema
 */
const CancelQuoteRequestSchema = z.object({
  signature: WOTSSignatureSchema,
  publicKey: WOTSPublicKeySchema,
});

/**
 * POST /api/v1/rfq/quote-request
 * 
 * Create a new quote request.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */
router.post('/quote-request', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = CreateQuoteRequestSchema.safeParse(req.body);
    
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
    
    const params = validationResult.data;
    
    // Create quote request
    const result = await rfqService.createQuoteRequest(params);
    
    // Return success response
    const successResponse = buildSuccessResponse(result);
    return res.status(201).json(successResponse);
    
  } catch (error) {
    console.error('[RFQ Routes] Create quote request error:', error);
    
    // Categorize error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    let errorCode = ErrorCode.INTERNAL_ERROR;
    
    if (errorMessage.includes('Signature verification failed')) {
      errorCode = ErrorCode.SIGNATURE_VERIFICATION_FAILED;
    } else if (errorMessage.includes('Signature has already been used')) {
      errorCode = ErrorCode.SIGNATURE_REUSED;
    } else if (errorMessage.includes('Insufficient balance')) {
      errorCode = ErrorCode.INSUFFICIENT_BALANCE;
    } else if (errorMessage.includes('Timeout')) {
      errorCode = ErrorCode.INVALID_TIMESTAMP;
    } else if (errorMessage.includes('Failed to store')) {
      errorCode = ErrorCode.DATABASE_ERROR;
    }
    
    const errorResponse = buildErrorResponse(errorCode, errorMessage);
    return res.status(getHttpStatusForErrorCode(errorCode)).json(errorResponse);
  }
});

/**
 * POST /api/v1/rfq/quote-request/:id/cancel
 * 
 * Cancel a quote request.
 * 
 * Requirements: 10.5, 10.6, 10.7, 10.8
 */
router.post('/quote-request/:id/cancel', async (req: Request, res: Response) => {
  try {
    const quoteRequestId = req.params.id;
    
    // Validate request body
    const validationResult = CancelQuoteRequestSchema.safeParse(req.body);
    
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
    
    const { signature, publicKey } = validationResult.data;
    
    // Cancel quote request
    const result = await rfqService.cancelQuoteRequest({
      quoteRequestId,
      signature,
      publicKey,
    });
    
    // Return success response
    const successResponse = buildSuccessResponse(result);
    return res.status(200).json(successResponse);
    
  } catch (error) {
    console.error('[RFQ Routes] Cancel quote request error:', error);
    
    // Categorize error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    let errorCode = ErrorCode.INTERNAL_ERROR;
    
    if (errorMessage.includes('not found')) {
      errorCode = ErrorCode.QUOTE_REQUEST_NOT_FOUND;
    } else if (errorMessage.includes('Only the taker')) {
      errorCode = ErrorCode.NOT_OWNER;
    } else if (errorMessage.includes('Signature verification failed')) {
      errorCode = ErrorCode.SIGNATURE_VERIFICATION_FAILED;
    } else if (errorMessage.includes('Signature has already been used')) {
      errorCode = ErrorCode.SIGNATURE_REUSED;
    } else if (errorMessage.includes('already cancelled')) {
      errorCode = ErrorCode.QUOTE_REQUEST_CANCELLED;
    } else if (errorMessage.includes('filled')) {
      errorCode = ErrorCode.QUOTE_REQUEST_FILLED;
    } else if (errorMessage.includes('Failed to cancel')) {
      errorCode = ErrorCode.DATABASE_ERROR;
    }
    
    const errorResponse = buildErrorResponse(errorCode, errorMessage);
    return res.status(getHttpStatusForErrorCode(errorCode)).json(errorResponse);
  }
});

/**
 * GET /api/v1/rfq/quote-requests
 * 
 * Get all active quote requests (for public board).
 * Includes quote_count for each request.
 */
router.get('/quote-requests', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const now = Date.now();
    
    // Build base query
    let query = supabaseConfig.adminClient
      .from('quote_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Filter by status if provided
    if (status && typeof status === 'string') {
      query = query.eq('status', status);
    } else {
      // Default: only show active requests
      query = query.eq('status', 'active');
    }
    
    const { data: quoteRequests, error } = await query;
    
    if (error) {
      throw new Error(`Failed to fetch quote requests: ${error.message}`);
    }
    
    // Add quote_count to each request
    // Optimized: Single query to get all counts at once
    const quoteRequestIds = (quoteRequests || []).map((qr: any) => qr.id);
    
    let quoteCounts: Record<string, number> = {};
    
    if (quoteRequestIds.length > 0) {
      // Get all active, non-expired quotes for these requests
      const { data: quotes, error: quotesError } = await supabaseConfig.adminClient
        .from('quotes')
        .select('quote_request_id')
        .in('quote_request_id', quoteRequestIds)
        .eq('status', 'active')
        .gt('expires_at', now);
      
      if (quotesError) {
        console.error('[RFQ Routes] Failed to fetch quote counts:', quotesError);
        // Continue without counts rather than failing
      } else if (quotes) {
        // Count quotes per request
        quotes.forEach((quote: any) => {
          quoteCounts[quote.quote_request_id] = (quoteCounts[quote.quote_request_id] || 0) + 1;
        });
      }
    }
    
    // Add quote_count to each request
    const quoteRequestsWithCount = (quoteRequests || []).map((qr: any) => ({
      ...qr,
      quote_count: quoteCounts[qr.id] || 0,
    }));
    
    // Return success response
    const successResponse = buildSuccessResponse({ quoteRequests: quoteRequestsWithCount });
    return res.status(200).json(successResponse);
    
  } catch (error) {
    console.error('[RFQ Routes] Get quote requests error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = buildErrorResponse(ErrorCode.INTERNAL_ERROR, errorMessage);
    return res.status(getHttpStatusForErrorCode(ErrorCode.INTERNAL_ERROR)).json(errorResponse);
  }
});

/**
 * GET /api/v1/rfq/quote-request/:id
 * 
 * Get a quote request by ID.
 * Includes quote_count.
 */
router.get('/quote-request/:id', async (req: Request, res: Response) => {
  try {
    const quoteRequestId = req.params.id;
    const now = Date.now();
    
    // Get quote request
    const quoteRequest = await rfqService.getQuoteRequest(quoteRequestId);
    
    if (!quoteRequest) {
      const errorResponse = buildErrorResponse(
        ErrorCode.QUOTE_REQUEST_NOT_FOUND,
        'Quote request not found'
      );
      return res.status(getHttpStatusForErrorCode(ErrorCode.QUOTE_REQUEST_NOT_FOUND)).json(errorResponse);
    }
    
    // Get quote count (active, non-expired quotes only)
    const { count, error: countError } = await supabaseConfig.adminClient
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('quote_request_id', quoteRequestId)
      .eq('status', 'active')
      .gt('expires_at', now);
    
    const quoteCount = countError ? 0 : (count || 0);
    
    // Add quote_count to response
    const quoteRequestWithCount = {
      ...quoteRequest,
      quote_count: quoteCount,
    };
    
    // Return success response
    const successResponse = buildSuccessResponse(quoteRequestWithCount);
    return res.status(200).json(successResponse);
    
  } catch (error) {
    console.error('[RFQ Routes] Get quote request error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = buildErrorResponse(ErrorCode.INTERNAL_ERROR, errorMessage);
    return res.status(getHttpStatusForErrorCode(ErrorCode.INTERNAL_ERROR)).json(errorResponse);
  }
});

export default router;

/**
 * Quote Submission Schema
 */
const SubmitQuoteSchema = z.object({
  quoteRequestId: z.string().uuid(),
  price: AmountSchema,
  expirationTime: FutureTimestampSchema,
  signature: WOTSSignatureSchema,
  publicKey: WOTSPublicKeySchema,
});

/**
 * Quote Acceptance Schema
 */
const AcceptQuoteSchema = z.object({
  signature: WOTSSignatureSchema,
  publicKey: WOTSPublicKeySchema,
  commitment: z.string(),
});

/**
 * Message Sending Schema
 */
const SendMessageSchema = z.object({
  quoteRequestId: z.string().uuid(),
  recipientStealthAddress: z.string(),
  encryptedContent: z.string(),
  signature: WOTSSignatureSchema,
  publicKey: WOTSPublicKeySchema,
});

/**
 * POST /api/v1/rfq/quote
 * 
 * Submit a quote for a quote request.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */
router.post('/quote', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = SubmitQuoteSchema.safeParse(req.body);
    
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
    
    const params = validationResult.data;
    
    // Submit quote
    const result = await rfqService.submitQuote(params);
    
    // Return success response
    const successResponse = buildSuccessResponse(result);
    return res.status(201).json(successResponse);
    
  } catch (error) {
    console.error('[RFQ Routes] Submit quote error:', error);
    
    // Categorize error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    let errorCode = ErrorCode.INTERNAL_ERROR;
    
    if (errorMessage.includes('not whitelisted')) {
      errorCode = ErrorCode.NOT_WHITELISTED;
    } else if (errorMessage.includes('not found')) {
      errorCode = ErrorCode.QUOTE_REQUEST_NOT_FOUND;
    } else if (errorMessage.includes('expired')) {
      errorCode = ErrorCode.QUOTE_REQUEST_EXPIRED;
    } else if (errorMessage.includes('Signature verification failed')) {
      errorCode = ErrorCode.SIGNATURE_VERIFICATION_FAILED;
    } else if (errorMessage.includes('Signature has already been used')) {
      errorCode = ErrorCode.SIGNATURE_REUSED;
    } else if (errorMessage.includes('Insufficient balance')) {
      errorCode = ErrorCode.INSUFFICIENT_BALANCE;
    } else if (errorMessage.includes('expiration')) {
      errorCode = ErrorCode.INVALID_TIMESTAMP;
    }
    
    const errorResponse = buildErrorResponse(errorCode, errorMessage);
    return res.status(getHttpStatusForErrorCode(errorCode)).json(errorResponse);
  }
});

/**
 * GET /api/v1/rfq/quote-request/:id/quotes
 * 
 * Get all quotes for a quote request.
 * 
 * Requirements: 3.1
 */
router.get('/quote-request/:id/quotes', async (req: Request, res: Response) => {
  try {
    const quoteRequestId = req.params.id;
    
    // Get quotes
    const quotes = await rfqService.getQuotesByRequestId(quoteRequestId);
    
    // Return success response
    const successResponse = buildSuccessResponse({ quotes });
    return res.status(200).json(successResponse);
    
  } catch (error) {
    console.error('[RFQ Routes] Get quotes error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    let errorCode = ErrorCode.INTERNAL_ERROR;
    
    if (errorMessage.includes('not found')) {
      errorCode = ErrorCode.QUOTE_REQUEST_NOT_FOUND;
    }
    
    const errorResponse = buildErrorResponse(errorCode, errorMessage);
    return res.status(getHttpStatusForErrorCode(errorCode)).json(errorResponse);
  }
});

/**
 * POST /api/v1/rfq/quote/:id/accept
 * 
 * Accept a quote.
 * 
 * Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */
router.post('/quote/:id/accept', async (req: Request, res: Response) => {
  try {
    const quoteId = req.params.id;
    
    // Validate request body
    const validationResult = AcceptQuoteSchema.safeParse(req.body);
    
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
    
    const { signature, publicKey, commitment } = validationResult.data;
    
    // Accept quote
    const result = await rfqService.acceptQuote({
      quoteId,
      signature,
      publicKey,
      commitment,
    });
    
    // Return success response
    const successResponse = buildSuccessResponse(result);
    return res.status(200).json(successResponse);
    
  } catch (error) {
    console.error('[RFQ Routes] Accept quote error:', error);
    
    // Categorize error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    let errorCode = ErrorCode.INTERNAL_ERROR;
    
    if (errorMessage.includes('Quote not found')) {
      errorCode = ErrorCode.QUOTE_NOT_FOUND;
    } else if (errorMessage.includes('Quote request not found')) {
      errorCode = ErrorCode.QUOTE_REQUEST_NOT_FOUND;
    } else if (errorMessage.includes('Only the taker')) {
      errorCode = ErrorCode.NOT_OWNER;
    } else if (errorMessage.includes('expired')) {
      errorCode = ErrorCode.QUOTE_EXPIRED;
    } else if (errorMessage.includes('filled')) {
      errorCode = ErrorCode.QUOTE_REQUEST_FILLED;
    } else if (errorMessage.includes('cancelled')) {
      errorCode = ErrorCode.QUOTE_REQUEST_CANCELLED;
    } else if (errorMessage.includes('Signature verification failed')) {
      errorCode = ErrorCode.SIGNATURE_VERIFICATION_FAILED;
    } else if (errorMessage.includes('Signature has already been used')) {
      errorCode = ErrorCode.SIGNATURE_REUSED;
    } else if (errorMessage.includes('Settlement failed')) {
      errorCode = ErrorCode.SETTLEMENT_FAILED;
    }
    
    const errorResponse = buildErrorResponse(errorCode, errorMessage);
    return res.status(getHttpStatusForErrorCode(errorCode)).json(errorResponse);
  }
});

/**
 * POST /api/v1/rfq/message
 * 
 * Send a private message.
 * 
 * Requirements: 26.1, 26.2, 26.3, 26.4
 */
router.post('/message', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = SendMessageSchema.safeParse(req.body);
    
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
    
    const params = validationResult.data;
    
    // Send message
    const { messageService } = await import('../services/message.service');
    const result = await messageService.sendMessage(params);
    
    // Return success response
    const successResponse = buildSuccessResponse(result);
    return res.status(201).json(successResponse);
    
  } catch (error) {
    console.error('[RFQ Routes] Send message error:', error);
    
    // Categorize error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    let errorCode = ErrorCode.INTERNAL_ERROR;
    
    if (errorMessage.includes('not found')) {
      errorCode = ErrorCode.QUOTE_REQUEST_NOT_FOUND;
    } else if (errorMessage.includes('Unauthorized')) {
      errorCode = ErrorCode.NOT_AUTHORIZED;
    } else if (errorMessage.includes('Signature verification failed')) {
      errorCode = ErrorCode.SIGNATURE_VERIFICATION_FAILED;
    } else if (errorMessage.includes('Signature has already been used')) {
      errorCode = ErrorCode.SIGNATURE_REUSED;
    } else if (errorMessage.includes('empty')) {
      errorCode = ErrorCode.VALIDATION_ERROR;
    }
    
    const errorResponse = buildErrorResponse(errorCode, errorMessage);
    return res.status(getHttpStatusForErrorCode(errorCode)).json(errorResponse);
  }
});

/**
 * GET /api/v1/rfq/quote-request/:id/messages
 * 
 * Get messages for a quote request.
 * 
 * Requirements: 26.5, 26.6
 */
router.get('/quote-request/:id/messages', async (req: Request, res: Response) => {
  try {
    const quoteRequestId = req.params.id;
    const { publicKey } = req.query;
    
    if (!publicKey || typeof publicKey !== 'string') {
      const errorResponse = buildErrorResponse(
        ErrorCode.VALIDATION_ERROR,
        'Public key is required'
      );
      return res.status(getHttpStatusForErrorCode(ErrorCode.VALIDATION_ERROR)).json(errorResponse);
    }
    
    // Get messages
    const { messageService } = await import('../services/message.service');
    const messages = await messageService.getMessages(
      quoteRequestId,
      publicKey
    );
    
    // Return success response
    const successResponse = buildSuccessResponse({ messages });
    return res.status(200).json(successResponse);
    
  } catch (error) {
    console.error('[RFQ Routes] Get messages error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    let errorCode = ErrorCode.INTERNAL_ERROR;
    
    if (errorMessage.includes('not found')) {
      errorCode = ErrorCode.QUOTE_REQUEST_NOT_FOUND;
    } else if (errorMessage.includes('Unauthorized')) {
      errorCode = ErrorCode.NOT_AUTHORIZED;
    }
    
    const errorResponse = buildErrorResponse(errorCode, errorMessage);
    return res.status(getHttpStatusForErrorCode(errorCode)).json(errorResponse);
  }
});
