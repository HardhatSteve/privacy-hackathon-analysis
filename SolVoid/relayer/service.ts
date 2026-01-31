#!/usr/bin/env node

/**
 * SolVoid Shadow Relayer Service
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { Connection, VersionedTransaction } from '@solana/web3.js';
import {
    DataOrigin,
    DataTrust,
    Unit,
    RelayRequestSchema,
    RelayResponseSchema,
    OnionLayerSchema,
    enforce,
    DataMetadata,
    RelayResponse,
    RelayRequest,
    OnionLayer
} from '../sdk/index';
import fetch from 'cross-fetch';

// Configuration
const PORT = parseInt(process.env.PORT || '8080');
const RPC_ENDPOINT = process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
const NODE_ID = process.env.NODE_ID || `shadow-${crypto.randomBytes(4).toString('hex')}`;
const BOUNTY_RATE_SOL = parseFloat(process.env.BOUNTY_RATE || '0.001'); // Unit: SOL

interface RelayerNode {
    readonly id: string;
    readonly endpoint: string;
    readonly publicKey: string;
    lastSeen: number;
    successRate: number;
    readonly region: string;
}

// In-memory peer registry
const peerRegistry: Map<string, RelayerNode> = new Map();

// Transaction metrics
const metrics = {
    relayed: 0,
    failed: 0,
    totalBountySOL: 0,
    uptime: Date.now()
};

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Solana connection
const connection = new Connection(RPC_ENDPOINT, 'confirmed');

const API_METADATA: DataMetadata = {
    origin: DataOrigin.API_PAYLOAD,
    trust: DataTrust.UNTRUSTED,
    createdAt: Date.now(),
    owner: 'External API Client'
};

/**
 * Health check endpoint
 */
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'healthy',
        nodeId: NODE_ID,
        uptime: Math.floor((Date.now() - metrics.uptime) / 1000),
        metrics: {
            relayed: metrics.relayed,
            failed: metrics.failed,
            successRate: metrics.relayed / (metrics.relayed + metrics.failed || 1),
            totalBountySOL: metrics.totalBountySOL
        },
        peers: peerRegistry.size,
        bountyRate: BOUNTY_RATE_SOL,
        units: { bounty: Unit.SOL }
    });
});

/**
 * Register as a peer relay
 */
app.post('/register', (req: Request, res: Response) => {
    const { endpoint, publicKey, region } = req.body;

    if (!endpoint || !publicKey) {
        res.status(400).json({ error: 'Missing endpoint or publicKey' });
        return;
    }

    const nodeId = `peer-${crypto.createHash('sha256').update(publicKey).digest('hex').slice(0, 8)}`;

    peerRegistry.set(nodeId, {
        id: nodeId,
        endpoint,
        publicKey,
        lastSeen: Date.now(),
        successRate: 1.0,
        region: region || 'UNKNOWN'
    });

    res.json({ registered: true, nodeId });
});

/**
 * Relay transaction through onion routing
 */
app.post('/relay', async (req: Request, res: Response) => {
    try {
        // Boundary Enforcement: API -> Service (Rule 10)
        const enforcedRequest = enforce(RelayRequestSchema, req.body, {
            ...API_METADATA,
            createdAt: Date.now()
        });
        const relayReq = enforcedRequest.value;

        if (relayReq.encryptedPayload) {
            const result = await handleOnionRelay(relayReq.encryptedPayload);
            res.json(result);
            return;
        }

        if (!relayReq.transaction) {
            res.status(400).json({ error: 'Missing transaction data' });
            return;
        }

        const txBuffer = Buffer.from(relayReq.transaction, 'base64');
        const tx = VersionedTransaction.deserialize(txBuffer);

        let response: RelayResponse;

        if (relayReq.hops > 1 && peerRegistry.size > 0) {
            response = await multiHopRelay(tx, relayReq.hops - 1, relayReq.targetNode);
        } else {
            response = await broadcastTransaction(tx);
        }

        if (response.success) {
            metrics.relayed++;
            metrics.totalBountySOL += BOUNTY_RATE_SOL;
        } else {
            metrics.failed++;
        }

        res.json(response);
    } catch (error: unknown) {
        metrics.failed++;
        const errorMsg = error instanceof Error ? error.message : 'Internal Relay Error';
        res.status(errorMsg.includes('Data Integrity') ? 400 : 500).json({
            success: false,
            error: errorMsg
        });
    }
});

/**
 * Handle onion-encrypted relay
 */
