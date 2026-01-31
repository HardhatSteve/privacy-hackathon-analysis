// Privacy Exposure Analyzer
// Calculates exposure scores based on real blockchain data

import { HeliusTransaction, HeliusAsset } from './helius.js';
import { BirdeyeWalletPnL } from './birdeye.js';
import { CEX_ADDRESSES, PROTOCOL_ADDRESSES } from '../constants/addresses.js';

export interface ScoreBreakdown {
    identity: number;      // SNS names, NFT metadata exposure
    kycLinks: number;      // CEX connections
    financial: number;     // Trading patterns, portfolio exposure
    clustering: number;    // Wallet relationship patterns
    activity: number;      // Transaction frequency exposure
}

export interface ClusteringData {
    interactedCount: number;
    topAddresses: string[];
}

export interface TransactionSummary {
    date: string;
    type: string;
    amountUsd: number;
    description: string;
}

export interface ExternalLinks {
    xSearch: string;
    snsSearch: string | null;
    arkham: string;
    solscan: string;
}

export interface ExposureAnalysis {
    exposureScore: number;
    scoreBreakdown: ScoreBreakdown;
    netWorthUsd: number;
    realizedLossesUsd: number;
    tradeCount: number;
    memecoinTrades: number;
    clustering: ClusteringData;
    risks: string[];
    snsDomains: string[];
    links: ExternalLinks;
    recentTxSummary: TransactionSummary[];
}

interface AnalyzerInput {
    address: string;
    transactions: HeliusTransaction[];
    assets: HeliusAsset[];
    solBalance: number;
    pnlData: BirdeyeWalletPnL | null;
}

class ExposureAnalyzer {

    /**
     * Fetch SNS domains from Bonfida SDK Proxy
     */
    async getSNSDomains(address: string): Promise<string[]> {
        try {
            const url = `https://sns-sdk-proxy.bonfida.workers.dev/domains/${address}`;
            const response = await fetch(url);
            if (!response.ok) return [];
            const data = await response.json();
            // API returns result array with domain names
            if (Array.isArray(data.result)) {
                return data.result.slice(0, 5); // Return up to 5 domains
            }
            return [];
        } catch {
            return [];
        }
    }

    /**
     * Main analysis function - calculates full exposure profile
     */
    async analyze(input: AnalyzerInput): Promise<ExposureAnalysis> {
        const { address, transactions, assets, solBalance, pnlData } = input;

        // Fetch SNS domains via Bonfida API
        const snsDomains = await this.getSNSDomains(address);

        // Calculate individual scores
        const cexAnalysis = this.analyzeCexConnections(transactions);
        const activityAnalysis = this.analyzeActivity(transactions);
        const clusteringAnalysis = this.analyzeClustering(transactions, address);
        const identityAnalysis = this.analyzeIdentity(assets, transactions);
        const financialAnalysis = this.analyzeFinancial(assets, solBalance, pnlData);

        // Calculate score breakdown (0-100 each, where higher = more exposed)
        // SNS domains significantly increase identity exposure
        let identityScore = identityAnalysis.score;
        if (snsDomains.length > 0) {
            identityScore += 30; // Major dox risk
        }
        if (snsDomains.length > 2) {
            identityScore += 15; // Multiple domains = higher exposure
        }
        identityScore = Math.min(95, identityScore);

        const scoreBreakdown: ScoreBreakdown = {
            identity: identityScore,
            kycLinks: cexAnalysis.score,
            financial: financialAnalysis.score,
            clustering: clusteringAnalysis.score,
            activity: activityAnalysis.score,
        };

        // Calculate weighted overall score
        const exposureScore = Math.round(
            scoreBreakdown.kycLinks * 0.30 +      // CEX connections most important
            scoreBreakdown.clustering * 0.25 +     // Wallet relationships
            scoreBreakdown.activity * 0.20 +       // Transaction patterns
            scoreBreakdown.financial * 0.15 +      // Portfolio exposure
            scoreBreakdown.identity * 0.10         // Identity metadata
        );

        // Generate risks list (pass snsDomains for additional risk)
        const risks = this.generateRisks(cexAnalysis, activityAnalysis, clusteringAnalysis, identityAnalysis, snsDomains);

        // Generate transaction summaries
        const recentTxSummary = this.generateTxSummaries(transactions.slice(0, 10));

        // Count trades
        const tradeCount = transactions.filter(tx =>
            tx.type === 'SWAP' || tx.type === 'TOKEN_MINT' || tx.type.includes('TRADE')
        ).length;

        // Estimate memecoin trades (tokens with no price info or very volatile)
        const memecoinTrades = Math.floor(tradeCount * 0.4); // Rough estimate

        return {
            exposureScore,
            scoreBreakdown,
            netWorthUsd: financialAnalysis.netWorth,
            realizedLossesUsd: pnlData ? Math.abs(Math.min(0, pnlData.totalRealizedPnl)) : 0,
            tradeCount,
            memecoinTrades,
            clustering: clusteringAnalysis.data,
            risks,
            snsDomains,
            links: {
                xSearch: `https://x.com/search?q=${address}&src=typed_query`,
                snsSearch: snsDomains.length > 0 ? `https://x.com/search?q=${snsDomains[0]}.sol&src=typed_query` : null,
                arkham: `https://platform.arkhamintelligence.com/explorer/address/${address}`,
                solscan: `https://solscan.io/account/${address}`,
            },
            recentTxSummary,
        };
    }

