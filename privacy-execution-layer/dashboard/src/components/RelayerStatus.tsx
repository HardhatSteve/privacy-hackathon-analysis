import React from 'react';

interface Relayer {
    address: string;
    fee: number;
    reputation: number;
    active: boolean;
}

interface RelayerStatusProps {
    relayers: Relayer[];
}

export function RelayerStatus({ relayers }: RelayerStatusProps) {
    return (
        <div className="section">
            <div className="section-header">
                <h2 className="section-title">Relayer Network</h2>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {relayers.filter(r => r.active).length} active
                </span>
            </div>
            <table className="table">
                <thead>
                    <tr>
                        <th>Address</th>
                        <th>Fee</th>
                        <th>Reputation</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {relayers.map((relayer, index) => (
                        <tr key={index}>
                            <td style={{ fontFamily: 'monospace' }}>{relayer.address}</td>
                            <td>{(relayer.fee / 100).toFixed(2)}%</td>
                            <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{
                                        width: '60px',
                                        height: '6px',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: '3px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${relayer.reputation / 10}%`,
                                            height: '100%',
                                            background: relayer.reputation > 700 ? 'var(--success)' :
                                                relayer.reputation > 400 ? 'var(--warning)' : 'var(--danger)',
                                            borderRadius: '3px'
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '0.875rem' }}>{relayer.reputation}</span>
                                </div>
                            </td>
                            <td>
                                <span className={`status-badge ${relayer.active ? 'success' : 'failed'}`}>
                                    {relayer.active ? 'Active' : 'Offline'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
