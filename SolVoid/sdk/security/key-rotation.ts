import { Keypair } from '@solana/web3.js';
import { Buffer } from 'buffer';
import * as crypto from 'crypto';

/**
 * Key rotation configuration
 */
export interface KeyRotationConfig {
    maxKeyAge: number; // Maximum age in milliseconds
    rotationInterval: number; // Check interval in milliseconds
    backupEnabled: boolean;
    encryptionEnabled: boolean;
}

/**
 * Key metadata for rotation tracking
 */
export interface KeyMetadata {
    keyId: string;
    publicKey: string;
    createdAt: number;
    lastUsed: number;
    usageCount: number;
    isRetired: boolean;
    retiredAt?: number;
}

/**
 * Encrypted key backup
 */
export interface EncryptedKeyBackup {
    keyId: string;
    encryptedPrivateKey: string;
    publicKey: string;
    createdAt: number;
    encryptionAlgorithm: string;
}

/**
 * Key Rotation Manager
 * Provides secure key lifecycle management with automatic rotation
 */
export class KeyRotationManager {
    private currentKey: Keypair;
    private keyHistory: Map<string, KeyMetadata> = new Map();
    private backups: Map<string, EncryptedKeyBackup> = new Map();
    private config: KeyRotationConfig;
    private rotationTimer?: NodeJS.Timeout;
    
    constructor(config: Partial<KeyRotationConfig> = {}) {
        this.config = {
            maxKeyAge: 24 * 60 * 60 * 1000, // 24 hours
            rotationInterval: 60 * 60 * 1000, // 1 hour
            backupEnabled: true,
            encryptionEnabled: true,
            ...config
        };
        
        this.currentKey = Keypair.generate();
        this.initializeCurrentKey();
        this.startRotationTimer();
    }
    
    /**
     * Initialize current key metadata
     */
    private initializeCurrentKey(): void {
        const keyId = this.generateKeyId();
        const metadata: KeyMetadata = {
            keyId,
            publicKey: this.currentKey.publicKey.toBase58(),
            createdAt: Date.now(),
            lastUsed: Date.now(),
            usageCount: 0,
            isRetired: false
        };
        
        this.keyHistory.set(keyId, metadata);
        
        if (this.config.backupEnabled) {
            this.createBackup(keyId);
        }
    }
    
    /**
     * Generate unique key identifier
     */
    private generateKeyId(): string {
        const timestamp = Date.now().toString(36);
        const random = crypto.randomBytes(8).toString('hex');
        return `key_${timestamp}_${random}`;
    }
    
    /**
     * Start automatic rotation timer
     */
    private startRotationTimer(): void {
        this.rotationTimer = setInterval(() => {
            this.checkAndRotate();
        }, this.config.rotationInterval);
    }
    
    /**
     * Check if key needs rotation and perform if necessary
     */
    private checkAndRotate(): void {
        const currentMetadata = this.getCurrentKeyMetadata();
        
        if (this.shouldRotate(currentMetadata)) {
            this.rotateKey();
        }
    }
    
