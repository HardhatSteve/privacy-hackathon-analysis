import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isValidSolanaAddress, getSolBalance } from './_lib/solanaService.js';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    // Test importing from _lib
    const testAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const isValid = isValidSolanaAddress(testAddress);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid address' });
    }

    const balance = await getSolBalance(testAddress);

    return res.status(200).json({
      message: 'Import from _lib works!',
      address: testAddress,
      balance,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
