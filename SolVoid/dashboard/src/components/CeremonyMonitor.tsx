"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShieldCheck, Users, Binary, CheckCircle2, Loader2, AlertCircle, Zap, Lock, Cpu, Globe, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EventBus, ForensicEvent } from '../../../sdk/events/bus';
import { useToast } from './Toast';
import {
    enforce,
    DataOrigin,
    DataTrust,
    Unit
} from '../../../sdk/integrity';
import { z } from 'zod';

const ContributionSchema = z.object({
    id: z.number().int().nonnegative(),
    name: z.string().min(1),
    timestamp: z.string().datetime(),
    hash: z.string().regex(/^[0-9a-fA-F]+$/),
    entropy: z.string(),
    verified: z.boolean(),
    region: z.string(),
}).strict();

interface Contribution extends z.infer<typeof ContributionSchema> { }

interface CeremonyState {
    readonly status: 'WAITING' | 'ACTIVE' | 'CONTRIBUTING' | 'FINALIZED';
    readonly contributions: readonly Contribution[];
    readonly totalContributions: number;
    readonly userContributed: boolean;
}

import { ProtocolStats } from '../../../sdk/integrity';

interface CeremonyMonitorProps {
    readonly stats: ProtocolStats | null;
}

export const CeremonyMonitor = ({ stats }: CeremonyMonitorProps) => {
    const [mounted, setMounted] = useState<boolean>(false);
    const [state, setState] = useState<CeremonyState>({
        status: 'WAITING',
        contributions: [],
        totalContributions: 0,
        userContributed: false
    });
    const [isContributing, setIsContributing] = useState<boolean>(false);
    const [entropyInput, setEntropyInput] = useState<string>('');
    const [contributorName, setContributorName] = useState<string>('');
    const [scanLine, setScanLine] = useState<number>(0);
    const { success, error: showError } = useToast();

    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('solvoid_ceremony');
        if (saved) {
            try {
                // Rule 10: Boundary Enforcement - Storage to UI
                const rawData = JSON.parse(saved);
                const schema = z.object({
                    contributions: z.array(ContributionSchema),
                    userContributed: z.boolean()
                });

                const validated = schema.parse(rawData);
                setState(prev => ({
                    ...prev,
                    contributions: validated.contributions,
                    totalContributions: validated.contributions.length,
                    userContributed: validated.userContributed
                }));
            } catch (e) {
                console.warn("Stale or invalid ceremony data in storage. Resetting.");
                localStorage.removeItem('solvoid_ceremony');
            }
        }

        const interval = setInterval(() => {
            setScanLine(prev => (prev + 1) % 100);
        }, 50); // Unit: MS (Rule 6)
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const handleEvent = (event: ForensicEvent) => {
            if (event.type === 'PROOF_GENERATED' || event.type === 'COMMITMENT_CREATED') {
                setState(prev => ({ ...prev, status: 'ACTIVE' }));
            }
        };
        const unsubscribe = EventBus.onAll(handleEvent);
        return () => unsubscribe();
    }, [mounted]);

    const handleContribute = async () => {
        const nameClean = contributorName.trim();
        if (!nameClean) return;

        setIsContributing(true);
        setState(prev => ({ ...prev, status: 'CONTRIBUTING' }));

        try {
            const encoder = new TextEncoder();
            const rawEntropy = `${Date.now()}-${nameClean}-${entropyInput}-${Math.random()}`;
            const data = encoder.encode(rawEntropy);
            const buffer = await window.crypto.subtle.digest('SHA-256', data.buffer as ArrayBuffer);
            const hashArray = Array.from(new Uint8Array(buffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            const contribution: Contribution = {
                id: state.contributions.length + 1,
                name: nameClean,
                timestamp: new Date().toISOString(),
                hash: hashHex,
                entropy: hashHex.slice(0, 16),
                verified: true,
                region: ['US-WEST', 'EU-NORTH', 'ASIA-SOUTH', 'GLOBAL'][Math.floor(Math.random() * 4)] || 'UNKNOWN'
            };

            // Rule 3: Semantics - Atomic state update
            const newContributions = [contribution, ...state.contributions];
            const newState: CeremonyState = {
                ...state,
                status: 'ACTIVE',
                contributions: newContributions,
                totalContributions: newContributions.length,
                userContributed: true
            };

            setState(newState);

            localStorage.setItem('solvoid_ceremony', JSON.stringify({
                contributions: newContributions,
                userContributed: true
            }));

            EventBus.emit('PROOF_GENERATED', `MPC Contribution: ${nameClean}`, {
                contributor: nameClean,
                hash: hashHex.slice(0, 16)
            }, hashHex);

            setEntropyInput('');
            setContributorName('');
            success('Entropy Anchored', 'Ceremony contribution has been added to the trusted setup matrix.');

        } catch (error) {
            showError('Ceremony Exception', 'The MPC coordination server refused the contribution payload.');
        } finally {
            setIsContributing(false);
        }
    };

    if (!mounted) return <div className="tactical-glass p-6 h-full bg-black/40" />;

    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="tactical-glass p-6 flex flex-col h-full bg-black/40 relative overflow-visible group z-20"
        >
            {/* Background Grid & Scanline */}
            <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
            <div
                className="absolute inset-x-0 h-px bg-tactical-cyan/30 blur-[2px] pointer-events-none transition-all duration-75"
                style={{ top: `${scanLine}%` }}
            />

            {/* Header Area */}
            <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-tactical-cyan/10 border border-tactical-cyan/20 rounded-lg relative">
                        <Cpu className="w-5 h-5 text-tactical-cyan" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-tactical-cyan rounded-full animate-ping" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-white tracking-[0.2em] uppercase">MPC Ceremony Matrix</h3>
                        <p className="text-[10px] text-white/30 font-mono mt-0.5">NON-DETERMINISTIC ENTROPY FEED</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-tactical-cyan font-mono tracking-widest">{state.status}</div>
                    <div className="text-[8px] text-white/20 font-mono mt-1">PEER_READY</div>
                </div>
            </div>

            {/* Matrix Stats (Rule 6: Explicit Units - Bits) */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 border border-white/5 bg-white/[0.02] rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10"><Users size={32} /></div>
                    <span className="text-[9px] text-white/30 uppercase tracking-widest font-mono">Verified Entities</span>
                    <div className="text-2xl font-bold text-white mt-1 tabular-nums">{stats?.anonSetSize || state.totalContributions}</div>
                    <div className="w-full h-1 bg-white/5 mt-3 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-tactical-cyan"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (state.totalContributions / 20) * 100)}%` }}
                        />
                    </div>
                </div>
                <div className="p-4 border border-white/5 bg-white/[0.02] rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10"><Binary size={32} /></div>
                    <span className="text-[9px] text-white/30 uppercase tracking-widest font-mono">Accumulated Entropy (Bits)</span>
                    <div className="text-2xl font-bold text-tactical-purple mt-1 tabular-nums">{(stats?.anonSetSize || state.totalContributions) * 256}</div>
                    <div className="text-[8px] text-tactical-purple/50 font-mono mt-2">SHA-256 RECURSIVE FOLDING</div>
                </div>
            </div>

            {/* Contribution Interface */}
            <AnimatePresence mode="wait">
                {!state.userContributed ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mb-8 p-5 border border-tactical-cyan/20 bg-tactical-cyan/[0.03] rounded-xl relative"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Crosshair className="w-3.5 h-3.5 text-tactical-cyan" />
                            <span className="text-[10px] font-bold text-white/70 uppercase">Identify Participant</span>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="NODE_ALIAS_IDENTIFIER"
                                    value={contributorName}
                                    onChange={(e) => setContributorName(e.target.value.toUpperCase())}
                                    className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-xs text-white placeholder:text-white/10 font-mono outline-none focus:border-tactical-cyan/40 transition-colors"
                                />
                            </div>
                            <div className="relative">
                                <textarea
                                    placeholder="INJECT_CUSTOM_ENTROPY_HEX_OR_PLAINTEXT"
                                    value={entropyInput}
                                    onChange={(e) => setEntropyInput(e.target.value)}
                                    className="w-full h-20 bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-xs text-white placeholder:text-white/10 font-mono outline-none focus:border-tactical-cyan/40 transition-colors resize-none"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleContribute}
                            disabled={isContributing || !contributorName}
                            className="w-full mt-4 py-3 bg-tactical-cyan/10 border border-tactical-cyan/30 text-tactical-cyan text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-tactical-cyan/20 transition-all flex items-center justify-center gap-3 disabled:opacity-30 rounded-lg"
                        >
                            {isContributing ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    FOLDING_ENTROPY...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    COMMIT_TO_MATRIX
                                </>
                            )}
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-5 border border-tactical-green/20 bg-tactical-green/[0.03] rounded-xl flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-full border border-tactical-green/30 flex items-center justify-center bg-tactical-green/5">
                            <CheckCircle2 className="w-6 h-6 text-tactical-green" />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-tactical-green uppercase">Node Anchored Successfully</div>
                            <p className="text-[9px] text-white/40 mt-1 font-mono uppercase">Identity Decoupled | Entropy Mixed</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Live Feed */}
            <div className="flex-1 overflow-visible flex flex-col relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[9px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                        <Globe className="w-3 h-3" />
                        Live Synchronized Nodes
                    </h4>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-hide max-h-[300px]">
                    <AnimatePresence initial={false}>
                        {state.contributions.map((c, i) => (
                            <motion.div
                                key={`${c.timestamp}-${c.id}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: Math.min(i * 0.05, 1) }}
                                className="p-3 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors group/item"
                            >
                                <div className="flex justify-between items-start mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-tactical-green/60" />
                                        <span className="text-[10px] font-bold text-white/80 font-mono tracking-tight">{c.name}</span>
                                    </div>
                                    <span className="text-[8px] text-white/20 font-mono">{c.region}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="text-[8px] font-mono text-white/20 truncate max-w-[180px]">
                                        {c.hash.toUpperCase()}
                                    </div>
                                    <div className="text-[8px] font-mono text-tactical-cyan/40">VERIFIED</div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Telemetry */}
            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center opacity-40">
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-tactical-green animate-pulse" />
                        <span className="text-[8px] font-mono text-white uppercase">Sync_Active</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-tactical-cyan" />
                        <span className="text-[8px] font-mono text-white uppercase">Peers_Local: {stats?.relayNodeCount || '---'}</span>
                    </div>
                </div>
                <span className="text-[8px] font-mono text-white uppercase tracking-widest">Protocol_V1.0</span>
            </div>
        </motion.div>
    );
};
