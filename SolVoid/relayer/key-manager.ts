import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import { Keypair } from '@solana/web3.js';
import nacl from 'tweetnacl';

export interface KeyPairData {
    publicKey: string;
    privateKey: string;
    createdAt: number;
    lastRotated?: number;
    rotationSignature?: string;
    previousPublicKey?: string;
}

export interface KeyRotationData {
    oldPublicKey: string;
    newPublicKey: string;
    rotationSignature: string;
    timestamp: number;
    transitionPeriod: number; // seconds
}

export class KeyManager {
    private keypair: KeyPairData;
    private keyFilePath: string;
    private storageType: 'file' | 'env' | 'aws' | 'gcp' | 'hsm';
    private encryptionKey: string;

    constructor(storageType: 'file' | 'env' | 'aws' | 'gcp' | 'hsm' = 'file') {
        this.storageType = storageType;
        this.keyFilePath = path.join(process.cwd(), '.relayer-keys.json');
        this.encryptionKey = process.env.RELAYER_KEY_ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
        this.keypair = this.loadOrGenerateKeysSync();
    }

    private loadOrGenerateKeysSync(): KeyPairData {
        try {
            switch (this.storageType) {
                case 'file':
                    return this.loadFromFileSync();
                case 'env':
                    return this.loadFromEnvSync();
                case 'aws':
                    // AWS and GCP require async, fallback to file for now
                    console.log('AWS/GCP storage requires async initialization, using file storage');
                    return this.loadFromFileSync();
                case 'gcp':
                    console.log('AWS/GCP storage requires async initialization, using file storage');
                    return this.loadFromFileSync();
                case 'hsm':
                    console.log('HSM storage requires async initialization, using file storage');
                    return this.loadFromFileSync();
                default:
                    throw new Error(`Unsupported storage type: ${this.storageType}`);
            }
        } catch (error) {
            console.log('Failed to load existing keys, generating new ones:', error);
            return this.generateNewKeysSync();
        }
    }

    private loadFromFileSync(): KeyPairData {
        if (!fs.existsSync(this.keyFilePath)) {
            throw new Error('Key file does not exist');
        }

        const encryptedData = fs.readFileSync(this.keyFilePath, 'utf8');
        const decryptedData = this.decryptData(encryptedData);
        return JSON.parse(decryptedData) as KeyPairData;
    }

    private loadFromEnvSync(): KeyPairData {
        const privateKey = process.env.RELAYER_PRIVATE_KEY;
        const publicKey = process.env.RELAYER_PUBLIC_KEY;

        if (!privateKey || !publicKey) {
            throw new Error('Relayer keys not found in environment variables');
        }

        return {
            publicKey,
            privateKey,
            createdAt: Date.now()
        };
    }

    private generateNewKeysSync(): KeyPairData {
        const keypair = Keypair.generate();
        
        const keyData: KeyPairData = {
            publicKey: keypair.publicKey.toBase58(),
            privateKey: Buffer.from(keypair.secretKey).toString('hex'),
            createdAt: Date.now()
        };

        this.saveKeysSync(keyData);
        return keyData;
    }

    private saveKeysSync(keyData: KeyPairData): void {
        switch (this.storageType) {
            case 'file':
                this.saveToFileSync(keyData);
                break;
            case 'env':
                this.saveToEnvSync(keyData);
                break;
            case 'aws':
            case 'gcp':
            case 'hsm':
                console.log('Async storage types require manual setup');
                break;
        }
    }

    private saveToFileSync(keyData: KeyPairData): void {
        const encryptedData = this.encryptData(JSON.stringify(keyData));
        fs.writeFileSync(this.keyFilePath, encryptedData, 'utf8');
        console.log('Keys saved to encrypted file:', this.keyFilePath);
    }

    private saveToEnvSync(keyData: KeyPairData): void {
        console.log('Keys should be set in environment variables:');
        console.log(`RELAYER_PRIVATE_KEY=${keyData.privateKey}`);
        console.log(`RELAYER_PUBLIC_KEY=${keyData.publicKey}`);
    }

