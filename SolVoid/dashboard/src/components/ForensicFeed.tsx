"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    Shield,
    Zap,
    FileWarning,
    ExternalLink,
    Loader2,
    CheckCircle2,
    Crosshair,
    Skull,
    Activity,
    Fingerprint,
    Search
} from 'lucide-react';
import { SkeletonFeed } from './Skeleton';
import { useToast } from './Toast';

import { ScanResult } from '../../../sdk/pipeline';
import { Leak } from '../../../sdk/types';

type EnrichedLeak = Leak & { signature: string };

interface ForensicFeedProps {
    leaks: readonly ScanResult[];
    onRescue: () => Promise<any>;
    loading: boolean;
}

export const ForensicFeed = ({ leaks, onRescue, loading }: ForensicFeedProps) => {
    const [mounted, setMounted] = useState(false);
    const [isRescuing, setIsRescuing] = useState(false);
    const { success, error: showError } = useToast();

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const handleRescue = async () => {
        setIsRescuing(true);
        try {
            await onRescue();
            success('Rescue Successful', 'All compromised assets have been moved to the Shadow Vault.');
        } catch (err) {
            showError('Rescue Failed', 'The surgical rescue operation was interrupted by the network.');
        } finally {
            setIsRescuing(false);
        }
    };

    // Flatten leaks from results with safety check
    const flatLeaks: EnrichedLeak[] = leaks.flatMap(r => 
        (r.leaks || []).map(l => ({ ...l, signature: r.signature || 'unknown' }))
    );
    const hasCritical = flatLeaks.some(l => l.severity === 'CRITICAL' || l.severity === 'HIGH');

    if (!mounted) return <SkeletonFeed />;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="tactical-glass p-6 flex flex-col h-full bg-black/40 relative overflow-hidden group"
        >
            {/* Background scanner pulse */}
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] transition-colors duration-1000 ${hasCritical ? 'bg-tactical-red/20' : leaks.length > 0 ? 'bg-yellow-500/10' : 'bg-tactical-green/10'}`} />

            {/* Header */}
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${hasCritical ? 'bg-tactical-red/10 border-tactical-red/30' : 'bg-tactical-cyan/10 border-tactical-cyan/30'}`}>
                        {hasCritical ? <Skull className="w-5 h-5 text-tactical-red" /> : <Search className="w-5 h-5 text-tactical-cyan" />}
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-white tracking-[0.2em] uppercase">Forensic Feed</h3>
                        <p className="text-[9px] text-white/30 font-mono mt-0.5">DEEP_PACKET_INSPECTION_LIVE</p>
                    </div>
                </div>
                {flatLeaks.length > 0 && (
                    <div className={`px-2 py-1 rounded-md text-[9px] font-bold font-mono border ${hasCritical ? 'bg-tactical-red/10 text-tactical-red border-tactical-red/20 animate-pulse' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}`}>
                        {hasCritical ? 'THREAT_CRITICAL' : 'ANOMALIES_DETECTED'}
                    </div>
                )}
            </div>

            {/* Main Rescue Action */}
            <AnimatePresence>
                {flatLeaks.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mb-6"
                    >
                        <div className={`p-5 rounded-2xl border ${hasCritical ? 'bg-tactical-red/[0.03] border-tactical-red/20' : 'border-white/5 bg-white/[0.02]'}`}>
                            <div className="flex items-center gap-4 mb-4">
                                <Activity className={`w-4 h-4 ${hasCritical ? 'text-tactical-red' : 'text-white/40'}`} />
                                <span className="text-[10px] text-white/60 font-mono uppercase tracking-[0.1em]">Targeted Asset Recovery Suggested</span>
                            </div>
                            <button
                                onClick={handleRescue}
                                disabled={isRescuing}
                                className={`w-full py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${hasCritical
                                    ? 'bg-tactical-red/20 text-tactical-red border border-tactical-red/30 hover:bg-tactical-red/30'
                                    : 'bg-tactical-cyan/10 text-tactical-cyan border border-tactical-cyan/20 hover:bg-tactical-cyan/20'
                                    }`}
                            >
                                {isRescuing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={14} />}
                                {isRescuing ? 'EXECUTING_SURGICAL_EXTRACTION...' : 'INITIATE_PROTOCOL_RESCUE'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Findings List */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="text-[9px] text-white/20 font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Crosshair size={10} />
                    <span>Inspection Results</span>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-hide">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
                        </div>
                    ) : flatLeaks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl p-10 opacity-30 grayscale">
                            <Fingerprint size={48} className="mb-4 text-tactical-cyan" />
                            <p className="text-[10px] font-mono tracking-[0.3em] text-white/60">NO_LEAKS_IDENTIFIED</p>
                            <p className="text-[8px] mt-2 font-mono text-white/20">Identity integrity verified at cluster depth.</p>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {flatLeaks.map((leak, idx) => (
                                <motion.div
                                    key={`${leak.signature}-${idx}`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="p-4 border border-white/5 bg-white/[0.01] rounded-xl hover:bg-white/[0.03] transition-all relative overflow-hidden group/leak"
                                >
                                    {/* Small red indicator for critical leaks */}
                                    {leak.severity === 'CRITICAL' && (
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-tactical-red/5 blur-xl group-hover/leak:bg-tactical-red/10 transition-colors" />
                                    )}

                                    <div className="flex justify-between items-start mb-2 relative z-10">
                                        <div className="flex items-center gap-2">
                                            {leak.severity === 'CRITICAL' || leak.severity === 'HIGH' ? (
                                                <AlertTriangle size={12} className="text-tactical-red" />
                                            ) : (
                                                <FileWarning size={12} className="text-yellow-500" />
                                            )}
                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${leak.severity === 'CRITICAL' ? 'text-tactical-red' :
                                                leak.severity === 'HIGH' ? 'text-tactical-red/80' :
                                                    'text-yellow-500/80'
                                                }`}>
                                                {leak.type}
                                            </span>
                                        </div>
                                        <div className="text-[8px] font-mono text-white/20">{leak.severity}</div>
                                    </div>

                                    <p className="text-[11px] text-white/70 leading-relaxed mb-3 pr-4">
                                        {leak.description}
                                    </p>

                                    {leak.signature && (
                                        <div className="flex items-center justify-between border-t border-white/5 pt-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-white/20" />
                                                <span className="text-[8px] font-mono text-white/20 truncate max-w-[120px]">
                                                    {leak.signature}
                                                </span>
                                            </div>
                                            <a
                                                href={`https://explorer.solana.com/tx/${leak.signature}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1 hover:bg-white/5 rounded text-white/30 hover:text-white transition-all"
                                            >
                                                <ExternalLink size={10} />
                                            </a>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            {/* Sub-telemetry */}
            <div className="mt-6 flex justify-between items-center bg-white/[0.02] border-t border-white/5 p-3 -mx-6 -mb-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 grayscale opacity-50">
                        <CheckCircle2 size={10} className="text-tactical-green" />
                        <span className="text-[8px] font-mono text-white uppercase">Heuristic_Engine_ON</span>
                    </div>
                </div>
                <div className="text-[8px] font-mono text-white/20 hover:text-white/40 cursor-default transition-colors">
                    SCAN_TIME: {new Date().toLocaleTimeString([], { hour12: false })}
                </div>
            </div>
        </motion.div>
    );
};