    /**
     * Analyze CEX (Centralized Exchange) connections
     */
    private analyzeCexConnections(transactions: HeliusTransaction[]) {
        const cexConnections = new Set<string>();
        let cexTxCount = 0;

        for (const tx of transactions) {
            // Check native transfers
            for (const transfer of tx.nativeTransfers || []) {
                const toExchange = CEX_ADDRESSES[transfer.toUserAccount];
                const fromExchange = CEX_ADDRESSES[transfer.fromUserAccount];

                if (toExchange) {
                    cexConnections.add(toExchange);
                    cexTxCount++;
                }
                if (fromExchange) {
                    cexConnections.add(fromExchange);
                    cexTxCount++;
                }
            }

            // Check token transfers
            for (const transfer of tx.tokenTransfers || []) {
                const toExchange = CEX_ADDRESSES[transfer.toUserAccount];
                const fromExchange = CEX_ADDRESSES[transfer.fromUserAccount];

                if (toExchange) {
                    cexConnections.add(toExchange);
                    cexTxCount++;
                }
                if (fromExchange) {
                    cexConnections.add(fromExchange);
                    cexTxCount++;
                }
            }
        }

        // Score: 0 CEX = 0, 1 CEX = 40, 2+ CEX = 60+, many tx = higher
        let score = 0;
        if (cexConnections.size >= 1) score = 40;
        if (cexConnections.size >= 2) score = 60;
        if (cexConnections.size >= 3) score = 75;
        if (cexTxCount > 10) score = Math.min(95, score + 15);

        return {
            score,
            exchanges: Array.from(cexConnections),
            txCount: cexTxCount,
        };
    }

    /**
     * Analyze transaction activity patterns
     */
    private analyzeActivity(transactions: HeliusTransaction[]) {
        const txCount = transactions.length;

        // Calculate time span
        const timestamps = transactions.map(tx => tx.timestamp).filter(Boolean);

        // Handle edge case of no valid timestamps
        let daysActive = 1;
        let txPerDay = txCount;

        if (timestamps.length >= 2) {
            const oldest = Math.min(...timestamps);
            const newest = Math.max(...timestamps);
            daysActive = Math.max(1, Math.floor((newest - oldest) / (24 * 60 * 60)));
            txPerDay = txCount / daysActive;
        }

        // Improved scoring with better thresholds - start scoring from just 1 tx
        let score = 0;
        if (txCount >= 1) score = 10;
        if (txCount >= 5) score = 20;
        if (txCount >= 20) score = 35;
        if (txCount >= 50) score = 50;
        if (txCount >= 100) score = 65;
        if (txCount >= 250) score = 80;
        if (txCount >= 500) score = 90;
        if (txPerDay > 3) score = Math.min(95, score + 5);

        return {
            score,
            txCount,
            daysActive,
            txPerDay,
        };
    }