    private async loadFromFile(): Promise<KeyPairData> {
        if (!fs.existsSync(this.keyFilePath)) {
            throw new Error('Key file does not exist');
        }

        const encryptedData = fs.readFileSync(this.keyFilePath, 'utf8');
        const decryptedData = this.decryptData(encryptedData);
        return JSON.parse(decryptedData) as KeyPairData;
    }

    private async loadFromEnv(): Promise<KeyPairData> {
        const privateKey = process.env.RELAYER_PRIVATE_KEY;
        const publicKey = process.env.RELAYER_PUBLIC_KEY;

        if (!privateKey || !publicKey) {
            throw new Error('Relayer keys not found in environment variables');
        }

        return {
            publicKey,
            privateKey,
            createdAt: Date.now()
        };
    }

    private async loadFromAWS(): Promise<KeyPairData> {
        // Implementation for AWS Secrets Manager
        const AWS = require('aws-sdk');
        const secretsManager = new AWS.SecretsManager();
        
        try {
            const secretValue = await secretsManager.getSecretValue({
                SecretId: process.env.AWS_RELAYER_KEY_SECRET_NAME || 'relayer-keys'
            }).promise();
            
            const decryptedData = this.decryptData(secretValue.SecretString);
            return JSON.parse(decryptedData) as KeyPairData;
        } catch (error) {
            throw new Error(`Failed to load keys from AWS Secrets Manager: ${error}`);
        }
    }

    private async loadFromGCP(): Promise<KeyPairData> {
        // Implementation for GCP Secret Manager
        const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
        const client = new SecretManagerServiceClient();
        
        try {
            const [version] = await client.accessSecretVersion({
                name: `projects/${process.env.GCP_PROJECT_ID}/secrets/${process.env.GCP_RELAYER_KEY_SECRET_NAME || 'relayer-keys'}/versions/latest`
            });
            
            const decryptedData = this.decryptData(version.payload.data.toString());
            return JSON.parse(decryptedData) as KeyPairData;
        } catch (error) {
            throw new Error(`Failed to load keys from GCP Secret Manager: ${error}`);
        }
    }

    private async loadFromHSM(): Promise<KeyPairData> {
        // Implementation for Hardware Security Module
        // This would integrate with HSM providers like AWS CloudHSM, Azure Key Vault, etc.
        throw new Error('HSM integration not implemented yet');
    }

    private async generateNewKeys(): Promise<KeyPairData> {
        const keypair = Keypair.generate();
        
        const keyData: KeyPairData = {
            publicKey: keypair.publicKey.toBase58(),
            privateKey: Buffer.from(keypair.secretKey).toString('hex'),
            createdAt: Date.now()
        };

        await this.saveKeys(keyData);
        return keyData;
    }

    private async saveKeys(keyData: KeyPairData): Promise<void> {
        switch (this.storageType) {
            case 'file':
                await this.saveToFile(keyData);
                break;
            case 'env':
                await this.saveToEnv(keyData);
                break;
            case 'aws':
                await this.saveToAWS(keyData);
                break;
            case 'gcp':
                await this.saveToGCP(keyData);
                break;
            case 'hsm':
                await this.saveToHSM(keyData);
                break;
        }
    }

    private async saveToFile(keyData: KeyPairData): Promise<void> {
        const encryptedData = this.encryptData(JSON.stringify(keyData));
        fs.writeFileSync(this.keyFilePath, encryptedData, 'utf8');
        console.log('Keys saved to encrypted file:', this.keyFilePath);
    }

    private async saveToEnv(keyData: KeyPairData): Promise<void> {
        console.log('Keys should be set in environment variables:');
        console.log(`RELAYER_PRIVATE_KEY=${keyData.privateKey}`);
        console.log(`RELAYER_PUBLIC_KEY=${keyData.publicKey}`);
    }

    private async saveToAWS(keyData: KeyPairData): Promise<void> {
        const AWS = require('aws-sdk');
        const secretsManager = new AWS.SecretsManager();
        
        const encryptedData = this.encryptData(JSON.stringify(keyData));
        
        await secretsManager.createSecret({
            Name: process.env.AWS_RELAYER_KEY_SECRET_NAME || 'relayer-keys',
            SecretString: encryptedData
        }).promise();
        
        console.log('Keys saved to AWS Secrets Manager');
    }

