import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { ExposureResult } from '../_lib/types.js';
import { isValidSolanaAddress } from '../_lib/solanaService.js';
import { analyzeWallet } from '../_lib/analysisService.js';

// Simple in-memory cache (resets on cold start)
const cache = new Map<string, { result: ExposureResult; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: { message: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' } });
  }

  try {
    const { address } = req.query;
    const skipCache = req.query.refresh === 'true';

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: { message: 'Address is required', code: 'MISSING_ADDRESS' } });
    }

    // Validate address
    if (!isValidSolanaAddress(address)) {
      return res.status(400).json({ error: { message: 'Invalid Solana address', code: 'INVALID_ADDRESS' } });
    }

    // Check cache first (unless refresh requested)
    if (!skipCache) {
      const cached = cache.get(address.toLowerCase());
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return res.status(200).json({ ...cached.result, cached: true });
      }
    }

    // Perform analysis
    const result = await analyzeWallet(address);

    // Cache the result
    cache.set(address.toLowerCase(), { result, timestamp: Date.now() });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({
      error: {
        message: error instanceof Error ? error.message : 'Analysis failed',
        code: 'ANALYSIS_ERROR',
      },
    });
  }
}
