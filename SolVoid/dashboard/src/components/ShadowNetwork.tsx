"use client";

import React, { useState, useEffect } from 'react';
import { Globe, RefreshCw, Server, Activity, Shield, SignalHigh, SignalLow, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SHADOW_NODES } from '../../../sdk/network/shadow-rpc';

interface ShadowNode {
    id: string;
    region: string;
    latency?: number;
    isHealthy: boolean;
}

export const ShadowNetwork = () => {
    const [nodes, setNodes] = useState<ShadowNode[]>([]);
    const [loading, setLoading] = useState(false);

    const refresh = async () => {
        setLoading(true);
        const results = await Promise.all(SHADOW_NODES.map(async (node) => {
            const start = performance.now();
            let isHealthy = false;
            try {
                const res = await fetch(node.url, { method: 'HEAD', mode: 'no-cors' });
                isHealthy = true;
            } catch (e) {
                isHealthy = false;
            }
            return {
                id: node.id,
                region: node.region,
                latency: isHealthy ? Math.round(performance.now() - start) : undefined,
                isHealthy
            };
        }));
        setNodes(results);
        setLoading(false);
    };

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 60000); // Sync every minute
        return () => clearInterval(interval);
    }, []);

    const healthyCount = nodes.filter(n => n.isHealthy).length;

    return (
        <div className="tactical-glass p-0 h-full flex flex-col bg-black/40 border-white/5 overflow-hidden group">
            <div className="p-6 pb-4 flex items-center justify-between border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-tactical-cyan/10 border border-tactical-cyan/20 flex items-center justify-center relative">
                        <Globe className="w-5 h-5 text-tactical-cyan" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-tactical-cyan rounded-full animate-ping" />
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-white tracking-[0.2em] uppercase">Shadow Relay</h3>
                        <p className="text-[9px] text-white/30 font-mono mt-0.5">IP_ANONYMIZATION_ACTIVE</p>
                    </div>
                </div>
                <button
                    onClick={refresh}
                    className="p-2 hover:bg-white/5 rounded-lg transition-all"
                >
                    <RefreshCw className={`w-3.5 h-3.5 text-white/30 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4 border-b border-white/5 bg-white/[0.02]">
                <div className="space-y-1">
                    <span className="text-[8px] text-white/20 uppercase font-mono tracking-widest">Availability</span>
                    <div className="text-lg font-bold text-white tabular-nums">{healthyCount} / {SHADOW_NODES.length}</div>
                </div>
                <div className="space-y-1">
                    <span className="text-[8px] text-white/20 uppercase font-mono tracking-widest">Privacy Hops</span>
                    <div className="text-lg font-bold text-tactical-purple tabular-nums">3 (AES-256)</div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide py-6">
                <AnimatePresence mode="popLayout">
                    {nodes.map((node, i) => (
                        <motion.div
                            key={node.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="p-3 border border-white/5 bg-white/[0.01] rounded-xl hover:bg-white/[0.03] transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-lg ${node.isHealthy ? 'bg-tactical-green/10 text-tactical-green' : 'bg-tactical-red/10 text-tactical-red'}`}>
                                        <Server className="w-3 h-3" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-white/80 font-mono">{node.region}</div>
                                        <div className="text-[8px] text-white/20 font-mono">NODE_{node.id.split('-').pop()?.toUpperCase()}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-[9px] font-bold font-mono ${node.isHealthy ? 'text-tactical-green' : 'text-tactical-red'}`}>
                                        {node.isHealthy ? 'OPERATIONAL' : 'OFFLINE'}
                                    </div>
                                    {node.latency && (
                                        <div className="flex items-center justify-end gap-1 mt-1">
                                            <SignalHigh className="w-2.5 h-2.5 text-white/10" />
                                            <span className="text-[8px] text-white/40 font-mono">{node.latency}ms</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="p-4 border-t border-white/5 bg-white/[0.01] flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Lock className="w-3 h-3 text-tactical-cyan/40" />
                    <span className="text-[8px] font-mono text-white/20 uppercase">Onion Routing Protocol V1</span>
                </div>
                <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-tactical-cyan"
                        animate={{ width: ['0%', '100%'] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    />
                </div>
            </div>
        </div>
    );
};
