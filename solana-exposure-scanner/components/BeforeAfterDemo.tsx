import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Unlock, ArrowRight, Shield, Check, X, Sparkles } from 'lucide-react';

const BeforeAfterDemo: React.FC = () => {
    const [showEncrypted, setShowEncrypted] = useState(false);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-solana-purple/10 border border-solana-purple/20 rounded-full">
                    <Sparkles className="w-4 h-4 text-solana-purple" />
                    <span className="text-xs font-black uppercase tracking-wider text-solana-purple">Privacy Demo</span>
                </div>
                <h3 className="text-3xl font-black tracking-tighter uppercase">
                    Before & After <span className="text-solana-green">Encryption</span>
                </h3>
                <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                    See exactly what changes when you use selective privacy on encrypt.trade
                </p>
            </div>

            {/* Toggle */}
            <div className="flex justify-center">
                <div className="p-1 bg-secondary/50 rounded-2xl border border-border inline-flex gap-1">
                    <button
                        onClick={() => setShowEncrypted(false)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all ${!showEncrypted
                                ? 'bg-red-500 text-white shadow-lg'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Eye className="w-4 h-4" />
                        Exposed
                    </button>
                    <button
                        onClick={() => setShowEncrypted(true)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all ${showEncrypted
                                ? 'bg-solana-green text-black shadow-lg'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <EyeOff className="w-4 h-4" />
                        Encrypted
                    </button>
                </div>
            </div>

            {/* Transaction Card */}
            <div className="max-w-2xl mx-auto">
                <motion.div
                    className={`p-8 rounded-[2.5rem] border-2 transition-colors duration-500 ${showEncrypted
                            ? 'bg-solana-green/5 border-solana-green/30'
                            : 'bg-red-500/5 border-red-500/30'
                        }`}
                    layout
                >
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <motion.div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-500 ${showEncrypted ? 'bg-solana-green/20' : 'bg-red-500/20'
                                    }`}
                                animate={{ scale: showEncrypted ? [1, 1.1, 1] : 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {showEncrypted ? (
                                    <Lock className="w-6 h-6 text-solana-green" />
                                ) : (
                                    <Unlock className="w-6 h-6 text-red-400" />
                                )}
                            </motion.div>
                            <div>
                                <p className="font-black text-lg tracking-tight">Swap Transaction</p>
                                <p className="text-xs text-muted-foreground font-mono">SOL → USDC</p>
                            </div>
                        </div>
                        <div className={`px-4 py-2 rounded-full font-black text-xs uppercase tracking-wider ${showEncrypted
                                ? 'bg-solana-green/20 text-solana-green'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                            {showEncrypted ? 'Private' : 'Public'}
                        </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="space-y-4">
                        {[
                            { label: 'Amount', exposed: '150.5 SOL ($30,100)', encrypted: '████████ SOL ($█████)' },
                            { label: 'From', exposed: 'DL66m...hf7a5', encrypted: 'DL66m...hf7a5' },
                            { label: 'To', exposed: 'Jupiter Aggregator', encrypted: '████████████████' },
                            { label: 'Route', exposed: 'SOL → USDC via Orca + Raydium', encrypted: '████ → ████ via ████████' },
                            { label: 'Timestamp', exposed: 'Jan 12, 2026 01:30:42 UTC', encrypted: 'Jan 12, 2026 01:30:42 UTC' },
                            { label: 'Slippage', exposed: '0.5%', encrypted: '████' },
                        ].map((item, idx) => (
                            <motion.div
                                key={item.label}
                                className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5"
                                initial={false}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                                    {item.label}
                                </span>
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={showEncrypted ? 'enc' : 'exp'}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        className={`font-mono text-sm ${showEncrypted && item.encrypted.includes('█')
                                                ? 'text-solana-green/50 blur-[1px]'
                                                : 'text-foreground'
                                            }`}
                                    >
                                        {showEncrypted ? item.encrypted : item.exposed}
                                    </motion.span>
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>

                    {/* Visibility Summary */}
                    <div className={`mt-6 p-4 rounded-2xl border ${showEncrypted
                            ? 'bg-solana-green/10 border-solana-green/20'
                            : 'bg-red-500/10 border-red-500/20'
                        }`}>
                        <div className="flex items-start gap-3">
                            {showEncrypted ? (
                                <Shield className="w-5 h-5 text-solana-green shrink-0 mt-0.5" />
                            ) : (
                                <Eye className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            )}
                            <div className="space-y-2">
                                <p className={`text-sm font-bold ${showEncrypted ? 'text-solana-green' : 'text-red-400'}`}>
                                    {showEncrypted
                                        ? 'Transaction verified on-chain, but sensitive details are hidden'
                                        : 'Everyone can see your exact trade, amount, and strategy'
                                    }
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {showEncrypted
                                        ? 'Zero-knowledge proofs maintain blockchain verification without exposing your financial data.'
                                        : 'MEV bots, competitors, and surveillance companies are watching every trade.'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* What Changes */}
            <div className="max-w-2xl mx-auto">
                <div className="grid grid-cols-2 gap-4">
                    {/* Still Visible */}
                    <div className="p-6 rounded-2xl bg-secondary/20 border border-border space-y-4">
                        <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">Still Visible</span>
                        </div>
                        <ul className="space-y-2">
                            {['Your wallet address', 'Transaction timestamp', 'Transaction happened', 'Network validity'].map((item) => (
                                <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                                    <Check className="w-4 h-4 text-solana-green" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Now Hidden */}
                    <div className="p-6 rounded-2xl bg-solana-green/5 border border-solana-green/20 space-y-4">
                        <div className="flex items-center gap-2">
                            <EyeOff className="w-4 h-4 text-solana-green" />
                            <span className="text-xs font-black uppercase tracking-wider text-solana-green">Now Hidden</span>
                        </div>
                        <ul className="space-y-2">
                            {['Exact amounts', 'Counterparty identity', 'Trading strategy', 'Portfolio exposure'].map((item) => (
                                <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                                    <Lock className="w-4 h-4 text-solana-green" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="text-center">
                <motion.a
                    href="https://encrypt.trade"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-solana-purple to-solana-green text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl hover:shadow-2xl hover:shadow-solana-purple/30 transition-shadow"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Shield className="w-5 h-5" />
                    Try encrypt.trade Now
                    <ArrowRight className="w-5 h-5" />
                </motion.a>
            </div>
        </div>
    );
};

export default BeforeAfterDemo;
