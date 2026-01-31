import React from 'react';
import { Clock, TrendingUp, TrendingDown, Repeat, Shield, AlertTriangle, Eye } from 'lucide-react';
import type { TransactionSummary } from '../types/api';

interface TimelineViewProps {
    transactions: TransactionSummary[];
    cexConnections: string[];
}

const TimelineView: React.FC<TimelineViewProps> = ({ transactions, cexConnections }) => {
    if (!transactions || transactions.length === 0) {
        return (
            <div className="p-12 rounded-[3rem] bg-secondary/30 border border-border text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No recent transactions to display</p>
            </div>
        );
    }

    const getActivityIcon = (type: string) => {
        if (type.includes('SWAP') || type.includes('TRADE')) return TrendingUp;
        if (type.includes('TRANSFER')) return Repeat;
        return Shield;
    };

    const getActivityColor = (type: string, description: string) => {
        // Check if transaction involves CEX
        const involvesCEX = cexConnections.some(cex =>
            description.toLowerCase().includes(cex.toLowerCase())
        );

        if (involvesCEX) return 'text-red-400 bg-red-400/10 border-red-400/20';
        if (type.includes('SWAP')) return 'text-solana-green bg-solana-green/10 border-solana-green/20';
        return 'text-solana-purple bg-solana-purple/10 border-solana-purple/20';
    };

    const getSurveillanceWarning = (type: string, description: string) => {
        const involvesCEX = cexConnections.some(cex =>
            description.toLowerCase().includes(cex.toLowerCase())
        );

        if (involvesCEX) {
            return {
                level: 'high',
                message: '🔴 HIGH EXPOSURE: This transaction can link your identity to this wallet via KYC',
            };
        }

        if (type.includes('SWAP')) {
            return {
                level: 'medium',
                message: '🟡 MEDIUM EXPOSURE: Trading patterns and amounts are publicly visible to MEV bots',
            };
        }

        return {
            level: 'low',
            message: '🟢 LOW EXPOSURE: Standard transaction - still publicly visible forever',
        };
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-6">
                <div className="space-y-2">
                    <h3 className="text-2xl font-black uppercase tracking-tighter">Surveillance Timeline</h3>
                    <p className="text-sm text-muted-foreground font-black uppercase tracking-[0.3em]">
                        Your Last {transactions.length} Public Transactions
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <Eye className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-black text-yellow-500 uppercase tracking-[0.2em]">Forever Visible</span>
                </div>
            </div>

            {/* Timeline */}
            <div className="relative space-y-4">
                {/* Timeline line */}
                <div className="absolute left-[47px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-solana-purple via-solana-green to-transparent opacity-20" />

                {transactions.map((tx, idx) => {
                    const Icon = getActivityIcon(tx.type);
                    const colorClass = getActivityColor(tx.type, tx.description);
                    const surveillance = getSurveillanceWarning(tx.type, tx.description);

                    return (
                        <div key={idx} className="relative pl-24 animate-in fade-in slide-in-from-left duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                            {/* Timeline node */}
                            <div className={`absolute left-8 top-6 w-8 h-8 rounded-xl ${colorClass} border-2 flex items-center justify-center z-10`}>
                                <Icon className="w-4 h-4" />
                            </div>

                            {/* Content card */}
                            <div className={`p-6 rounded-[2rem] border-2 ${surveillance.level === 'high' ? 'bg-red-500/5 border-red-500/30' :
                                    surveillance.level === 'medium' ? 'bg-yellow-500/5 border-yellow-500/20' :
                                        'bg-secondary/30 border-border'
                                } space-y-4 hover:scale-[1.02] transition-all`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 bg-secondary/50 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-border">
                                                {tx.type}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-mono">{tx.date}</span>
                                        </div>
                                        <p className="text-sm font-medium text-foreground">{tx.description}</p>
                                        {tx.amountUsd > 0 && (
                                            <p className="text-lg font-black tracking-tight text-solana-green">
                                                ${tx.amountUsd.toLocaleString()} USD
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Surveillance warning */}
                                <div className={`p-4 rounded-xl border ${surveillance.level === 'high' ? 'bg-red-500/10 border-red-500/20' :
                                        surveillance.level === 'medium' ? 'bg-yellow-500/10 border-yellow-500/20' :
                                            'bg-secondary/50 border-border'
                                    }`}>
                                    <div className="flex items-start gap-3">
                                        {surveillance.level === 'high' ? (
                                            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                                        ) : (
                                            <Eye className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                                        )}
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold">{surveillance.message}</p>
                                            {surveillance.level === 'high' && (
                                                <p className="text-[10px] text-muted-foreground">
                                                    This transaction creates a permanent link between your wallet and your KYC identity.
                                                    Anyone with access to exchange data can now trace all your other transactions.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-yellow-500/10 to-red-500/10 border border-yellow-500/20 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
                        <Eye className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xl font-black tracking-tight">All of This is Public Forever</h4>
                        <p className="text-sm text-muted-foreground">Anyone can analyze these patterns right now</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
                    <div className="space-y-1">
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Who Can See This</p>
                        <p className="text-sm font-medium">Governments, hackers, competitors, employers, anyone</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">For How Long</p>
                        <p className="text-sm font-medium">Forever - blockchain data never expires</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Can You Delete It</p>
                        <p className="text-sm font-medium text-red-400">No - it's permanent and immutable</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimelineView;
