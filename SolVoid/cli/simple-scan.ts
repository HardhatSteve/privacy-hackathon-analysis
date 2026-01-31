#!/usr/bin/env node

/**
 * Simple SolVoid Privacy Scanner
 */

import { PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';
import * as dotenv from 'dotenv';

dotenv.config();

interface PrivacyScore {
    score: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    breakdown: {
        transactionPattern: number;
        timingAnalysis: number;
        amountDistribution: number;
        networkBehavior: number;
    };
    recommendations: string[];
}

class SimplePrivacyScanner {
    private connection: Connection;

    constructor(rpcUrl?: string) {
        this.connection = new Connection(rpcUrl || clusterApiUrl('devnet'));
    }

    async analyzeAddress(address: string): Promise<PrivacyScore> {
        try {
            const publicKey = new PublicKey(address);
            
            // Get account info
            const accountInfo = await this.connection.getAccountInfo(publicKey);
            if (!accountInfo) {
                throw new Error('Account not found');
            }

            // Get transaction signatures
            const signatures = await this.connection.getSignaturesForAddress(
                publicKey,
                { limit: 100 }
            );

            // Get detailed transactions
            const transactions = await this.connection.getParsedTransactions(
                signatures.map(sig => sig.signature),
                { maxSupportedTransactionVersion: 0 }
            );

            // Analyze privacy patterns
            const analysis = this.analyzeTransactions(transactions);
            
            return this.calculatePrivacyScore(analysis);
        } catch (error) {
            console.error('Error analyzing address:', error);
            throw error;
        }
    }

    private analyzeTransactions(transactions: any[]) {
        const validTxs = transactions.filter(tx => tx !== null && tx.meta !== null);
        
        const analysis = {
            totalTransactions: validTxs.length,
            uniqueRecipients: new Set<string>(),
            transactionAmounts: [] as number[],
            timeGaps: [] as number[],
            failedTransactions: 0,
            programInteractions: new Set<string>()
        };

        let lastTimestamp = 0;
        
        validTxs.forEach(tx => {
            // Analyze recipients
            if (tx.meta?.postTokenBalances) {
                tx.meta.postTokenBalances.forEach((balance: any) => {
                    if (balance.owner && balance.owner !== tx.transaction?.message?.accountKeys[0]) {
                        analysis.uniqueRecipients.add(balance.owner);
                    }
                });
            }

            // Analyze amounts
            if (tx.meta?.preBalances && tx.meta?.postBalances) {
                for (let i = 0; i < tx.meta.preBalances.length; i++) {
                    const change = tx.meta.postBalances[i] - tx.meta.preBalances[i];
                    if (Math.abs(change) > 1000000) { // More than 0.001 SOL
                        analysis.transactionAmounts.push(Math.abs(change));
                    }
                }
            }

            // Analyze timing
            if (tx.blockTime && lastTimestamp > 0) {
                const gap = Math.abs(tx.blockTime - lastTimestamp);
                analysis.timeGaps.push(gap);
            }
            lastTimestamp = tx.blockTime || 0;

            // Analyze failures
            if (tx.meta?.err) {
                analysis.failedTransactions++;
            }

            // Analyze program interactions
            if (tx.transaction?.message?.instructions) {
                tx.transaction.message.instructions.forEach((instruction: any) => {
                    if (instruction.programIdIndex !== undefined) {
                        const programId = tx.transaction.message.accountKeys[instruction.programIdIndex];
                        analysis.programInteractions.add(programId.toBase58());
                    }
                });
            }
        });

        return analysis;
    }

    private calculatePrivacyScore(analysis: any): PrivacyScore {
        // Transaction pattern score (more unique recipients = better privacy)
        const transactionPatternScore = Math.min(100, (analysis.uniqueRecipients.size / Math.max(1, analysis.totalTransactions)) * 100);

        // Timing analysis score (irregular timing = better privacy)
        const avgTimeGap = analysis.timeGaps.length > 0 
            ? analysis.timeGaps.reduce((a: number, b: number) => a + b, 0) / analysis.timeGaps.length 
            : 0;
        const timingVariance = this.calculateVariance(analysis.timeGaps);
        const timingScore = Math.min(100, (timingVariance / Math.max(1, avgTimeGap)) * 50);

        // Amount distribution score (varied amounts = better privacy)
        const amountVariance = this.calculateVariance(analysis.transactionAmounts);
        const avgAmount = analysis.transactionAmounts.length > 0
            ? analysis.transactionAmounts.reduce((a: number, b: number) => a + b, 0) / analysis.transactionAmounts.length
            : 0;
        const amountScore = Math.min(100, (amountVariance / Math.max(1, avgAmount)) * 50);

        // Network behavior score (more program interactions = better privacy)
        const networkScore = Math.min(100, (analysis.programInteractions.size / 10) * 100);

        // Calculate overall score
        const overallScore = (
            transactionPatternScore * 0.3 +
            timingScore * 0.25 +
            amountScore * 0.25 +
            networkScore * 0.2
        );

        // Determine risk level
        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
        if (overallScore >= 80) {
            riskLevel = 'LOW';
        } else if (overallScore >= 60) {
            riskLevel = 'MEDIUM';
        } else {
            riskLevel = 'HIGH';
        }

        // Generate recommendations
        const recommendations = this.generateRecommendations(analysis, overallScore);

        return {
            score: Math.round(overallScore),
            riskLevel,
            breakdown: {
                transactionPattern: Math.round(transactionPatternScore),
                timingAnalysis: Math.round(timingScore),
                amountDistribution: Math.round(amountScore),
                networkBehavior: Math.round(networkScore)
            },
            recommendations
        };
    }

    private calculateVariance(values: number[]): number {
        if (values.length <= 1) return 0;
        
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    }

    private generateRecommendations(analysis: any, score: number): string[] {
        const recommendations: string[] = [];

        if (analysis.uniqueRecipients.size < 5) {
            recommendations.push('Consider diversifying transaction recipients to improve privacy');
        }

        if (analysis.timeGaps.length > 0 && this.calculateVariance(analysis.timeGaps) < 3600) {
            recommendations.push('Vary transaction timing to avoid predictable patterns');
        }

        if (analysis.transactionAmounts.length > 0 && this.calculateVariance(analysis.transactionAmounts) < 1000000) {
            recommendations.push('Use varied transaction amounts to break patterns');
        }

        if (analysis.programInteractions.size < 3) {
            recommendations.push('Interact with more diverse programs to improve privacy');
        }

        if (score < 60) {
            recommendations.push('Consider using privacy tools like mixers or shielded transactions');
        }

        if (recommendations.length === 0) {
            recommendations.push('Privacy practices look good - maintain current patterns');
        }

        return recommendations;
    }
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log(`
SolVoid Privacy Scanner

Usage:
  node simple-scan.js <address> [options]

Options:
  --help, -h     Show this help message
  --network      Network to use (mainnet-beta, devnet, testnet) [default: devnet]

Examples:
  node simple-scan.js 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM
  node simple-scan.js 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM --network mainnet-beta
        `);
        process.exit(0);
    }

    const address = args[0];
    const networkIndex = args.indexOf('--network');
    const network = networkIndex !== -1 && args[networkIndex + 1] 
        ? args[networkIndex + 1] 
        : 'devnet';

    try {
        console.log(` Analyzing privacy for address: ${address}`);
        console.log(` Using network: ${network}`);
        console.log('');

        const scanner = new SimplePrivacyScanner(
            network === 'mainnet-beta' ? clusterApiUrl('mainnet-beta') :
            network === 'testnet' ? clusterApiUrl('testnet') :
            clusterApiUrl('devnet')
        );

        const result = await scanner.analyzeAddress(address);

        console.log(` Privacy Score: ${result.score}/100`);
        console.log(`  Risk Level: ${result.riskLevel}`);
        console.log('');
        console.log(' Score Breakdown:');
        console.log(`  Transaction Pattern: ${result.breakdown.transactionPattern}%`);
        console.log(`  Timing Analysis: ${result.breakdown.timingAnalysis}%`);
        console.log(`  Amount Distribution: ${result.breakdown.amountDistribution}%`);
        console.log(`  Network Behavior: ${result.breakdown.networkBehavior}%`);
        console.log('');
        console.log(' Recommendations:');
        result.recommendations.forEach(rec => {
            console.log(`  • ${rec}`);
        });

    } catch (error) {
        console.error(' Error:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}
