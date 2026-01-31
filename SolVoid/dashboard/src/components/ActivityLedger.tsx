"use client";

import React from 'react';
import { List, CheckCircle2, Clock, Shield, AlertTriangle, ChevronRight, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActivityItem {
    id: string;
    type: 'scan' | 'shield' | 'rescue' | 'alert';
    address: string;
    status: 'success' | 'pending' | 'failed';
    timestamp: number;
    details: string;
}

export const ActivityLedger = () => {
    const activities: ActivityItem[] = [
        {
            id: '1',
            type: 'scan',
            address: '7xkx...89p2',
            status: 'success',
            timestamp: Date.now() - 1000 * 60 * 5,
            details: 'Privacy Leak: Metadata exposure detected in instruction 0x42'
        },
        {
            id: '2',
            type: 'shield',
            address: 'VAULT_0x1',
            status: 'success',
            timestamp: Date.now() - 1000 * 60 * 15,
            details: 'Commitment hash 0x7a2... generated and verified on-chain'
        },
        {
            id: '3',
            type: 'rescue',
            address: 'Fg6P...4F5i',
            status: 'pending',
            timestamp: Date.now() - 1000 * 60 * 2,
            details: 'Atomic sweep phase 4/8: ZK Proof Generation'
        },
        {
            id: '4',
            type: 'alert',
            address: '7xkx...89p2',
            status: 'failed',
            timestamp: Date.now() - 1000 * 60 * 60 * 2,
            details: 'RPC Consensus Mismatch: Verification failed on 2 nodes'
        }
    ];

    return (
        <div className="tactical-glass h-full flex flex-col bg-black/40 border-white/5 overflow-hidden group">
            <div className="p-4 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <List className="w-4 h-4 text-tactical-green" />
                    <h3 className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">Activity_Ledger</h3>
                </div>
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
                    <input
                        type="text"
                        placeholder="Filter..."
                        className="bg-white/5 border border-white/10 rounded-md py-1 pl-7 pr-2 text-[9px] text-white/60 focus:outline-none focus:border-tactical-cyan/40 transition-colors"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
                {activities.map((item, i) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-3 border border-white/5 bg-white/[0.01] rounded-xl hover:bg-white/[0.03] transition-all group/item cursor-pointer"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex gap-3">
                                <div className={`mt-0.5 p-1.5 rounded-lg ${item.status === 'success' ? 'bg-tactical-green/10 text-tactical-green' :
                                        item.status === 'pending' ? 'bg-tactical-cyan/10 text-tactical-cyan' :
                                            'bg-tactical-red/10 text-tactical-red'
                                    }`}>
                                    {item.type === 'scan' && <Search className="w-3.5 h-3.5" />}
                                    {item.type === 'shield' && <Shield className="w-3.5 h-3.5" />}
                                    {item.type === 'rescue' && <AlertTriangle className="w-3.5 h-3.5" />}
                                    {item.type === 'alert' && <AlertTriangle className="w-3.5 h-3.5" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-white/80">{item.type.toUpperCase()}</span>
                                        <span className="text-[8px] font-mono text-white/20">{item.address}</span>
                                    </div>
                                    <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">{item.details}</p>
                                </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <div className="text-[9px] font-mono text-white/20 flex items-center justify-end gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    {new Date(item.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className={`text-[8px] font-bold mt-1 ${item.status === 'success' ? 'text-tactical-green' :
                                        item.status === 'pending' ? 'text-tactical-cyan animate-pulse' :
                                            'text-tactical-red'
                                    }`}>
                                    {item.status.toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="p-4 bg-white/[0.01] border-t border-white/5 flex justify-center">
                <button className="flex items-center gap-2 text-[9px] font-mono text-white/20 hover:text-white/40 transition-colors uppercase tracking-widest">
                    <span>Export Audit Log</span>
                    <ChevronRight className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
};
