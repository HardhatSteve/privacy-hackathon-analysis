import React from 'react';

export function PoolInfo() {
    const pools = [
        { denomination: '0.1 SOL', deposits: 423, tvl: 42.3 },
        { denomination: '1 SOL', deposits: 512, tvl: 512 },
        { denomination: '10 SOL', deposits: 234, tvl: 2340 },
        { denomination: '100 SOL', deposits: 78, tvl: 7800 },
    ];

    return (
        <div className="section">
            <div className="section-header">
                <h2 className="section-title">Pools</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pools.map((pool, index) => (
                    <div key={index} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px'
                    }}>
                        <div>
                            <div style={{ fontWeight: '600' }}>{pool.denomination}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {pool.deposits} deposits
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '600', color: 'var(--accent)' }}>
                                {pool.tvl.toLocaleString()} SOL
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                TVL
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
