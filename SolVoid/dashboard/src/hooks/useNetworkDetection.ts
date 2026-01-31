import { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Connection } from '@solana/web3.js';
import { DEFAULT_RPC } from '../config/rpc';

export type Network = 'mainnet' | 'devnet' | 'testnet' | 'ephemeral' | 'unknown';

export const useNetworkDetection = () => {
    const { connection } = useConnection();
    const [network, setNetwork] = useState<Network>('unknown');
    const [isDetecting, setIsDetecting] = useState(false);

    useEffect(() => {
        const detectNetwork = async () => {
            if (!connection) return;

            setIsDetecting(true);

            try {
                const rpcEndpoint = connection.rpcEndpoint;
                console.log("Detecting network for RPC:", rpcEndpoint);

                // Method 1: Check RPC endpoint URL
                let detectedNetwork: Network = 'unknown';
                if (rpcEndpoint.includes('mainnet') || rpcEndpoint.includes('api.solana.com')) {
                    detectedNetwork = 'mainnet';
                } else if (rpcEndpoint.includes('devnet') || rpcEndpoint.includes('devnet.solana.com')) {
                    detectedNetwork = 'devnet';
                } else if (rpcEndpoint.includes('testnet') || rpcEndpoint.includes('testnet.solana.com')) {
                    detectedNetwork = 'testnet';
                } else if (rpcEndpoint.includes('zk-edge') || rpcEndpoint.includes('surfnet.dev')) {
                    detectedNetwork = 'ephemeral';
                } else {
                    // Method 2: Test against known endpoints
                    if (rpcEndpoint === DEFAULT_RPC.MAINNET) {
                        detectedNetwork = 'mainnet';
                    } else if (rpcEndpoint === DEFAULT_RPC.DEVNET) {
                        detectedNetwork = 'devnet';
                    } else if (rpcEndpoint === DEFAULT_RPC.TESTNET) {
                        detectedNetwork = 'testnet';
                    } else if (rpcEndpoint === (DEFAULT_RPC as any).EPHEMERAL) {
                        detectedNetwork = 'ephemeral';
                    }
                }

                // Method 3: Verify by getting a recent blockhash (network-specific test)
                try {
                    const testConnection = new Connection(rpcEndpoint, 'confirmed');
                    const { blockhash } = await testConnection.getLatestBlockhash();
                    console.log(`Successfully connected to ${detectedNetwork}, latest blockhash:`, blockhash.slice(0, 8) + '...');
                } catch (error) {
                    console.warn(`Failed to verify ${detectedNetwork} connection:`, error);
                    // If connection fails, try to fallback to mainnet
                    if (detectedNetwork === 'unknown') {
                        detectedNetwork = 'mainnet';
                    }
                }

                setNetwork(detectedNetwork);
            } catch (error) {
                console.error('Network detection failed:', error);
                setNetwork('unknown');
            } finally {
                setIsDetecting(false);
            }
        };

        detectNetwork();
    }, [connection]);

    return { network, isDetecting };
};