    /**
     * Analyze wallet clustering patterns
     */
    private analyzeClustering(transactions: HeliusTransaction[], selfAddress: string) {
        const addressCounts = new Map<string, number>();

        for (const tx of transactions) {
            // Count native transfer counterparties
            for (const transfer of tx.nativeTransfers || []) {
                const counterparty = transfer.toUserAccount === selfAddress
                    ? transfer.fromUserAccount
                    : transfer.toUserAccount;

                if (counterparty && counterparty !== selfAddress) {
                    addressCounts.set(counterparty, (addressCounts.get(counterparty) || 0) + 1);
                }
            }

            // Count token transfer counterparties
            for (const transfer of tx.tokenTransfers || []) {
                const counterparty = transfer.toUserAccount === selfAddress
                    ? transfer.fromUserAccount
                    : transfer.toUserAccount;

                if (counterparty && counterparty !== selfAddress) {
                    addressCounts.set(counterparty, (addressCounts.get(counterparty) || 0) + 1);
                }
            }
        }

        // Get top addresses by interaction count (expand to 30 for graph)
        const sorted = Array.from(addressCounts.entries())
            .sort((a, b) => b[1] - a[1]);

        const top10 = sorted.slice(0, 10);
        const top30 = sorted.slice(0, 30);

        const interactedCount = addressCounts.size;
        const topAddresses = top10.map(([addr]) => addr.slice(0, 8) + '...' + addr.slice(-4));

        // Create network nodes with types for graph visualization
        const networkNodes = top30.map(([addr, count]) => {
            const node: any = {
                address: addr,
                interactions: count,
            };

            // Classify address type
            if (CEX_ADDRESSES[addr]) {
                node.type = 'CEX';
                node.label = CEX_ADDRESSES[addr];
            } else if (PROTOCOL_ADDRESSES[addr]) {
                node.type = 'PROTOCOL';
                node.label = PROTOCOL_ADDRESSES[addr];
            } else if (addr.toLowerCase().includes('jupiter') || addr.toLowerCase().includes('orca') || addr.toLowerCase().includes('raydium')) {
                node.type = 'DEX';
                node.label = 'DEX Protocol';
            } else if (addr.includes('pump') || addr.includes('bonk') || count > 10) {
                node.type = 'MEMECOIN';
            } else {
                node.type = 'UNKNOWN';
            }

            return node;
        });

        // Score: more interactions = higher clustering exposure - start from 1
        let score = 0;
        if (interactedCount >= 1) score = 10;
        if (interactedCount >= 3) score = 20;
        if (interactedCount >= 10) score = 35;
        if (interactedCount >= 25) score = 50;
        if (interactedCount >= 50) score = 65;
        if (interactedCount >= 100) score = 80;
        if (interactedCount >= 200) score = 90;

        return {
            score,
            data: {
                interactedCount,
                topAddresses,
                networkNodes,
            },
        };
    }


