"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { SkeletonRadar } from './Skeleton';

interface PrivacyRadarProps {
    score?: number;
    loading?: boolean;
}

export const PrivacyRadar = ({ score, loading }: PrivacyRadarProps) => {
    const displayScore = score ?? 100;
    const normalizedScore = Math.min(100, Math.max(0, displayScore));

    const { color, status } = useMemo(() => {
        if (normalizedScore >= 80) return { color: '#00ff88', status: 'SECURE' };
        if (normalizedScore >= 50) return { color: '#ffcc00', status: 'CAUTION' };
        return { color: '#ff003c', status: 'CRITICAL' };
    }, [normalizedScore]);

    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const progress = (normalizedScore / 100) * circumference;
    const offset = circumference - progress;

    if (loading) return <SkeletonRadar />;

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="tactical-glass p-6 flex flex-col items-center"
        >
            <div className="w-full flex items-center justify-between mb-6">
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest">Protocol Trust</h3>
                <span className={`badge ${normalizedScore >= 80 ? 'badge-green' :
                        normalizedScore >= 50 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                            'badge-red'
                    }`}>
                    {status}
                </span>
            </div>

            <div className="relative w-32 h-32 sm:w-36 sm:h-36 mx-auto mb-4">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="50%" cy="50%" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                    <motion.circle
                        cx="50%" cy="50%" r="52" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
                        strokeDasharray="326.7256359733385" initial={{ strokeDashoffset: 326.7256359733385 }}
                        animate={{ strokeDashoffset: 0 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tighter text-tactical-green">{displayScore}</span>
                  <span className="text-xs text-white/30 uppercase font-mono">Privacy Index</span>
                </div>
              </div>

            <div className="w-full mt-8 space-y-4">
                <div>
                    <div className="flex justify-between text-[10px] text-white/40 uppercase mb-2">
                        <span>Cluster Integrity</span>
                        <span>{normalizedScore}%</span>
                    </div>
                    <div className="progress-bar">
                        <motion.div
                            className="progress-fill" style={{ backgroundColor: color }}
                            initial={{ width: 0 }} animate={{ width: `${normalizedScore}%` }}
                        />
                    </div>
                </div>
                <p className="text-[9px] text-white/20 text-center uppercase tracking-[0.2em] pt-2 border-t border-white/5">
                    No simulated metrics active
                </p>
            </div>
        </motion.div>
    );
};
