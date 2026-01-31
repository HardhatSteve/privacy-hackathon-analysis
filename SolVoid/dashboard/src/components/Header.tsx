"use client";

import React from 'react';
import { Shield, ShieldAlert, Cpu, Globe, Loader2, Menu } from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import { WalletBalance } from './WalletBalance';

interface HeaderProps {
    score?: number;
    loading: boolean;
    rpcError?: boolean;
    network?: string;
    onMenuClick?: () => void;
}

export const Header = ({ score, loading, rpcError, network, onMenuClick }: HeaderProps) => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const isHealthy = score === undefined || score >= 80;
    const isCompromised = score !== undefined && score < 50;

    if (!mounted) return (
        <header className="tactical-glass m-3 sm:m-4 p-3 sm:p-4 flex justify-between items-center bg-black/40 opacity-0 h-16 sm:h-20" />
    );

    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="tactical-glass glow-cyan m-3 sm:m-4 p-3 sm:p-4 flex justify-between items-center bg-black/40 relative z-50"
        >
            {/* Left: Logo & Brand */}
            <div className="flex items-center gap-2 sm:gap-3">
                {/* Mobile Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                    <Menu className="w-5 h-5 text-white/60" />
                </button>

                <div className="p-1.5 sm:p-2 bg-tactical-cyan/10 rounded-lg border border-tactical-cyan/20">
                    <Shield className="text-tactical-cyan w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <div>
                    <h1 className="text-base sm:text-lg font-bold tracking-tight text-glow-cyan">SolVoid</h1>
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[9px] sm:text-[10px] text-white/40 hidden sm:block">Privacy Infrastructure</p>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${rpcError ? 'bg-tactical-red/10 text-tactical-red' : 'bg-green-500/10 text-green-500'
                            }`}>
                            {rpcError ? "Offline" : "Live"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Center: Status Indicators (Desktop) */}
            <div className="hidden lg:flex gap-6 items-center">
                <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-tactical-cyan opacity-70" />
                    <span className="text-xs text-white/50">Network:</span>
                    <span className={`text-xs font-medium ${network === 'ephemeral' ? 'text-tactical-cyan animate-pulse' : 'text-tactical-cyan'}`}>
                        {network === 'ephemeral' ? 'Privacy Hack' : network === 'mainnet' ? 'Mainnet' : network === 'devnet' ? 'Devnet' : 'Secure'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Cpu className="w-3.5 h-3.5 text-tactical-purple opacity-70" />
                    <span className="text-xs text-white/50">ZK:</span>
                    <span className="text-xs text-tactical-purple font-medium">Groth16</span>
                </div>
                <div className="flex items-center gap-2">
                    {loading ? (
                        <Loader2 className="w-3.5 h-3.5 text-white/30 animate-spin" />
                    ) : isCompromised ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-tactical-red" />
                    ) : (
                        <Shield className="w-3.5 h-3.5 text-tactical-green" />
                    )}
                    <span className="text-xs text-white/50">Status:</span>
                    <span className={`text-xs font-medium ${isCompromised ? "text-tactical-red" : loading ? "text-white/50" : "text-tactical-green"
                        }`}>
                        {loading ? "Scanning..." : score === undefined ? "Ready" : isHealthy ? "Secure" : "Exposed"}
                    </span>
                </div>
            </div>

            {/* Right: Wallet */}
            <div className="flex items-center gap-2 sm:gap-3">
                <WalletBalance />
                <div className="scale-90 origin-right">
                    <WalletMultiButton />
                </div>
            </div>
        </motion.header >
    );
};
