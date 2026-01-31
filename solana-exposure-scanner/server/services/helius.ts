// Helius API Service
// Provides methods to fetch Solana blockchain data

export type SolanaNetwork = 'mainnet' | 'devnet';

const HELIUS_ENDPOINTS = {
    mainnet: {
        api: 'https://api.helius.xyz',
        rpc: 'https://mainnet.helius-rpc.com'
    },
    devnet: {
        api: 'https://api-devnet.helius.xyz',
        rpc: 'https://devnet.helius-rpc.com'
    }
};

export interface HeliusTransaction {
    signature: string;
    type: string;
    source: string;
    fee: number;
    feePayer: string;
    timestamp: number;
    slot: number;
    nativeTransfers?: Array<{
        fromUserAccount: string;
        toUserAccount: string;
        amount: number;
    }>;
    tokenTransfers?: Array<{
        fromUserAccount: string;
        toUserAccount: string;
        fromTokenAccount: string;
        toTokenAccount: string;
        tokenAmount: number;
        mint: string;
        tokenStandard: string;
    }>;
    accountData?: Array<{
        account: string;
        nativeBalanceChange: number;
        tokenBalanceChanges: Array<{
            mint: string;
            rawTokenAmount: {
                tokenAmount: string;
                decimals: number;
            };
        }>;
    }>;
    description?: string;
}

export interface HeliusAsset {
    id: string;
    content?: {
        json_uri?: string;
        metadata?: {
            name?: string;
            symbol?: string;
        };
    };
    token_info?: {
        balance: number;
        decimals: number;
        price_info?: {
            price_per_token: number;
            total_price: number;
        };
    };
    interface?: string;
}

export interface HeliusBalanceResponse {
    nativeBalance: number;
    tokens: Array<{
        mint: string;
        amount: number;
        decimals: number;
        tokenAccount: string;
    }>;
}

class HeliusService {
    private apiKey: string;
    private network: SolanaNetwork;

    constructor(network: SolanaNetwork = 'mainnet') {
        this.apiKey = process.env.HELIUS_API_KEY || '';
        this.network = network;
        if (!this.apiKey) {
            console.warn('HELIUS_API_KEY not set. Helius API calls will fail.');
        }
    }

    setNetwork(network: SolanaNetwork) {
        this.network = network;
    }

    getNetwork(): SolanaNetwork {
        return this.network;
    }

    private get apiBase() {
        return HELIUS_ENDPOINTS[this.network].api;
    }

    private get rpcBase() {
        return HELIUS_ENDPOINTS[this.network].rpc;
    }

    /**
     * Get enhanced transaction history for an address
     */
    async getTransactionHistory(address: string, limit: number = 100): Promise<HeliusTransaction[]> {
        const url = `${this.apiBase}/v0/addresses/${address}/transactions?api-key=${this.apiKey}&limit=${limit}`;

        const response = await fetch(url);

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Helius API error: ${response.status} - ${error}`);
        }

        return response.json();
    }

    /**
     * Get all assets owned by an address using DAS API
     */
    async getAssetsByOwner(address: string): Promise<HeliusAsset[]> {
        const url = `${this.rpcBase}/?api-key=${this.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'helius-assets',
                method: 'getAssetsByOwner',
                params: {
                    ownerAddress: address,
                    page: 1,
                    limit: 1000,
                    displayOptions: {
                        showFungible: true,
                        showNativeBalance: true,
                    },
                },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Helius RPC error: ${response.status} - ${error}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(`Helius RPC error: ${data.error.message}`);
        }

        return data.result?.items || [];
    }

    /**
     * Get native SOL balance
     */
    async getBalance(address: string): Promise<number> {
        const url = `${this.rpcBase}/?api-key=${this.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'helius-balance',
                method: 'getBalance',
                params: [address],
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Helius RPC error: ${response.status} - ${error}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(`Helius RPC error: ${data.error.message}`);
        }

        // Convert lamports to SOL
        return (data.result?.value || 0) / 1e9;
    }

    /**
     * Parse specific transaction signatures
     */
    async parseTransactions(signatures: string[]): Promise<HeliusTransaction[]> {
        const url = `${this.apiBase}/v0/transactions?api-key=${this.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                transactions: signatures,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Helius API error: ${response.status} - ${error}`);
        }

        return response.json();
    }
}

export const heliusService = new HeliusService();
