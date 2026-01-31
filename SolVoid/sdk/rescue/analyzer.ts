import { Leak } from '../types';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { EventBus } from '../events/bus';
import { z } from 'zod';
import {
    LeakedAssetSchema,
    RescueAnalysisSchema,
    enforce,
    DataOrigin,
    DataTrust
} from '../integrity';

/**
 * Validated Leaked Asset
 */
export type LeakedAsset = z.infer<typeof LeakedAssetSchema>;

/**
 * Validated Rescue Analysis
 */
export type RescueAnalysis = z.infer<typeof RescueAnalysisSchema>;

const NATIVE_SOL_MINT = '11111111111111111111111111111111';

export class RescueAnalyzer {
    private readonly connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;
    }

    public async analyzeWallet(walletAddress: PublicKey, leaks: Leak[]): Promise<RescueAnalysis> {
        EventBus.info('Analyzing wallet for multi-asset rescue...');

        const leakedAssets: LeakedAsset[] = [];
        const seenMints = new Set<string>();
        let totalValueLamports = 0;
        let splTokenCount = 0;
        let nativeSOL = 0;

        const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
            walletAddress,
            { programId: TOKEN_PROGRAM_ID }
        );

        EventBus.info(`Found ${tokenAccounts.value.length} token accounts`);

        for (const leak of leaks) {
            let mint = NATIVE_SOL_MINT;

            if (leak.scope.includes(':')) {
                const parts = leak.scope.split(':');
                if (parts[1] && parts[1].length >= 32) {
                    mint = parts[1];
                }
            }

            if (!seenMints.has(mint)) {
                seenMints.add(mint);

                if (mint === NATIVE_SOL_MINT) {
                    const balance = await this.connection.getBalance(walletAddress);
                    nativeSOL = balance;
                    totalValueLamports += balance;

                    leakedAssets.push(enforce(LeakedAssetSchema, {
                        mint,
                        mintName: 'SOL',
                        amount: balance,
                        decimals: 9,
                        reason: leak.description,
                        severity: leak.severity,
                        isNative: true
                    }, {
                        origin: DataOrigin.CHAIN,
                        trust: DataTrust.TRUSTED,
                        createdAt: Date.now(),
                        owner: 'RescueAnalyzer'
                    }).value);

                    EventBus.leakDetected('Native SOL', leak.severity, `${balance / 1e9} SOL exposed`);
                } else {
                    const tokenAccount = tokenAccounts.value.find(
                        ta => ta.account.data.parsed.info.mint === mint
                    );

                    if (tokenAccount) {
                        const info = tokenAccount.account.data.parsed.info;
                        const amount = parseInt(info.tokenAmount.amount);
                        const decimals = info.tokenAmount.decimals;
                        splTokenCount++;

                        leakedAssets.push(enforce(LeakedAssetSchema, {
                            mint,
                            amount,
                            decimals,
                            reason: leak.description,
                            severity: leak.severity,
                            isNative: false,
                            ataAddress: tokenAccount.pubkey.toBase58()
                        }, {
                            origin: DataOrigin.CHAIN,
                            trust: DataTrust.TRUSTED,
                            createdAt: Date.now(),
                            owner: 'RescueAnalyzer'
                        }).value);

                        EventBus.leakDetected('SPL Token', leak.severity,
                            `${amount / Math.pow(10, decimals)} tokens (${mint.slice(0, 8)}...)`);
                    }
                }
            }
        }

        if (leakedAssets.length === 0 && leaks.length > 0) {
            const balance = await this.connection.getBalance(walletAddress);
            if (balance > 0) {
                nativeSOL = balance;
                totalValueLamports += balance;
                leakedAssets.push(enforce(LeakedAssetSchema, {
                    mint: NATIVE_SOL_MINT,
                    mintName: 'SOL',
                    amount: balance,
                    decimals: 9,
                    reason: 'General privacy leak affecting wallet',
                    severity: leaks[0]?.severity || 'MEDIUM',
                    isNative: true
                }, {
                    origin: DataOrigin.CHAIN,
                    trust: DataTrust.TRUSTED,
                    createdAt: Date.now(),
                    owner: 'RescueAnalyzer'
                }).value);
            }
        }

        const riskScore = this.calculateRiskScore(leaks);
        const estimatedFee = this.estimateRescueFee(leakedAssets);

        const analysis = {
            leakedAssets,
            totalValueLamports,
            splTokenCount,
            nativeSOL,
            riskScore,
            estimatedFee
        };

        EventBus.info(`Rescue analysis complete: ${leakedAssets.length} assets, risk score ${riskScore}`);

        return enforce(RescueAnalysisSchema, analysis, {
            origin: DataOrigin.INTERNAL_LOGIC,
            trust: DataTrust.TRUSTED,
            createdAt: Date.now(),
            owner: 'RescueAnalyzer'
        }).value;
    }

    private calculateRiskScore(leaks: Leak[]): number {
        const severityWeights: Record<string, number> = {
            'CRITICAL': 40,
            'HIGH': 25,
            'MEDIUM': 15,
            'LOW': 5
        };

        let score = 0;
        for (const leak of leaks) {
            score += severityWeights[leak.severity] || 10;
        }

        return Math.min(100, score);
    }

    private estimateRescueFee(assets: readonly LeakedAsset[]): number {
        let fee = 5000;
        fee += assets.length * 5000;
        fee += 50000;
        return fee;
    }
}