    private async saveToGCP(keyData: KeyPairData): Promise<void> {
        const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
        const client = new SecretManagerServiceClient();
        
        const encryptedData = this.encryptData(JSON.stringify(keyData));
        
        await client.createSecret({
            parent: `projects/${process.env.GCP_PROJECT_ID}`,
            secretId: process.env.GCP_RELAYER_KEY_SECRET_NAME || 'relayer-keys',
            replication: {
                automatic: true
            }
        });
        
        await client.addSecretVersion({
            parent: `projects/${process.env.GCP_PROJECT_ID}/secrets/${process.env.GCP_RELAYER_KEY_SECRET_NAME || 'relayer-keys'}`,
            payload: {
                data: Buffer.from(encryptedData)
            }
        });
        
        console.log('Keys saved to GCP Secret Manager');
    }

    private async saveToHSM(keyData: KeyPairData): Promise<void> {
        throw new Error('HSM integration not implemented yet');
    }

    private encryptData(data: string): string {
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    }

    private decryptData(encryptedData: string): string {
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
        
        const parts = encryptedData.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = parts[2];
        
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    public async rotateKeys(): Promise<KeyRotationData> {
        const oldKeyData = { ...this.keypair };
        const newKeyData = await this.generateNewKeys();
        
        // Create rotation message
        const rotationMessage = JSON.stringify({
            oldPublicKey: oldKeyData.publicKey,
            newPublicKey: newKeyData.publicKey,
            timestamp: Date.now(),
            transitionPeriod: 300 // 5 minutes transition period
        });
        
        // Sign rotation message with old key
        const rotationSignature = this.signMessage(rotationMessage, oldKeyData.privateKey);
        
        // Update key data with rotation info
        newKeyData.previousPublicKey = oldKeyData.publicKey;
        newKeyData.lastRotated = Date.now();
        newKeyData.rotationSignature = rotationSignature;
        
        await this.saveKeys(newKeyData);
        this.keypair = newKeyData;
        
        const rotationData: KeyRotationData = {
            oldPublicKey: oldKeyData.publicKey,
            newPublicKey: newKeyData.publicKey,
            rotationSignature,
            timestamp: Date.now(),
            transitionPeriod: 300
        };
        
        console.log('Key rotation completed');
        return rotationData;
    }

    private signMessage(message: string, privateKey: string): string {
        const keypair = Keypair.fromSecretKey(Buffer.from(privateKey, 'hex'));
        const messageBuffer = Buffer.from(message, 'utf8');
        const signature = nacl.sign.detached(messageBuffer, keypair.secretKey);
        return Buffer.from(signature).toString('hex');
    }

    public verifyRotationSignature(rotationData: KeyRotationData): boolean {
        try {
            const rotationMessage = JSON.stringify({
                oldPublicKey: rotationData.oldPublicKey,
                newPublicKey: rotationData.newPublicKey,
                timestamp: rotationData.timestamp,
                transitionPeriod: rotationData.transitionPeriod
            });
            
            const messageBuffer = Buffer.from(rotationMessage, 'utf8');
            const signatureBuffer = Buffer.from(rotationData.rotationSignature, 'hex');
            const publicKeyBuffer = Buffer.from(rotationData.oldPublicKey, 'hex');
            
            return nacl.sign.detached.verify(messageBuffer, signatureBuffer, publicKeyBuffer);
        } catch (error) {
            console.error('Failed to verify rotation signature:', error);
            return false;
        }
    }

    public getCurrentKeys(): KeyPairData {
        return { ...this.keypair };
    }

    public getPublicKey(): string {
        return this.keypair.publicKey;
    }

    public getPrivateKey(): string {
        return this.keypair.privateKey;
    }

    public isKeyInTransitionPeriod(): boolean {
        if (!this.keypair.lastRotated) {
            return false;
        }
        
        const transitionPeriod = 300; // 5 minutes
        const timeSinceRotation = Date.now() - this.keypair.lastRotated;
        return timeSinceRotation < (transitionPeriod * 1000);
    }

    public getPreviousPublicKey(): string | null {
        return this.keypair.previousPublicKey || null;
    }
}
