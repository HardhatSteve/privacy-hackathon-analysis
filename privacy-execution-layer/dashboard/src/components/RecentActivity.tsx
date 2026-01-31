import React from 'react';

interface ActivityItem {
    type: 'deposit' | 'withdraw';
    amount: number;
    time: string;
    status: string;
}

interface RecentActivityProps {
    activity: ActivityItem[];
}

export function RecentActivity({ activity }: RecentActivityProps) {
    return (
        <div className="section">
            <div className="section-header">
                <h2 className="section-title">Recent Activity</h2>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Last 24 hours
                </span>
            </div>
            <table className="table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Time</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {activity.map((item, index) => (
                        <tr key={index}>
                            <td>
                                <span style={{
                                    color: item.type === 'deposit' ? 'var(--success)' : 'var(--accent)'
                                }}>
                                    {item.type === 'deposit' ? '↓ Deposit' : '↑ Withdraw'}
                                </span>
                            </td>
                            <td>{item.amount} SOL</td>
                            <td style={{ color: 'var(--text-secondary)' }}>{item.time}</td>
                            <td>
                                <span className={`status-badge ${item.status}`}>
                                    {item.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
