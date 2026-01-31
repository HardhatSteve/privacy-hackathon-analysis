"use client";

import React, { useState, useEffect } from 'react';
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut, Check } from 'lucide-react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { motion, AnimatePresence } from 'framer-motion';
import { Unit } from '../../../sdk/integrity';
import { formatError } from '../utils/formatError';
import { useNetworkDetection, Network } from '../hooks/useNetworkDetection';

const ESTIMATED_SOL_PRICE_USD = 180.0; // Rule 3: Semantics - Market price estimate

interface WalletBalanceProps {
    readonly className?: string;
}

export const WalletBalance = ({ className = '' }: WalletBalanceProps) => {
    const { publicKey, disconnect, connected } = useWallet();
    const { connection } = useConnection();
    const { network, isDetecting } = useNetworkDetection();

    // Rule 1: Types - balance in SOL (float)
    const [balanceSOL, setBalanceSOL] = useState<number | null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [copied, setCopied] = useState<boolean>(false);
    const [mounted, setMounted] = useState<boolean>(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        console.log("WalletBalance useEffect triggered:", { publicKey: publicKey?.toBase58(), connection: !!connection });
        if (!publicKey || !connection) {
            setBalanceSOL(null);
            return;
        }

        const fetchBalance = async () => {
            try {
                if (!publicKey) return;

                // Rule 4: Data Source - API (Server-side Solana)
                console.log("Fetching balance for:", publicKey.toBase58());
                console.log("Detected network:", network);
                console.log("Using connection RPC:", connection.rpcEndpoint);
                
                const response = await fetch('/api/solvoid', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'getBalance',
                        params: { 
                            publicKey: publicKey.toBase58(), 
                            network: network === 'unknown' ? 'mainnet' : network 
                        }
                    })
                });

                console.log("API response status:", response.status);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("API error response:", errorText);
                    throw new Error(`API Error: ${response.status} - ${errorText}`);
                }

                const balanceData = await response.json();
                console.log("Balance data received:", balanceData);
                
                // Rule 6: Explicit Transformation - Lamports to SOL
                const balSOL = balanceData.balance / LAMPORTS_PER_SOL;
                setBalanceSOL(balSOL);
            } catch (error: unknown) {
                console.error("RAW ERROR:", error);
                console.error("[ERROR] Failed to fetch balance:", formatError(error));
                const errorMsg = error instanceof Error ? error.message : 'Unknown balance error';
                if (errorMsg.includes('403')) {
                    console.warn('RPC access forbidden (403). Balance fetching unavailable on this node.');
                } else {
                    console.error('Failed to fetch balance:', error);
                }
                setBalanceSOL(0); // Rule 9: Failure behavior - fallback to 0
            }
        };

        fetchBalance();
        return () => { };
    }, [publicKey, connection]);

    const handleCopy = async () => {
        if (!publicKey) return;
        await navigator.clipboard.writeText(publicKey.toBase58());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExplorer = () => {
        if (!publicKey) return;
        window.open(`https://solscan.io/account/${publicKey.toBase58()}`, '_blank');
    };

    const getNetworkColor = (net: Network) => {
        switch (net) {
            case 'mainnet': return 'text-green-400';
            case 'devnet': return 'text-blue-400';
            case 'testnet': return 'text-yellow-400';
            default: return 'text-gray-400';
        }
    };

    const getNetworkName = (net: Network) => {
        switch (net) {
            case 'mainnet': return 'Mainnet';
            case 'devnet': return 'Devnet';
            case 'testnet': return 'Testnet';
            default: return 'Unknown';
        }
    };

    if (!mounted || !connected || !publicKey) return null;

    const shortenedAddress = `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`;

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-all"
            >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-tactical-cyan/20 to-tactical-purple/20 flex items-center justify-center">
                    <Wallet className="w-3.5 h-3.5 text-tactical-cyan" />
                </div>
                <div className="text-left hidden sm:block">
                    <div className="text-xs font-medium text-white/80">{shortenedAddress}</div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-tactical-cyan font-medium">
                            {balanceSOL !== null ? `${balanceSOL.toFixed(4)} SOL` : '---'}
                        </span>
                        {!isDetecting && (
                            <span className={`text-[8px] font-medium ${getNetworkColor(network)}`}>
                                {getNetworkName(network)}
                            </span>
                        )}
                    </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 mt-2 w-64 bg-black/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
                    >
                        {/* Balance Section */}
                        <div className="p-4 border-b border-white/5">
                            <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Balance ({Unit.SOL})</div>
                            <div className="text-xl font-semibold text-white">
                                {balanceSOL !== null ? `${balanceSOL.toFixed(4)}` : '---'}
                                <span className="text-sm text-white/50 ml-1">SOL</span>
                            </div>
                            <div className="text-xs text-white/30 mt-0.5">
                                ≈ ${balanceSOL !== null ? (balanceSOL * ESTIMATED_SOL_PRICE_USD).toFixed(2) : '---'} USD
                            </div>
                        </div>

                        {/* Address Section */}
                        <div className="p-4 border-b border-white/5">
                            <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Address</div>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-xs text-white/60 font-mono truncate">
                                    {publicKey.toBase58()}
                                </code>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-2 space-y-1">
                            <button
                                onClick={handleCopy}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-tactical-green" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                                {copied ? 'Copied!' : 'Copy Address'}
                            </button>
                            <button
                                onClick={handleExplorer}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                            >
                                <ExternalLink className="w-4 h-4" />
                                View on Solscan
                            </button>
                            <button
                                onClick={() => { disconnect(); setIsOpen(false); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs text-tactical-red/80 hover:text-tactical-red hover:bg-tactical-red/5 rounded-lg transition-all"
                            >
                                <LogOut className="w-4 h-4" />
                                Disconnect
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};