    /**
     * Analyze identity exposure (ENHANCED - FREE using existing APIs)
     */
    private analyzeIdentity(assets: HeliusAsset[], transactions: HeliusTransaction[]) {
        let hasNFTs = false;
        let hasNamedNFTs = false;
        let hasProfileNFT = false;
        let nftCount = 0;
        let revealingNFTs: string[] = [];
        let revealingTokens: string[] = [];
        let domains: string[] = [];

        // ENHANCED NFT ANALYSIS
        for (const asset of assets) {
            if (asset.interface === 'V1_NFT' || asset.interface === 'ProgrammableNFT') {
                hasNFTs = true;
                nftCount++;

                const name = (asset as any).content?.metadata?.name || '';
                const description = (asset as any).content?.metadata?.description || '';
                const symbol = (asset as any).content?.metadata?.symbol || '';
                const combinedText = `${name} ${description} ${symbol}`.toLowerCase();

                // Check for revealing NFT metadata
                const revealingPatterns = [
                    '.sol', '.abc', '.bonk', '.poor', // Domain NFTs
                    'profile', 'pfp', 'avatar', // Profile pics
                    'name', 'identity', 'id', // Identity tokens
                    'membership', 'pass', 'access', // Membership tokens
                    'verified', 'kyc', 'badge' // Verification badges
                ];

                for (const pattern of revealingPatterns) {
                    if (combinedText.includes(pattern)) {
                        hasNamedNFTs = true;
                        if (pattern.includes('profile') || pattern === 'pfp' || pattern === 'avatar') {
                            hasProfileNFT = true;
                        }
                        if (pattern.startsWith('.')) {
                            domains.push(name);
                        }
                        revealingNFTs.push(name);
                        break;
                    }
                }

                // Check NFT attributes for PII
                const attributes = (asset as any).content?.metadata?.attributes || [];
                for (const attr of attributes) {
                    const attrValue = String(attr.value || '').toLowerCase();
                    if (attrValue.includes('twitter') || attrValue.includes('discord') ||
                        attrValue.includes('telegram') || attrValue.includes('@')) {
                        hasNamedNFTs = true;
                        revealingNFTs.push(`${name} (has social links)`);
                        break;
                    }
                }
            }

            // ENHANCED TOKEN NAME ANALYSIS
            if (asset.token_info) {
                const tokenName = (asset as any).token_info?.symbol || '';
                const tokenNameLower = tokenName.toLowerCase();

                // Detect revealing token names
                const revealingTokenPatterns = [
                    'dao', 'governance', 'vote', // DAO membership
                    'fan', 'creator', 'community', // Fan/creator tokens
                    'team', 'member', 'holder', // Team tokens
                    'early', 'founder', 'genesis', // Early adopter tokens
                    'verified', 'kyc', 'whitelist' // Verification tokens
                ];

                for (const pattern of revealingTokenPatterns) {
                    if (tokenNameLower.includes(pattern)) {
                        revealingTokens.push(tokenName);
                        break;
                    }
                }
            }
        }

        // ENHANCED DOMAIN DETECTION (all Solana domain services)
        const domainPatterns = [
            '.sol',      // Solana Name Service (main)
            '.abc',      // AllDomains
            '.bonk',     // Bonk domains
            '.poor',     // Poor domains
            '.backpack', // Backpack domains
            '.glow',     // Glow domains
        ];

        const hasDomains = transactions.some(tx => {
            const desc = tx.description?.toLowerCase() || '';
            const type = tx.type?.toLowerCase() || '';

            // Check transaction description and type
            for (const pattern of domainPatterns) {
                if (desc.includes(pattern) || type.includes(pattern)) {
                    // Extract domain name if possible
                    const match = desc.match(/(\w+)(\.sol|\.abc|\.bonk|\.poor|\.backpack|\.glow)/);
                    if (match) {
                        domains.push(match[0]);
                    }
                    return true;
                }
            }

            // Check memo fields for domains (if available)
            if ((tx as any).events?.nft) {
                const nftDesc = JSON.stringify((tx as any).events.nft).toLowerCase();
                if (domainPatterns.some(p => nftDesc.includes(p))) {
                    return true;
                }
            }

            return false;
        });

        // TRANSACTION PATTERN ANALYSIS  
        // Check for interactions with known entities (using Helius labels)
        const knownEntityInteractions = transactions.filter(tx => {
            // Helius provides source/destination info
            const desc = tx.description?.toLowerCase() || '';
            return desc.includes('coinbase') || desc.includes('binance') ||
                desc.includes('kraken') || desc.includes('ftx') ||
                desc.includes('opensea') || desc.includes('magic eden');
        }).length;

        // ENHANCED SCORING
        let score = 0;

        // Base NFT ownership
        if (hasNFTs) score += 15;
        if (nftCount > 5) score += 10;
        if (nftCount > 20) score += 15;

        // Revealing NFTs (highest risk!)
        if (hasNamedNFTs) score += 20;
        if (hasProfileNFT) score += 15;
        if (revealingNFTs.length > 0) score += Math.min(revealingNFTs.length * 5, 25);

        // Domain ownership (very high risk!)
        if (hasDomains) score += 30;
        if (domains.length > 0) score += Math.min(domains.length * 10, 40);

        // Revealing tokens
        if (revealingTokens.length > 0) score += Math.min(revealingTokens.length * 5, 20);

        // Known entity interactions
        if (knownEntityInteractions > 0) score += Math.min(knownEntityInteractions * 3, 15);

        // Cap at 100
        score = Math.min(score, 100);

        return {
            score,
            hasNFTs,
            hasSNS: hasDomains,
            nftCount,
            hasProfileNFT,
            revealingNFTs: revealingNFTs.slice(0, 5), // Top 5
            revealingTokens: revealingTokens.slice(0, 5),
            domains: domains.slice(0, 3), // Top 3 domains
            knownEntityInteractions,
        };
    }

