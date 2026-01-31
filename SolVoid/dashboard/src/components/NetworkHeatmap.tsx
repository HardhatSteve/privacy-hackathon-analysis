"use client";

import React, { useState, useEffect } from 'react';
import { Globe, Crosshair, Radar, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SHADOW_NODES } from '../../../sdk/network/shadow-rpc';

interface NodeLocation {
    id: string;
    x: number;
    y: number;
    region: string;
    isHealthy: boolean;
    latency: number;
}

const REGION_MAP: Record<string, { x: number, y: number }> = {
    'US-EAST': { x: 25, y: 35 },
    'US-WEST': { x: 15, y: 40 },
    'EU': { x: 50, y: 30 },
    'ASIA': { x: 80, y: 45 },
};

export const NetworkHeatmap = () => {
    const [nodes, setNodes] = useState<NodeLocation[]>([]);
    const [activeNode, setActiveNode] = useState<NodeLocation | null>(null);

    const refresh = async () => {
        const results = await Promise.all(SHADOW_NODES.map(async (node) => {
            const start = performance.now();
            let isHealthy = false;
            try {
                await fetch(node.url, { method: 'HEAD', mode: 'no-cors' });
                isHealthy = true;
            } catch (e) {
                isHealthy = false;
            }
            const coords = REGION_MAP[node.region];
            return {
                id: node.id,
                x: coords.x,
                y: coords.y,
                region: node.region,
                isHealthy,
                latency: Math.round(performance.now() - start)
            };
        }));
        setNodes(results);
    };

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="tactical-glass p-0 h-full flex flex-col bg-black/40 border-white/5 overflow-hidden group">
            {/* Map Header */}
            <div className="p-6 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Radar className="w-4 h-4 text-tactical-purple" />
                    <div>
                        <h3 className="text-xs font-bold text-white tracking-[0.2em] uppercase">Relay Distribution</h3>
                        <p className="text-[9px] text-white/30 font-mono mt-0.5">GEOSPATIAL_LOAD_BALANCING</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-tactical-cyan shadow-[0_0_5px_#00f0ff]" />
                        <span className="text-[8px] font-mono text-white/40 uppercase">Healthy</span>
                    </div>
                </div>
            </div>

            {/* Tactical Map Visualization */}
            <div className="flex-1 relative bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat opacity-80 border-y border-white/5 overflow-hidden">
                <svg width="100%" height="100%" viewBox="0 0 100 60" className="opacity-40">
                    <path d="M10 20 Q 30 10, 50 20 T 90 20" fill="none" stroke="white" strokeWidth="0.1" strokeDasharray="1 2" />
                    <path d="M10 40 Q 30 50, 50 40 T 90 40" fill="none" stroke="white" strokeWidth="0.1" strokeDasharray="1 2" />
                </svg>

                {nodes.map((node) => (
                    <motion.div
                        key={node.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute cursor-crosshair group/node"
                        style={{ left: `${node.x}%`, top: `${node.y}%` }}
                        onMouseEnter={() => setActiveNode(node)}
                        onMouseLeave={() => setActiveNode(null)}
                    >
                        {/* Pulse Effect */}
                        <div className={`absolute -inset-4 rounded-full border border-current opacity-0 group-hover/node:opacity-30 transform scale-0 group-hover/node:scale-100 transition-all duration-700 ${node.isHealthy ? 'text-tactical-cyan' : 'text-tactical-red'}`} />

                        <div className={`w-2.5 h-2.5 rounded-full border-2 border-black relative z-10 ${node.isHealthy ? 'bg-tactical-cyan' : 'bg-tactical-red'}`}>
                            <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-current" />
                        </div>

                        {/* Node Label (Internal) */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover/node:opacity-100 transition-opacity pointer-events-none">
                            <div className="bg-black/95 border border-white/10 px-2 py-1 rounded text-[7px] font-mono text-white/60 whitespace-nowrap backdrop-blur-md">
                                {node.region} :: {node.latency}ms
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Tactical Scan Line */}
                <motion.div
                    className="absolute inset-x-0 h-px bg-white/5"
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                />
            </div>

            {/* Metrics Footer */}
            <div className="p-4 bg-white/[0.01] flex justify-between items-center h-16">
                <AnimatePresence mode="wait">
                    {activeNode ? (
                        <motion.div
                            key={activeNode.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center gap-6"
                        >
                            <div className="space-y-0.5">
                                <span className="text-[8px] text-white/20 uppercase font-mono">Location</span>
                                <div className="text-[10px] font-bold text-white font-mono">{activeNode.region} CLUSTER</div>
                            </div>
                            <div className="space-y-0.5">
                                <span className="text-[8px] text-white/20 uppercase font-mono">Latency</span>
                                <div className="text-[10px] font-bold text-tactical-cyan font-mono">{activeNode.latency}ms</div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2"
                        >
                            <Activity className="w-3 h-3 text-white/10" />
                            <span className="text-[8px] text-white/10 uppercase tracking-widest font-mono">Select node for deep telemetry</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="text-right">
                    <span className="text-[8px] text-white/20 uppercase font-mono tracking-widest block">System Time</span>
                    <span className="text-[9px] text-white/60 font-mono tabular-nums">{new Date().toLocaleTimeString([], { hour12: false })}</span>
                </div>
            </div>
        </div>
    );
};
