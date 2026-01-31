"use client";

import React, { useState, useEffect } from 'react';
import {
    Zap,
    ShieldAlert,
    Terminal,
    Settings,
    Target,
    Cpu,
    Activity,
    ChevronRight,
    Loader2,
    ShieldCheck,
    Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MevStats {
    bundleId: string | null;
    status: 'idle' | 'pending' | 'confirmed' | 'failed';
    tip: number;
    latency: number;
    endpoint: string;
}

interface TacticalOperationsProps {
    onRescue: (options: any) => Promise<void>;
    loading: boolean;
}

export const TacticalOperations = ({ onRescue, loading }: TacticalOperationsProps) => {
    const [mevStats, setMevStats] = useState<MevStats>({
        bundleId: null,
        status: 'idle',
        tip: 0.0001,
        latency: 42,
        endpoint: 'Mainnet-NY'
    });

    const [logs, setLogs] = useState<{ id: string, msg: string, type: 'info' | 'warn' | 'error' | 'success' }[]>([]);
    const [settings, setSettings] = useState({
        rentRecovery: true,
        sweepAll: true,
        emergencyMode: false,
        useCompression: true,
        priorityFee: 0.001
    });

    const [viewingKey, setViewingKey] = useState<string | null>(null);
    const [bridgeTarget, setBridgeTarget] = useState<'base' | 'ethereum' | 'none'>('none');

    const addLog = (msg: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
        setLogs(prev => [{ id: Math.random().toString(), msg, type }, ...prev].slice(0, 50));
    };

    useEffect(() => {
        if (loading) {
            addLog("Initializing Atomic Rescue Engine...", 'info');
            addLog("PHASE 1: Scanning for burner bots...", 'warn');
            addLog("PHASE 2: Mapping Associated Token Accounts...", 'info');
        }
    }, [loading]);

    const handleExecute = async () => {
        addLog(`Initiating Rescue Operation [Emergency=${settings.emergencyMode}]`, 'warn');
        try {
            await onRescue(settings);
            addLog("Rescue Complete: All assets secured.", 'success');
        } catch (e: any) {
            addLog(`Rescue Failed: ${e.message}`, 'error');
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            {/* Left: Advanced Controls */}
            <div className="lg:col-span-5 space-y-6">
                <div className="tactical-glass p-6 border-tactical-cyan/20 bg-black/40">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-tactical-cyan/10 rounded-lg">
                            <Settings className="w-5 h-5 text-tactical-cyan" />
                        </div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Advanced Rescue Settings</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border border-white/5 bg-white/[0.02] rounded-xl">
                            <div>
                                <p className="text-xs font-bold text-white/80">Rent Recovery</p>
                                <p className="text-[10px] text-white/40">Close empty ATAs to reclaim SOL</p>
                            </div>
                            <button
                                onClick={() => setSettings(s => ({ ...s, rentRecovery: !s.rentRecovery }))}
                                className={`w-10 h-5 rounded-full relative transition-colors ${settings.rentRecovery ? 'bg-tactical-green/20' : 'bg-white/5'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${settings.rentRecovery ? 'right-1 bg-tactical-green' : 'left-1 bg-white/20'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 border border-white/5 bg-white/[0.02] rounded-xl">
                            <div>
                                <p className="text-xs font-bold text-white/80">Sweep All Assets</p>
                                <p className="text-[10px] text-white/40">Detect and rescue hidden SPL tokens</p>
                            </div>
                            <button
                                onClick={() => setSettings(s => ({ ...s, sweepAll: !s.sweepAll }))}
                                className={`w-10 h-5 rounded-full relative transition-colors ${settings.sweepAll ? 'bg-tactical-cyan/20' : 'bg-white/5'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${settings.sweepAll ? 'right-1 bg-tactical-cyan' : 'left-1 bg-white/20'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 border border-tactical-red/20 bg-tactical-red/5 rounded-xl">
                            <div>
                                <p className="text-xs font-bold text-tactical-red">Emergency Alpha Mode</p>
                                <p className="text-[10px] text-tactical-red/50">Maximum Jito tips, bypass all safety wait times</p>
                            </div>
                            <button
                                onClick={() => {
                                    setSettings(s => ({ ...s, emergencyMode: !s.emergencyMode }));
                                    if (!settings.emergencyMode) addLog("CRITICAL: Emergency Alpha Mode Activated", 'error');
                                }}
                                className={`w-10 h-5 rounded-full relative transition-colors ${settings.emergencyMode ? 'bg-tactical-red/40' : 'bg-white/5'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${settings.emergencyMode ? 'right-1 bg-tactical-red' : 'left-1 bg-white/20'}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 border border-white/5 bg-white/[0.02] rounded-xl">
                            <div>
                                <p className="text-xs font-bold text-white/80">ZK-Compression (Scaling)</p>
                                <p className="text-[10px] text-white/40">Use Light Protocol to save 99% on rent</p>
                            </div>
                            <button
                                onClick={() => setSettings(s => ({ ...s, useCompression: !s.useCompression }))}
                                className={`w-10 h-5 rounded-full relative transition-colors ${settings.useCompression ? 'bg-tactical-purple/20' : 'bg-white/5'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 rounded-full transition-all ${settings.useCompression ? 'right-1 bg-tactical-purple' : 'left-1 bg-white/20'}`} />
                            </button>
                        </div>

                        <div className="pt-2">
                            <div className="flex justify-between mb-2">
                                <label className="text-[10px] uppercase tracking-widest text-white/40">Priority Fee (SOL)</label>
                                <span className="text-[10px] font-mono text-tactical-cyan">{settings.priorityFee} SOL</span>
                            </div>
                            <input
                                type="range"
                                min="0.0001"
                                max="0.01"
                                step="0.0001"
                                value={settings.priorityFee}
                                onChange={(e) => setSettings(s => ({ ...s, priorityFee: parseFloat(e.target.value) }))}
                                className="w-full accent-tactical-cyan"
                            />
                        </div>

                        <button
                            disabled={loading}
                            onClick={handleExecute}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-tactical-cyan text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-white transition-all disabled:opacity-50 group"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4 group-hover:scale-125 transition-transform" />}
                            Execute Atomic Rescue
                        </button>
                    </div>
                </div>

                {/* Viewing Key / Selective Disclosure */}
                <div className="tactical-glass p-5 border-tactical-cyan/20 bg-black/40">
                    <div className="flex items-center gap-3 mb-4">
                        <ShieldCheck className="w-4 h-4 text-tactical-cyan" />
                        <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Selective Disclosure</h4>
                    </div>
                    <div className="space-y-3">
                        <p className="text-[9px] text-white/40 leading-relaxed">Generate a Viewing Key to prove clean funds to third parties without revealing full history.</p>
                        {viewingKey ? (
                            <div className="p-2 bg-white/5 border border-white/10 rounded font-mono text-[9px] break-all text-tactical-cyan">
                                {viewingKey}
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    const key = Array.from(crypto.getRandomValues(new Uint8Array(20))).map(b => b.toString(16).padStart(2, '0')).join('');
                                    setViewingKey(`solvoid_view_${key}`);
                                    addLog("Viewing Key generated for active session.", 'success');
                                }}
                                className="w-full py-2 bg-white/5 border border-white/10 text-[9px] text-white/60 hover:text-white transition-colors uppercase font-bold"
                            >
                                Generate Viewing Key
                            </button>
                        )}
                    </div>
                </div>

                {/* Shadow Bridge (Cross-Chain) */}
                <div className="tactical-glass p-5 border-tactical-purple/20 bg-black/40">
                    <div className="flex items-center gap-3 mb-4">
                        <Coins className="w-4 h-4 text-tactical-purple" />
                        <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Shadow Bridge</h4>
                    </div>
                    <div className="flex gap-2 mb-3">
                        {(['none', 'base', 'ethereum'] as const).map(chain => (
                            <button
                                key={chain}
                                onClick={() => setBridgeTarget(chain)}
                                className={`flex-1 py-1.5 rounded text-[8px] font-bold uppercase transition-all ${bridgeTarget === chain ? 'bg-tactical-purple text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                            >
                                {chain}
                            </button>
                        ))}
                    </div>
                    <p className="text-[8px] text-white/20 font-mono italic">
                        {bridgeTarget === 'none' ? 'Local Solana Rescue Only' : `Shield on Solana → Withdraw on ${bridgeTarget.toUpperCase()}`}
                    </p>
                </div>
            </div>

            {/* Right: Atomic Console */}
            <div className="lg:col-span-7 flex flex-col h-[500px] lg:h-auto">
                <div className="tactical-glass flex-1 p-0 flex flex-col border-white/5 bg-black/60 overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Terminal className="w-4 h-4 text-white/40" />
                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest font-mono">Mission_Log v2.4</span>
                        </div>
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-tactical-red/20 border border-tactical-red/30"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-tactical-purple/20 border border-tactical-purple/30"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-tactical-cyan/20 border border-tactical-cyan/30"></div>
                        </div>
                    </div>

                    <div className="flex-1 p-4 font-mono space-y-2 overflow-y-auto scrollbar-hide text-[11px]">
                        <AnimatePresence initial={false}>
                            {logs.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
                                    <Activity className="w-12 h-12 text-white animate-pulse" />
                                    <p className="uppercase tracking-[0.3em]">Awaiting Instruction</p>
                                </div>
                            ) : (
                                logs.map((log) => (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex gap-3 items-start"
                                    >
                                        <span className="text-white/20">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                                        <span className={`
                                            ${log.type === 'error' ? 'text-tactical-red' :
                                                log.type === 'warn' ? 'text-tactical-purple' :
                                                    log.type === 'success' ? 'text-tactical-green' : 'text-white/60'}
                                        `}>
                                            {log.type === 'error' && 'ERR_'}
                                            {log.type === 'warn' && 'WRN_'}
                                            {log.msg}
                                        </span>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="p-3 border-t border-white/5 bg-black/40">
                        <div className="flex items-center gap-3 text-[9px] text-white/20 font-mono">
                            <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-tactical-cyan rounded-sm animate-pulse" />
                                <span>PID: 8192</span>
                            </div>
                            <span>|</span>
                            <span>THREAD: RESCUE_MAIN</span>
                            <span>|</span>
                            <div className="flex items-center gap-1">
                                <Cpu className="w-3 h-3" />
                                <span>WASM_LOADED</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