    /**
     * Analyze financial exposure
     */
    private analyzeFinancial(assets: HeliusAsset[], solBalance: number, pnlData: BirdeyeWalletPnL | null) {
        // Calculate net worth
        let netWorth = solBalance * 200; // Rough SOL price estimate

        for (const asset of assets) {
            if (asset.token_info?.price_info?.total_price) {
                netWorth += asset.token_info.price_info.total_price;
            }
        }

        // Use Birdeye data if available
        if (pnlData) {
            const holdingValue = pnlData.tokens.reduce((sum, t) => sum + (t.holdingValue || 0), 0);
            if (holdingValue > 0) {
                netWorth = holdingValue + solBalance * 200;
            }
        }

        // Improved scoring thresholds - start from any balance
        let score = 0;
        if (netWorth > 0) score = 10;
        if (netWorth >= 10) score = 20;
        if (netWorth >= 100) score = 35;
        if (netWorth >= 1000) score = 50;
        if (netWorth >= 10000) score = 65;
        if (netWorth >= 50000) score = 80;
        if (netWorth >= 100000) score = 90;

        return {
            score,
            netWorth,
        };
    }

    /**
     * Generate human-readable risk descriptions
     */
    private generateRisks(
        cexAnalysis: { exchanges: string[]; txCount: number },
        activityAnalysis: { txCount: number; daysActive: number },
        clusteringAnalysis: { data: ClusteringData },
        identityAnalysis: { hasNFTs: boolean; hasSNS: boolean },
        snsDomains: string[] = []
    ): string[] {
        const risks: string[] = [];

        if (cexAnalysis.exchanges.length > 0) {
            risks.push(`Direct transfers to/from ${cexAnalysis.exchanges.join(', ')} detected - potential KYC linkage`);
        }

        if (activityAnalysis.txCount > 100) {
            risks.push(`High transaction volume (${activityAnalysis.txCount} txs) creates detailed activity fingerprint`);
        }

        if (clusteringAnalysis.data.interactedCount > 50) {
            risks.push(`Interacted with ${clusteringAnalysis.data.interactedCount} unique addresses - clustering analysis possible`);
        }

        // SNS domains from API lookup (most reliable)
        if (snsDomains.length > 0) {
            risks.push(`SNS domains detected (${snsDomains.map(d => d + '.sol').join(', ')}) - direct identity linkage. Anyone can search this domain on X or Google to find you.`);
        } else if (identityAnalysis.hasSNS) {
            risks.push('SNS domain ownership detected - potential identity correlation');
        }

        if (identityAnalysis.hasNFTs) {
            risks.push('NFT holdings may contain identifying metadata');
        }

        if (activityAnalysis.daysActive > 365) {
            risks.push(`Long wallet history (${Math.floor(activityAnalysis.daysActive / 30)} months) - extensive behavioral pattern available`);
        }

        if (risks.length === 0) {
            risks.push('Limited on-chain activity - low exposure profile');
        }

        return risks;
    }

    /**
     * Generate transaction summaries for display
     */
    private generateTxSummaries(transactions: HeliusTransaction[]): TransactionSummary[] {
        return transactions.map(tx => {
            const date = tx.timestamp
                ? new Date(tx.timestamp * 1000).toISOString().split('T')[0]
                : 'Unknown';

            // Calculate rough USD amount from native transfers
            let amountUsd = 0;
            for (const transfer of tx.nativeTransfers || []) {
                amountUsd += (transfer.amount / 1e9) * 200; // Rough SOL price
            }

            return {
                date,
                type: tx.type || 'UNKNOWN',
                amountUsd: Math.round(amountUsd * 100) / 100,
                description: tx.description || `${tx.type} transaction`,
            };
        });
    }
}

export const exposureAnalyzer = new ExposureAnalyzer();
