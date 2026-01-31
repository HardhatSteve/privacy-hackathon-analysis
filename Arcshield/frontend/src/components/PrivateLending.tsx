import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useEncryptedTransaction } from '../hooks/useEncryptedTransaction';
import { useArcium } from '../hooks/useArciumClient';

const PrivateLending: React.FC = () => {
  const { publicKey } = useWallet();
  const { cipher, isInitialized } = useArcium();
  const { submitEncryptedTransaction, state } = useEncryptedTransaction();
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState<'lend' | 'borrow'>('lend');
  const [interestRate, setInterestRate] = useState('500'); // 5% default

  const handleLending = async () => {
    if (!publicKey || !cipher || !isInitialized) {
      alert('Please connect wallet and wait for Arcium initialization');
      return;
    }

    if (!amount) {
      alert('Please enter an amount');
      return;
    }

    try {
      const lendingData = {
        amount: BigInt(amount),
        action: action === 'lend' ? 0 : 1,
        interest_rate: BigInt(interestRate),
      };

      const serialized = new Uint8Array(17); // 8 + 1 + 8
      const amountBytes = new BigUint64Array([lendingData.amount]);
      const interestBytes = new BigUint64Array([lendingData.interest_rate]);
      serialized.set(new Uint8Array(amountBytes.buffer), 0);
      serialized[8] = lendingData.action;
      serialized.set(new Uint8Array(interestBytes.buffer), 9);

      const { encrypted, nonce } = cipher!.encrypt([serialized]);

      const programId = new PublicKey('ArcShield1111111111111111111111111111111');
      await submitEncryptedTransaction('private_lend', encrypted[0], programId);
    } catch (error) {
      console.error('Lending error:', error);
    }
  };

  return (
    <div className="feature-card">
      <h2>💰 Private Lending</h2>
      <p>Lend or borrow tokens with encrypted amounts and interest rates</p>
      
      <div className="form-group">
        <label>Action</label>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value as 'lend' | 'borrow')}
          disabled={!isInitialized || state.status !== 'idle'}
          style={{ width: '100%', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '6px' }}
        >
          <option value="lend">Lend</option>
          <option value="borrow">Borrow</option>
        </select>
      </div>

      <div className="form-group">
        <label>Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          disabled={!isInitialized || state.status !== 'idle'}
        />
      </div>

      <div className="form-group">
        <label>Interest Rate (basis points, e.g., 500 = 5%)</label>
        <input
          type="number"
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
          placeholder="500"
          disabled={!isInitialized || state.status !== 'idle'}
        />
      </div>

      <button
        onClick={handleLending}
        disabled={!isInitialized || state.status !== 'idle' || !amount}
      >
        {state.status === 'idle' && `${action === 'lend' ? 'Lend' : 'Borrow'} Privately`}
        {state.status === 'encrypting' && 'Encrypting...'}
        {state.status === 'queued' && 'Queued...'}
        {state.status === 'executing' && 'Executing...'}
        {state.status === 'completed' && 'Complete!'}
        {state.status === 'error' && 'Failed'}
      </button>

      {state.status === 'completed' && (
        <div className="status-message status-success">
          {action === 'lend' ? 'Lending' : 'Borrowing'} completed!
        </div>
      )}

      {state.status === 'error' && state.error && (
        <div className="status-message status-error">
          Error: {state.error}
        </div>
      )}
    </div>
  );
};

export default PrivateLending;
