import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';

interface Transaction {
  id: string;
  type: string;
  status: 'queued' | 'executing' | 'completed' | 'failed';
  signature: string | null;
  timestamp: Date;
}

const TransactionTracker: React.FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // In production, this would fetch transactions from your backend or indexer
    // For demo purposes, we'll use localStorage to persist transactions
    const stored = localStorage.getItem('arcshield_transactions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setTransactions(parsed.map((t: any) => ({
          ...t,
          timestamp: new Date(t.timestamp),
        })));
      } catch (e) {
        console.error('Failed to parse stored transactions:', e);
      }
    }
  }, []);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'queued':
        return 'status-queued';
      case 'executing':
        return 'status-executing';
      case 'completed':
        return 'status-completed';
      case 'failed':
        return 'status-failed';
      default:
        return '';
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString();
  };

  if (!publicKey) {
    return null;
  }

  return (
    <div className="transaction-tracker">
      <h2>📊 Transaction History</h2>
      {transactions.length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
          No transactions yet. Complete a private transaction to see it here.
        </p>
      ) : (
        <ul className="transaction-list">
          {transactions.map((tx) => (
            <li key={tx.id} className="transaction-item">
              <div>
                <strong>{tx.type}</strong>
                <br />
                <small style={{ color: '#666' }}>
                  {formatTimestamp(tx.timestamp)}
                </small>
              </div>
              <div>
                <span className={`transaction-status ${getStatusClass(tx.status)}`}>
                  {tx.status}
                </span>
                {tx.signature && (
                  <a
                    href={`https://solscan.io/tx/${tx.signature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginLeft: '10px', color: '#667eea', textDecoration: 'none' }}
                  >
                    View →
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TransactionTracker;
