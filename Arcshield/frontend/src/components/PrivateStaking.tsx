import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useEncryptedTransaction } from '../hooks/useEncryptedTransaction';
import { useArcium } from '../hooks/useArciumClient';

const PrivateStaking: React.FC = () => {
  const { publicKey } = useWallet();
  const { cipher, isInitialized } = useArcium();
  const { submitEncryptedTransaction, state } = useEncryptedTransaction();
  const [amount, setAmount] = useState('');
  const [action, setAction] = useState<'stake' | 'unstake'>('stake');
  const [stakingPeriod, setStakingPeriod] = useState('30'); // days

  const handleStaking = async () => {
    if (!publicKey || !cipher || !isInitialized) {
      alert('Please connect wallet and wait for Arcium initialization');
      return;
    }

    if (!amount) {
      alert('Please enter an amount');
      return;
    }

    try {
      const stakingData = {
        amount: BigInt(amount),
        action: action === 'stake' ? 0 : 1,
        staking_period: BigInt(stakingPeriod),
      };

      const serialized = new Uint8Array(17); // 8 + 1 + 8
      const amountBytes = new BigUint64Array([stakingData.amount]);
      const periodBytes = new BigUint64Array([stakingData.staking_period]);
      serialized.set(new Uint8Array(amountBytes.buffer), 0);
      serialized[8] = stakingData.action;
      serialized.set(new Uint8Array(periodBytes.buffer), 9);

      const { encrypted, nonce } = cipher!.encrypt([serialized]);

      const programId = new PublicKey('ArcShield1111111111111111111111111111111');
      await submitEncryptedTransaction('private_stake', encrypted[0], programId);
    } catch (error) {
      console.error('Staking error:', error);
    }
  };

  return (
    <div className="feature-card">
      <h2>🎯 Private Staking</h2>
      <p>Stake tokens privately with encrypted amounts and rewards</p>
      
      <div className="form-group">
        <label>Action</label>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value as 'stake' | 'unstake')}
          disabled={!isInitialized || state.status !== 'idle'}
          style={{ width: '100%', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '6px' }}
        >
          <option value="stake">Stake</option>
          <option value="unstake">Unstake</option>
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

      {action === 'stake' && (
        <div className="form-group">
          <label>Staking Period (days)</label>
          <input
            type="number"
            value={stakingPeriod}
            onChange={(e) => setStakingPeriod(e.target.value)}
            placeholder="30"
            disabled={!isInitialized || state.status !== 'idle'}
          />
        </div>
      )}

      <button
        onClick={handleStaking}
        disabled={!isInitialized || state.status !== 'idle' || !amount}
      >
        {state.status === 'idle' && `${action === 'stake' ? 'Stake' : 'Unstake'} Privately`}
        {state.status === 'encrypting' && 'Encrypting...'}
        {state.status === 'queued' && 'Queued...'}
        {state.status === 'executing' && 'Executing...'}
        {state.status === 'completed' && 'Complete!'}
        {state.status === 'error' && 'Failed'}
      </button>

      {state.status === 'completed' && (
        <div className="status-message status-success">
          {action === 'stake' ? 'Staking' : 'Unstaking'} completed!
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

export default PrivateStaking;
