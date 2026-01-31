import { Keypair } from '@solana/web3.js';

// Dotenv handled at top level

export interface EnvConfig {
    rpcUrl: string;
    walletKey?: string;
    historyFile?: string;
    jitoAuthToken?: string;
}

export class ConfigLoader {
    private config: EnvConfig;

    constructor() {
        this.config = {
            rpcUrl: process.env.RPC_URL || "https://api.mainnet-beta.solana.com",
            walletKey: process.env.WALLET_KEY,
            historyFile: process.env.PRIVACY_HISTORY_FILE,
            jitoAuthToken: process.env.JITO_AUTH_TOKEN
        };
    }

    public getRpcUrl(): string {
        return this.config.rpcUrl;
    }

    public getSigner(): Keypair | null {
        if (!this.config.walletKey) return null;

        try {
            // Try different formats
            // 1. JSON Array "[1,2,3...]"
            if (this.config.walletKey.startsWith('[')) {
                return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(this.config.walletKey)));
            }
            // 2. BS58 String
            const bs58 = require('bs58');
            return Keypair.fromSecretKey(bs58.decode(this.config.walletKey));
        } catch {
            console.warn("Failed to parse WALLET_KEY from .env");
            return null;
        }
    }

    public getJitoAuth(): string | undefined {
        return this.config.jitoAuthToken;
    }
}
