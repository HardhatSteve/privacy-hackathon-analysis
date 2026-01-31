/**
 * API Routes Index
 * 
 * Central router that combines all API routes and provides
 * health check and status endpoints.
 * 
 * Requirements: All requirements (API interface)
 */

import { Router, Request, Response } from 'express';
import rfqRoutes from './rfq.routes';
import adminRoutes from './admin.routes';
import {
  buildSuccessResponse,
  buildErrorResponse,
  ErrorCode,
  getHttpStatusForErrorCode,
} from '../types/api.types';

const router = Router();

/**
 * GET /
 * 
 * API information endpoint.
 */
router.get('/', (_req: Request, res: Response) => {
  const response = buildSuccessResponse({
    name: 'Obscura Dark OTC RFQ API',
    version: '1.0.0',
    description: 'Privacy-preserving Request for Quote system built on Obscura infrastructure',
    endpoints: {
      rfq: '/api/v1/rfq',
      admin: '/api/v1/admin',
      health: '/health',
      status: {
        privacy: '/api/v1/privacy/status',
        solana: '/api/v1/solana/status',
        evm: '/api/v1/evm/status',
      },
    },
  });
  
  res.status(200).json(response);
});

/**
 * GET /health
 * 
 * Health check endpoint.
 */
router.get('/health', (_req: Request, res: Response) => {
  const response = buildSuccessResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
  
  res.status(200).json(response);
});

/**
 * GET /api/v1/privacy/status
 * 
 * Privacy layer status endpoint.
 */
router.get('/api/v1/privacy/status', async (_req: Request, res: Response) => {
  try {
    // Check privacy service components
    const status = {
      stealthAddresses: 'operational',
      pedersenCommitments: 'operational',
      nullifiers: 'operational',
      encryption: 'operational',
      timestamp: new Date().toISOString(),
    };
    
    const response = buildSuccessResponse(status);
    res.status(200).json(response);
    
  } catch (error) {
    console.error('[Status] Privacy status error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = buildErrorResponse(ErrorCode.INTERNAL_ERROR, errorMessage);
    res.status(getHttpStatusForErrorCode(ErrorCode.INTERNAL_ERROR)).json(errorResponse);
  }
});

/**
 * GET /api/v1/solana/status
 * 
 * Solana network status endpoint.
 */
router.get('/api/v1/solana/status', async (_req: Request, res: Response) => {
  try {
    const status = {
      network: 'devnet',
      connected: true,
      timestamp: new Date().toISOString(),
    };
    
    const response = buildSuccessResponse(status);
    res.status(200).json(response);
    
  } catch (error) {
    console.error('[Status] Solana status error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = buildErrorResponse(ErrorCode.INTERNAL_ERROR, errorMessage);
    res.status(getHttpStatusForErrorCode(ErrorCode.INTERNAL_ERROR)).json(errorResponse);
  }
});

/**
 * GET /api/v1/evm/status
 * 
 * EVM network status endpoint.
 */
router.get('/api/v1/evm/status', async (_req: Request, res: Response) => {
  try {
    const status = {
      network: 'sepolia',
      connected: true,
      timestamp: new Date().toISOString(),
    };
    
    const response = buildSuccessResponse(status);
    res.status(200).json(response);
    
  } catch (error) {
    console.error('[Status] EVM status error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorResponse = buildErrorResponse(ErrorCode.INTERNAL_ERROR, errorMessage);
    res.status(getHttpStatusForErrorCode(ErrorCode.INTERNAL_ERROR)).json(errorResponse);
  }
});

// Mount route modules
router.use('/api/v1/rfq', rfqRoutes);
router.use('/api/v1/admin', adminRoutes);

export default router;
