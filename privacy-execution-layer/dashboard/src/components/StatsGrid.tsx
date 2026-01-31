import React from 'react';

interface StatsGridProps {
    stats: {
        totalDeposits: number;
        totalWithdraws: number;
        tvl: number;
        activeRelayers: number;
        anonymitySet: number;
    };
    loading: boolean;
}

export function StatsGrid({ stats, loading }: StatsGridProps) {
    const formatNumber = (n: number) => n.toLocaleString();
    const formatSOL = (n: number) => `${n.toLocaleString()} SOL`;

    const cards = [
        { label: 'Total Deposits', value: formatNumber(stats.totalDeposits), change: '+3.2%', positive: true },
        { label: 'Total Withdrawals', value: formatNumber(stats.totalWithdraws), change: '+2.8%', positive: true },
        { label: 'Total Value Locked', value: formatSOL(stats.tvl), change: '+5.4%', positive: true },
        { label: 'Active Relayers', value: formatNumber(stats.activeRelayers), change: '0', positive: true },
        { label: 'Anonymity Set', value: formatNumber(stats.anonymitySet), change: '+12', positive: true },
    ];

    return (
        <div className="stats-grid">
            {cards.map((card, index) => (
                <div key={index} className={`stat-card ${loading ? 'loading' : ''}`}>
                    <div className="stat-label">{card.label}</div>
                    <div className="stat-value">{card.value}</div>
                    <div className={`stat-change ${card.positive ? 'positive' : 'negative'}`}>
                        {card.change}
                    </div>
                </div>
            ))}
        </div>
    );
}
