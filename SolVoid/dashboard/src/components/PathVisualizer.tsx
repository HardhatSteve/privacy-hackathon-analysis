"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Server, Globe, ChevronRight, Share2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PathVisualizerProps {
    hops: number;
    active: boolean;
}

export const PathVisualizer = ({ hops = 3, active = false }: PathVisualizerProps) => {
    const [pathFinished, setPathFinished] = useState(false);

    useEffect(() => {
        if (active) {
            setPathFinished(false);
            const timer = setTimeout(() => setPathFinished(true), (hops + 1) * 800);
            return () => clearTimeout(timer);
        } else {
            setPathFinished(false);
        }
    }, [active, hops]);

    const regions = [
        "AMSTERDAM-01",
        "NEWYORK-04",
        "TOKYO-09",
        "FRANKFURT-02",
        "SINGAPORE-07",
        "LONDON-03"
    ];

    // Generate random path based on hops
    const generatePath = () => {
        const p = ["SOURCE_IP"];
        const availableCoords = [...regions];
        for (let i = 0; i < hops; i++) {
            const index = Math.floor(Math.random() * availableCoords.length);
            p.push(availableCoords.splice(index, 1)[0]);
        }
        p.push("SOLANA_MAINNET");
        return p;
    };

    const [currentPath, setCurrentPath] = useState<string[]>([]);

    useEffect(() => {
        if (active) {
            setCurrentPath(generatePath());
        }
    }, [active, hops]);

    return (
        <div className="tactical-glass p-0 bg-black/40 border-white/5 overflow-hidden flex flex-col h-full group">
            <div className="p-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Share2 className="w-3.5 h-3.5 text-tactical-cyan" />
                    <h3 className="text-[10px] font-bold text-white/60 uppercase tracking-widest font-mono">Onion_Path_Visualizer</h3>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-tactical-cyan font-mono">{hops} HOPS</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-tactical-cyan animate-pulse" />
                </div>
            </div>

            <div className="flex-1 p-8 flex flex-col items-center justify-center space-y-4 relative">
                {/* Background Grid for visual context */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                <div className="relative w-full max-w-md">
                    <div className="flex flex-wrap justify-center gap-x-2 sm:gap-x-4 gap-y-8 items-center relative z-10">
                        {currentPath.map((point, i) => (
                            <React.Fragment key={i}>
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={active ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                                    transition={{ delay: i * 0.4, type: 'spring' }}
                                    className="flex flex-col items-center gap-2"
                                >
                                    <div className={`
                                        w-12 h-12 rounded-xl flex items-center justify-center text-xs font-bold border
                                        ${i === 0 ? 'bg-white/5 border-white/10 text-white/40' :
                                            i === currentPath.length - 1 ? 'bg-tactical-purple/10 border-tactical-purple/30 text-tactical-purple' :
                                                'bg-tactical-cyan/10 border-tactical-cyan/30 text-tactical-cyan'}
                                        shadow-[0_0_20px_-5px_currentColor]
                                    `}>
                                        {i === 0 ? <Globe className="w-5 h-5" /> :
                                            i === currentPath.length - 1 ? <Shield className="w-5 h-5" /> :
                                                <Server className="w-5 h-5" />}
                                    </div>
                                    <span className="text-[8px] font-mono text-white/20 uppercase absolute translate-y-12">
                                        {point}
                                    </span>
                                </motion.div>

                                {i < currentPath.length - 1 && (
                                    <div className="h-0.5 w-6 sm:w-10 bg-white/5 relative bg-gradient-to-r">
                                        <motion.div
                                            initial={{ width: '0%' }}
                                            animate={active ? { width: '100%' } : { width: '0%' }}
                                            transition={{ delay: i * 0.4, duration: 0.4 }}
                                            className="h-full bg-tactical-cyan shadow-[0_0_8px_#00f3ff]"
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-4 bg-white/[0.02] border-t border-white/5">
                <AnimatePresence mode="wait">
                    {!active ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2 justify-center"
                        >
                            <Info className="w-3 h-3 text-white/20" />
                            <p className="text-[9px] text-white/40 uppercase tracking-widest font-mono">Ready for Encrypted Routing</p>
                        </motion.div>
                    ) : pathFinished ? (
                        <motion.div
                            key="final"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center space-y-1"
                        >
                            <div className="text-[10px] font-bold text-tactical-green uppercase tracking-[0.2em]">Connection Established</div>
                            <div className="text-[8px] font-mono text-white/20 uppercase">END_TO_END_ENCRYPTION: AES-256-GCM</div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="routing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-center gap-2"
                        >
                            <div className="flex gap-1">
                                {[0, 1, 2].map(d => (
                                    <motion.div
                                        key={d}
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                                        className="w-1 h-1 bg-tactical-cyan rounded-full"
                                    />
                                ))}
                            </div>
                            <span className="text-[9px] font-mono text-tactical-cyan uppercase tracking-widest animate-pulse">Relaying through Shadow Network...</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
