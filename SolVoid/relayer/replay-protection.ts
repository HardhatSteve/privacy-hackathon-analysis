import crypto from 'crypto';

export interface NonceEntry {
    publicKey: string;
    nonce: number;
    timestamp: number;
    txHash: string;
}

export interface TransactionData {
    publicKey: string;
    nonce: number;
    timestamp: number;
    txHash: string;
    signature: string;
    instructions: any[];
}

export interface ReplayCacheEntry {
    publicKey: string;
    nonce: number;
    txHash: string;
    timestamp: number;
}

export class ReplayProtection {
    private nonceCache: Map<string, number> = new Map(); // publicKey -> current nonce
    private replayCache: Map<string, ReplayCacheEntry> = new Map(); // (publicKey:nonce:txHash) -> entry
    private expirationWindow: number = 10 * 60 * 1000; // 10 minutes in milliseconds
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.startCleanupTask();
    }

    /**
     * Initialize nonce for a user (called during registration)
     */
    public initializeNonce(publicKey: string): number {
        const nonce = 1;
        this.nonceCache.set(publicKey, nonce);
        console.log(`Initialized nonce ${nonce} for user ${publicKey}`);
        return nonce;
    }

    /**
     * Get current nonce for a user
     */
    public getCurrentNonce(publicKey: string): number {
        return this.nonceCache.get(publicKey) || 0;
    }

    /**
     * Validate and increment nonce for transaction
     */
    public validateAndIncrementNonce(publicKey: string, expectedNonce: number): boolean {
        const currentNonce = this.nonceCache.get(publicKey) || 0;
        
        if (expectedNonce !== currentNonce + 1) {
            console.log(`Invalid nonce for user ${publicKey}: expected ${currentNonce + 1}, got ${expectedNonce}`);
            return false;
        }
        
        this.nonceCache.set(publicKey, expectedNonce);
        console.log(`Incremented nonce to ${expectedNonce} for user ${publicKey}`);
        return true;
    }

    /**
     * Check if transaction is expired
     */
    public isTransactionExpired(timestamp: number): boolean {
        const now = Date.now();
        const age = now - timestamp;
        return age > this.expirationWindow;
    }

    /**
     * Create cache key for replay protection
     */
    private createCacheKey(publicKey: string, nonce: number, txHash: string): string {
        return `${publicKey}:${nonce}:${txHash}`;
    }

    /**
     * Check if transaction is in replay cache
     */
    public isTransactionReplayed(publicKey: string, nonce: number, txHash: string): boolean {
        const cacheKey = this.createCacheKey(publicKey, nonce, txHash);
        const entry = this.replayCache.get(cacheKey);
        
        if (!entry) {
            return false;
        }
        
        // Check if transaction is expired
        if (this.isTransactionExpired(entry.timestamp)) {
            this.replayCache.delete(cacheKey);
            return false;
        }
        
        return true;
    }

    /**
     * Add transaction to replay cache
     */
    public addTransactionToCache(publicKey: string, nonce: number, txHash: string): void {
        const cacheKey = this.createCacheKey(publicKey, nonce, txHash);
        const entry: ReplayCacheEntry = {
            publicKey,
            nonce,
            txHash,
            timestamp: Date.now()
        };
        
        this.replayCache.set(cacheKey, entry);
        console.log(`Added transaction to replay cache: ${cacheKey}`);
    }

    /**
     * Validate complete transaction data
     */
    public validateTransaction(txData: TransactionData): { isValid: boolean; error: string } {
        // Check timestamp expiration
        if (this.isTransactionExpired(txData.timestamp)) {
            return {
                isValid: false,
                error: 'Transaction has expired'
            };
        }

        // Check nonce sequence
        if (!this.validateAndIncrementNonce(txData.publicKey, txData.nonce)) {
            return {
                isValid: false,
                error: `Invalid nonce sequence. Expected ${this.getCurrentNonce(txData.publicKey) + 1}, got ${txData.nonce}`
            };
        }

        // Check replay cache
        if (this.isTransactionReplayed(txData.publicKey, txData.nonce, txData.txHash)) {
            return {
                isValid: false,
                error: 'Transaction has already been processed'
            };
        }

        // Add to replay cache
        this.addTransactionToCache(txData.publicKey, txData.nonce, txData.txHash);

        return {
            isValid: true,
            error: ''
        };
    }

    /**
     * Get nonce statistics for a user
     */
    public getNonceStats(publicKey: string): { currentNonce: number; totalTransactions: number } {
        const currentNonce = this.getCurrentNonce(publicKey);
        let totalTransactions = 0;
        
        // Count transactions in cache for this user
        for (const [key, entry] of this.replayCache.entries()) {
            if (key.startsWith(`${publicKey}:`)) {
                totalTransactions++;
            }
        }
        
        return {
            currentNonce,
            totalTransactions
        };
    }

    /**
     * Clean up old entries from replay cache
     */
    private cleanupExpiredEntries(): void {
        const now = Date.now();
        const expiredKeys: string[] = [];
        
        for (const [key, entry] of this.replayCache.entries()) {
            if (this.isTransactionExpired(entry.timestamp)) {
                expiredKeys.push(key);
            }
        }
        
        for (const key of expiredKeys) {
            this.replayCache.delete(key);
        }
        
        if (expiredKeys.length > 0) {
            console.log(`Cleaned up ${expiredKeys.length} expired replay cache entries`);
        }
    }

    /**
     * Start cleanup task
     */
    private startCleanupTask(): void {
        // Run cleanup every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredEntries();
        }, 5 * 60 * 1000);
    }

    /**
     * Stop cleanup task
     */
    public stopCleanupTask(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    /**
     * Get cache statistics
     */
    public getCacheStats() {
        return {
            totalEntries: this.replayCache.size,
            nonceCacheSize: this.nonceCache.size,
            expirationWindow: this.expirationWindow
        };
    }

    /**
     * Clear all cache data (for testing)
     */
    public clearCache(): void {
        this.nonceCache.clear();
        this.replayCache.clear();
        console.log('Cleared all replay protection cache data');
    }
}
