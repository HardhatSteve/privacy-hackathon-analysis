"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Plus, Unlock, ArrowUpRight, ArrowDownLeft, Loader2, AlertCircle, Shield, Target, Activity } from 'lucide-react';
import { useToast } from './Toast';
import { Unit } from '../../../sdk/integrity';

export interface Commitment {
    readonly id: string;
    readonly amountSOL: number; // Unit: SOL
    readonly timestamp: Date;
    readonly status: 'pending' | 'confirmed' | 'withdrawn';
}

import { ProtocolStats } from '../../../sdk/integrity';

interface ShadowVaultProps {
    readonly commitments: readonly Commitment[];
    readonly stats: ProtocolStats | null;
    readonly onDeposit?: (amountSOL: number) => Promise<void>;
    readonly onWithdraw?: (id: string) => Promise<void>;
}

export const ShadowVault = ({ commitments, stats, onDeposit, onWithdraw }: ShadowVaultProps) => {
    const [mounted, setMounted] = useState<boolean>(false);
    const [isDepositing, setIsDepositing] = useState<boolean>(false);
    const [depositAmountSOL, setDepositAmountSOL] = useState<string>('');
    const [showForm, setShowForm] = useState<boolean>(false);
    const { success, error: showError } = useToast();

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const handleDeposit = async () => {
        if (!depositAmountSOL || !onDeposit) return;

        // Rule 10: Boundary Enforcement - UI to Logic
        const amount = parseFloat(depositAmountSOL);
        if (isNaN(amount) || amount <= 0) {
            showError('Invalid Amount', 'Please enter a valid positive number of SOL.');
            return;
        }

        setIsDepositing(true);
        try {
            await onDeposit(amount);
            setDepositAmountSOL('');
            setShowForm(false);
            success('Privacy Shield Activated', `${amount.toFixed(4)} SOL has been anonymized and moved to the vault.`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Transaction refused';
            showError('Shielding Failed', msg);
        } finally {
            setIsDepositing(false);
        }
    };

    const totalShieldedSOL = commitments
        .filter(c => c.status === 'confirmed')
        .reduce((sum, c) => sum + c.amountSOL, 0);

    if (!mounted) return <div className="tactical-glass p-6 h-full bg-black/40" />;

    return (
        <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="tactical-glass p-0 flex flex-col bg-black/40 overflow-hidden group border-white/5"
        >
            {/* Upper Section with Glow */}
            <div className="p-6 pb-0">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="p-2.5 bg-tactical-purple/10 border border-tactical-purple/20 rounded-xl">
                                <Shield className="w-5 h-5 text-tactical-purple" />
                            </div>
                            <div className="absolute inset-0 bg-tactical-purple/20 blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-white tracking-[0.2em] uppercase">Shadow Vault</h3>
                            <p className="text-[9px] text-white/30 font-mono mt-0.5">COLD_STATE_RESERVE_V1</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className={`p-2 rounded-lg transition-all duration-300 ${showForm ? 'bg-tactical-purple/20 text-white' : 'hover:bg-white/5 text-white/40'}`}
                    >
                        <Plus className={`w-4 h-4 transition-transform duration-500 ${showForm ? 'rotate-45' : ''}`} />
                    </button>
                </div>

                <div className="relative p-6 bg-gradient-to-br from-tactical-purple/[0.05] to-transparent border border-white/5 rounded-2xl mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-3 h-3 text-tactical-purple/60" />
                        <span className="text-[9px] text-white/40 uppercase tracking-[0.1em] font-mono">Shielded Liquidity ({Unit.SOL})</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-bold text-white tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(176,0,255,0.3)]">
                            {totalShieldedSOL.toFixed(4)}
                        </span>
                        <span className="text-sm font-bold text-tactical-purple tracking-widest uppercase">SOL</span>
                    </div>

                    <div className="flex gap-6 mt-6 pt-6 border-t border-white/5">
                        <div className="space-y-1">
                            <p className="text-[8px] text-white/20 uppercase font-mono">Active Commitments</p>
                            <p className="text-xs font-bold text-white/80">{commitments.filter(c => c.status === 'confirmed').length}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] text-white/20 uppercase font-mono">Mixing Time (Avg)</p>
                            <p className="text-xs font-bold text-tactical-green">{stats ? `${stats.mixingTimeAvgMinutes}m` : '--'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] text-white/20 uppercase font-mono">Anon Set</p>
                            <p className="text-xs font-bold text-tactical-cyan">{stats ? stats.anonSetSize.toLocaleString() : '--'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Deposit Form Section */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 pb-6 overflow-hidden"
                    >
                        <div className="p-1.5 bg-black/40 border border-tactical-purple/20 rounded-xl">
                            <div className="flex items-center px-3 gap-2">
                                <Target size={14} className="text-tactical-purple/40" />
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={depositAmountSOL}
                                    onChange={(e) => setDepositAmountSOL(e.target.value)}
                                    className="flex-1 bg-transparent py-3 text-sm text-white font-mono placeholder:text-white/5 outline-none"
                                    step="0.01"
                                    min="0"
                                />
                                <span className="text-[10px] text-white/20 font-bold uppercase">Amount (SOL)</span>
                            </div>
                            <button
                                onClick={handleDeposit}
                                disabled={isDepositing || !depositAmountSOL}
                                className="w-full mt-1 py-3 bg-tactical-purple/20 border border-tactical-purple/30 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-tactical-purple/30 transition-all rounded-lg flex justify-center items-center gap-2"
                            >
                                {isDepositing ? <Loader2 size={14} className="animate-spin" /> : <Lock size={12} />}
                                {isDepositing ? 'Executing Shield...' : 'Initiate Anonymization'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Commitments List */}
            <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col">
                <div className="text-[9px] text-white/20 font-bold uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                    <span>Recent History</span>
                    <span className="w-16 h-px bg-white/5" />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide pr-1">
                    {commitments.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl p-10 grayscale opacity-20">
                            <Lock size={32} className="mb-4" />
                            <p className="text-[10px] uppercase font-mono tracking-widest">No assets in storage</p>
                        </div>
                    ) : (
                        commitments.map((commitment) => (
                            <motion.div
                                key={commitment.id}
                                layout
                                className="p-3 border border-white/5 bg-white/[0.01] rounded-xl flex items-center justify-between hover:bg-white/[0.03] transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${commitment.status === 'confirmed' ? 'bg-tactical-green/10 text-tactical-green' :
                                        commitment.status === 'withdrawn' ? 'bg-tactical-purple/10 text-tactical-purple' :
                                            'bg-yellow-500/10 text-yellow-500'
                                        }`}>
                                        {commitment.status === 'withdrawn' ? <Unlock size={14} /> : <Lock size={14} />}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-white/90 font-mono tracking-tight">
                                            {commitment.amountSOL.toFixed(3)} SOL
                                        </div>
                                        <div className="text-[9px] text-white/20 font-mono">
                                            {commitment.timestamp.toLocaleDateString()} @ {commitment.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                                <div className={`text-[8px] font-bold px-2 py-1 rounded border uppercase tracking-widest ${commitment.status === 'confirmed' ? 'border-tactical-green/20 text-tactical-green' :
                                    commitment.status === 'withdrawn' ? 'border-tactical-purple/20 text-tactical-purple' :
                                        'border-yellow-500/20 text-yellow-500'
                                    }`}>
                                    {commitment.status}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Footer Decoy */}
            <div className="h-1 bg-gradient-to-r from-transparent via-tactical-purple/40 to-transparent opacity-50" />
        </motion.div>
    );
};