async function handleOnionRelay(encryptedPayload: string): Promise<RelayResponse> {
    try {
        const decoded = Buffer.from(encryptedPayload, 'base64').toString('utf-8');
        const layerUnvalidated = JSON.parse(decoded);

        const enforcedLayer = enforce(OnionLayerSchema, layerUnvalidated, {
            origin: DataOrigin.INTERNAL_LOGIC,
            trust: DataTrust.TRUSTED,
            createdAt: Date.now(),
            owner: 'Relayer'
        });
        const layer = enforcedLayer.value;

        if (layer.nextHop === 'FINAL') {
            const txBuffer = Buffer.from(layer.payload, 'base64');
            const tx = VersionedTransaction.deserialize(txBuffer);
            return broadcastTransaction(tx);
        } else {
            const peer = peerRegistry.get(layer.nextHop);
            if (!peer) return { success: false, error: 'Next hop peer not found' };

            const response = await fetch(`${peer.endpoint}/relay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ encryptedPayload: layer.payload, hops: 1 } as RelayRequest)
            });

            const rawJson = await response.json();
            const enforcedResponse = enforce(RelayResponseSchema, rawJson, {
                origin: DataOrigin.API_PAYLOAD,
                trust: DataTrust.SEMI_TRUSTED,
                createdAt: Date.now(),
                owner: peer.id
            });
            return enforcedResponse.value;
        }
    } catch (error: any) {
        return { success: false, error: error.message || 'Onion relay failed' };
    }
}

/**
 * Multi-hop relay with random peer selection
 */
async function multiHopRelay(
    tx: VersionedTransaction,
    remainingHops: number,
    preferredNode?: string
): Promise<RelayResponse> {
    let nextPeer: RelayerNode | undefined;

    if (preferredNode && peerRegistry.has(preferredNode)) {
        nextPeer = peerRegistry.get(preferredNode);
    } else {
        const activePeers = Array.from(peerRegistry.values())
            .filter(p => Date.now() - p.lastSeen < 60000);

        if (activePeers.length > 0) {
            const totalWeight = activePeers.reduce((sum, p) => sum + p.successRate, 0);
            let random = Math.random() * totalWeight;

            for (const peer of activePeers) {
                random -= peer.successRate;
                if (random <= 0) {
                    nextPeer = peer;
                    break;
                }
            }
        }
    }

    if (!nextPeer) return broadcastTransaction(tx);

    try {
        const response = await fetch(`${nextPeer.endpoint}/relay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transaction: Buffer.from(tx.serialize()).toString('base64'),
                hops: remainingHops
            } as RelayRequest)
        });

        const rawJson = await response.json();
        const enforcedResponse = enforce(RelayResponseSchema, rawJson, {
            origin: DataOrigin.API_PAYLOAD,
            trust: DataTrust.SEMI_TRUSTED,
            createdAt: Date.now(),
            owner: nextPeer.id
        });
        const result = enforcedResponse.value;

        if (result.success) {
            nextPeer.successRate = Math.min(1, nextPeer.successRate + 0.01);
        } else {
            nextPeer.successRate = Math.max(0.5, nextPeer.successRate - 0.1);
        }
        nextPeer.lastSeen = Date.now();

        return {
            ...result,
            relayPath: [NODE_ID, ...(result.relayPath || [])]
        };
    } catch (error) {
        if (nextPeer) nextPeer.successRate = Math.max(0.5, nextPeer.successRate - 0.2);
        return broadcastTransaction(tx);
    }
}

/**
 * Broadcast transaction to Solana network
 */
async function broadcastTransaction(tx: VersionedTransaction): Promise<RelayResponse> {
    try {
        const jitterMs = Math.floor(Math.random() * 200) + 50;
        await new Promise(resolve => setTimeout(resolve, jitterMs));

        const rawTransaction = tx.serialize();
        const txid = await connection.sendRawTransaction(rawTransaction, {
            skipPreflight: true,
            maxRetries: 3
        });

        return {
            success: true,
            txid,
            hopCount: 1,
            relayPath: [NODE_ID]
        };
    } catch (error: unknown) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Broadcast failed'
        };
    }
}

/**
 * Build onion-encrypted payload for multi-hop routing
 */
app.post('/encrypt-route', (req: Request, res: Response) => {
    const { transaction, route } = req.body;

    if (!transaction || !route || route.length === 0) {
        res.status(400).json({ error: 'Missing transaction or route' });
        return;
    }

    let payload = transaction;

    for (let i = route.length - 1; i >= 0; i--) {
        const layer: OnionLayer = {
            nextHop: i === route.length - 1 ? 'FINAL' : route[i + 1],
            payload,
            nonce: crypto.randomBytes(16).toString('hex')
        };
        payload = Buffer.from(JSON.stringify(layer)).toString('base64');
    }

    res.json({ encrypted: payload, hops: route.length });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[ERROR]', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`  SolVoid Relayer Ready on ${PORT}`);
});

export { app, peerRegistry, metrics };
