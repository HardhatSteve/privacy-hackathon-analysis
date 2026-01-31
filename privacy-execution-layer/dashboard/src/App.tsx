import React, { useState, useEffect } from 'react';
import { StatsGrid } from './components/StatsGrid';
import { RecentActivity } from './components/RecentActivity';
import { RelayerStatus } from './components/RelayerStatus';
import { PoolInfo } from './components/PoolInfo';

// Mock data for demo
const MOCK_STATS = {
    totalDeposits: 1247,
    totalWithdraws: 1089,
    tvl: 15840.5,
    activeRelayers: 12,
    anonymitySet: 158,
};

const MOCK_ACTIVITY = [
    { type: 'deposit', amount: 1, time: '2 mins ago', status: 'confirmed' },
    { type: 'withdraw', amount: 10, time: '5 mins ago', status: 'confirmed' },
    { type: 'deposit', amount: 0.1, time: '8 mins ago', status: 'confirmed' },
    { type: 'withdraw', amount: 1, time: '12 mins ago', status: 'confirmed' },
    { type: 'deposit', amount: 100, time: '15 mins ago', status: 'confirmed' },
];

const MOCK_RELAYERS = [
    { address: '7xKXt...3nPq', fee: 50, reputation: 950, active: true },
    { address: '9sLMz...8kWr', fee: 30, reputation: 890, active: true },
    { address: '4pRqN...2mVx', fee: 75, reputation: 780, active: true },
    { address: '2hJXy...5tBs', fee: 100, reputation: 650, active: false },
];

function App() {
    const [stats, setStats] = useState(MOCK_STATS);
    const [activity, setActivity] = useState(MOCK_ACTIVITY);
    const [relayers, setRelayers] = useState(MOCK_RELAYERS);
    const [loading, setLoading] = useState(false);
    const [network, setNetwork] = useState('devnet');

    const refreshData = async () => {
        setLoading(true);
        // In production: fetch from Solana RPC
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStats(prev => ({
            ...prev,
            totalDeposits: prev.totalDeposits + Math.floor(Math.random() * 3),
            totalWithdraws: prev.totalWithdraws + Math.floor(Math.random() * 2),
        }));
        setLoading(false);
    };

    useEffect(() => {
        // Auto-refresh every 30s
        const interval = setInterval(refreshData, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="dashboard">
            <header className="header">
                <div className="logo">
                    <span className="logo-icon">🔐</span>
                    <span>Privacy Execution Layer</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span className="network-badge">{network.toUpperCase()}</span>
                    <button
                        className="refresh-btn"
                        onClick={refreshData}
                        disabled={loading}
                    >
                        {loading ? '⟳ Refreshing...' : '⟳ Refresh'}
                    </button>
                </div>
            </header>

            <StatsGrid stats={stats} loading={loading} />

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <RecentActivity activity={activity} />
                <PoolInfo />
            </div>

            <RelayerStatus relayers={relayers} />

            <footer style={{
                textAlign: 'center',
                padding: '2rem',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem'
            }}>
                <p>⚠️ Experimental Software — Not Audited</p>
                <p style={{ marginTop: '0.5rem' }}>
                    GitHub Only • No Discord • No Telegram
                </p>
            </footer>
        </div>
    );
}

export default App;