    /**
     * Determine if key should be rotated
     */
    private shouldRotate(metadata: KeyMetadata): boolean {
        const now = Date.now();
        const age = now - metadata.createdAt;
        
        // Rotate based on age
        if (age > this.config.maxKeyAge) {
            return true;
        }
        
        // Rotate based on usage (optional: every 1000 uses)
        if (metadata.usageCount > 1000) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Perform key rotation
     */
    public rotateKey(): Keypair {
        // Retire current key
        const currentMetadata = this.getCurrentKeyMetadata();
        currentMetadata.isRetired = true;
        currentMetadata.retiredAt = Date.now();
        
        // Generate new key
        this.currentKey = Keypair.generate();
        this.initializeCurrentKey();
        
        console.log(`Key rotated: ${currentMetadata.keyId} -> ${this.getCurrentKeyMetadata().keyId}`);
        
        return this.currentKey;
    }
    
    /**
     * Get current key metadata
     */
    private getCurrentKeyMetadata(): KeyMetadata {
        const currentKeyId = Array.from(this.keyHistory.values())
            .find(metadata => !metadata.isRetired)?.keyId;
        
        if (!currentKeyId) {
            throw new Error('No active key found');
        }
        
        return this.keyHistory.get(currentKeyId)!;
    }
    
    /**
     * Get current keypair
     */
    public getCurrentKey(): Keypair {
        this.updateKeyUsage();
        return this.currentKey;
    }
    
    /**
     * Update key usage statistics
     */
    private updateKeyUsage(): void {
        const metadata = this.getCurrentKeyMetadata();
        metadata.lastUsed = Date.now();
        metadata.usageCount++;
    }
    
    /**
     * Create encrypted backup of private key
     */
    private createBackup(keyId: string): void {
        if (!this.config.encryptionEnabled) {
            return;
        }
        
        const metadata = this.keyHistory.get(keyId);
        if (!metadata) {
            throw new Error(`Key ${keyId} not found`);
        }
        
        // Find the keypair for this keyId
        const keypair = this.findKeypairById(keyId);
        if (!keypair) {
            throw new Error(`Keypair for ${keyId} not found`);
        }
        
        // Generate encryption key from environment or secure source
        const encryptionKey = this.getEncryptionKey();
        
        // Encrypt private key
        const privateKeyBytes = keypair.secretKey;
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
        
        let encrypted = cipher.update(privateKeyBytes);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        
        const backup: EncryptedKeyBackup = {
            keyId,
            encryptedPrivateKey: Buffer.concat([iv, encrypted]).toString('base64'),
            publicKey: metadata.publicKey,
            createdAt: metadata.createdAt,
            encryptionAlgorithm: 'aes-256-cbc'
        };
        
        this.backups.set(keyId, backup);
    }
    
    /**
     * Get encryption key (in production, use secure key management)
     */
    private getEncryptionKey(): Buffer {
        // In production, use proper key management like AWS KMS, HashiCorp Vault, etc.
        const envKey = process.env.SOLVOID_ENCRYPTION_KEY;
        if (envKey) {
            return Buffer.from(envKey, 'hex');
        }
        
        // Fallback: derive from system-specific entropy
        return crypto.createHash('sha256')
            .update('solvoid-key-rotation-backup')
            .update(crypto.randomBytes(32))
            .digest();
    }
    
    /**
     * Find keypair by ID (simplified implementation)
     */
    private findKeypairById(keyId: string): Keypair | null {
        // In a real implementation, you'd store keypairs securely
        // For now, we only have access to the current key
        const currentMetadata = this.getCurrentKeyMetadata();
        if (currentMetadata.keyId === keyId) {
            return this.currentKey;
        }
        
        return null;
    }
    
    /**
     * Restore key from backup
     */
    public restoreFromBackup(keyId: string, encryptionKey?: string): Keypair {
        const backup = this.backups.get(keyId);
        if (!backup) {
            throw new Error(`Backup for key ${keyId} not found`);
        }
        
        const key = encryptionKey || this.getEncryptionKey().toString('hex');
        const encryptedData = Buffer.from(backup.encryptedPrivateKey, 'base64');
        
        const iv = encryptedData.slice(0, 16);
        const encrypted = encryptedData.slice(16);
        
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        return Keypair.fromSecretKey(decrypted);
    }
    
    /**
     * Get key metadata by public key
     */
    public getKeyMetadata(publicKey: string): KeyMetadata | undefined {
        return Array.from(this.keyHistory.values())
            .find(metadata => metadata.publicKey === publicKey);
    }
    
    /**
     * Get all key metadata
     */
    public getAllKeyMetadata(): KeyMetadata[] {
        return Array.from(this.keyHistory.values());
    }
    
    /**
     * Get backup information
     */
    public getBackupInfo(): EncryptedKeyBackup[] {
        return Array.from(this.backups.values());
    }
    
    /**
     * Force immediate rotation
     */
    public forceRotation(): Keypair {
        return this.rotateKey();
    }
    
    /**
     * Stop rotation timer
     */
    public stopRotation(): void {
        if (this.rotationTimer) {
            clearInterval(this.rotationTimer);
            this.rotationTimer = undefined;
        }
    }
    
    /**
     * Resume rotation timer
     */
    public resumeRotation(): void {
        if (!this.rotationTimer) {
            this.startRotationTimer();
        }
    }
    
    /**
     * Cleanup old keys and backups
     */
    public cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): void {
        const now = Date.now();
        const cutoff = now - maxAge;
        
        // Remove old keys
        for (const [keyId, metadata] of this.keyHistory.entries()) {
            if (metadata.createdAt < cutoff && metadata.isRetired) {
                this.keyHistory.delete(keyId);
                this.backups.delete(keyId);
            }
        }
    }
    
    /**
     * Export configuration for persistence
     */
    public exportConfig(): {
        config: KeyRotationConfig;
        keyHistory: KeyMetadata[];
        backups: EncryptedKeyBackup[];
    } {
        return {
            config: this.config,
            keyHistory: Array.from(this.keyHistory.values()),
            backups: Array.from(this.backups.values())
        };
    }
    
    /**
     * Import configuration
     */
    public importConfig(data: {
        config: KeyRotationConfig;
        keyHistory: KeyMetadata[];
        backups: EncryptedKeyBackup[];
    }): void {
        this.config = data.config;
        this.keyHistory.clear();
        this.backups.clear();
        
        data.keyHistory.forEach(metadata => {
            this.keyHistory.set(metadata.keyId, metadata);
        });
        
        data.backups.forEach(backup => {
            this.backups.set(backup.keyId, backup);
        });
        
        // Restart rotation with new config
        this.stopRotation();
        this.startRotationTimer();
    }
    
    /**
     * Destroy sensitive data
     */
    public destroy(): void {
        this.stopRotation();
        this.keyHistory.clear();
        this.backups.clear();
        
        // Zero out current key
        this.currentKey.secretKey.fill(0);
    }
}

/**
 * Singleton instance for global key management
 */
let globalKeyManager: KeyRotationManager | null = null;

/**
 * Get global key manager instance
 */
export function getKeyManager(config?: Partial<KeyRotationConfig>): KeyRotationManager {
    if (!globalKeyManager) {
        globalKeyManager = new KeyRotationManager(config);
    }
    return globalKeyManager;
}

/**
 * Destroy global key manager
 */
export function destroyKeyManager(): void {
    if (globalKeyManager) {
        globalKeyManager.destroy();
        globalKeyManager = null;
    }
}
