// Scan API Route
// Handles /api/scan/:address endpoint

import { Router, Request, Response } from 'express';
import { heliusService } from '../services/helius.js';
import { birdeyeService } from '../services/birdeye.js';
import { exposureAnalyzer } from '../services/analyzer.js';

const router = Router();

// Validate Solana address format (base58, 32-44 chars)
function isValidSolanaAddress(address: string): boolean {
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address);
}

/**
 * GET /api/scan/:address
 * Analyze wallet privacy exposure
 */
router.get('/:address', async (req: Request, res: Response) => {
    const { address } = req.params;

    // Validate address
    if (!address || !isValidSolanaAddress(address)) {
        res.status(400).json({
            error: 'Invalid Solana address',
            message: 'Please provide a valid Solana wallet address',
        });
        return;
    }

    try {
        console.log(`[Scan] Starting analysis for ${address}`);

        // Fetch data in parallel
        const [transactions, assets, solBalance, pnlData] = await Promise.all([
            heliusService.getTransactionHistory(address, 100).catch(err => {
                console.error('[Helius] Transaction history error:', err.message);
                return [];
            }),
            heliusService.getAssetsByOwner(address).catch(err => {
                console.error('[Helius] Assets error:', err.message);
                return [];
            }),
            heliusService.getBalance(address).catch(err => {
                console.error('[Helius] Balance error:', err.message);
                return 0;
            }),
            birdeyeService.isEnabled()
                ? birdeyeService.getWalletPnL(address).catch(err => {
                    console.error('[Birdeye] PnL error:', err.message);
                    return null;
                })
                : Promise.resolve(null),
        ]);

        console.log(`[Scan] Fetched ${transactions.length} transactions, ${assets.length} assets, ${solBalance} SOL`);

        // Check if we got any data
        if (transactions.length === 0 && assets.length === 0 && solBalance === 0) {
            res.status(404).json({
                error: 'No data found',
                message: 'This wallet has no transaction history or assets. It may be empty or invalid.',
            });
            return;
        }

        // Analyze exposure
        const analysis = await exposureAnalyzer.analyze({
            address,
            transactions,
            assets,
            solBalance,
            pnlData,
        });

        console.log(`[Scan] Analysis complete. Score: ${analysis.exposureScore}`);

        res.json(analysis);

    } catch (error) {
        console.error('[Scan] Error:', error);

        res.status(500).json({
            error: 'Analysis failed',
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
        });
    }
});

export default router;
