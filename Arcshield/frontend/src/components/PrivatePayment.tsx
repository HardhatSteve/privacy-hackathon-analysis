import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useEncryptedTransaction } from '../hooks/useEncryptedTransaction';
import { useArcium } from '../hooks/useArciumClient';

const PrivatePayment: React.FC = () => {
  const { publicKey } = useWallet();
  const { cipher, isInitialized } = useArcium();
  const { submitEncryptedTransaction, state } = useEncryptedTransaction();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [memo, setMemo] = useState('');

  const handlePayment = async () => {
    if (!publicKey || !cipher || !isInitialized) {
      alert('Please connect wallet and wait for Arcium initialization');
      return;
    }

    if (!amount || !recipient) {
      alert('Please fill in amount and recipient');
      return;
    }

    try {
      const paymentData = {
        amount: BigInt(amount),
        recipient: new PublicKey(recipient).toBytes(),
        memo: new TextEncoder().encode(memo.padEnd(64, '\0').slice(0, 64)),
      };

      const serialized = new Uint8Array(104); // 8 + 32 + 64
      const amountBytes = new BigUint64Array([paymentData.amount]);
      serialized.set(new Uint8Array(amountBytes.buffer), 0);
      serialized.set(paymentData.recipient, 8);
      serialized.set(paymentData.memo, 40);

      const { encrypted, nonce } = cipher!.encrypt([serialized]);

      const programId = new PublicKey('ArcShield1111111111111111111111111111111');
      await submitEncryptedTransaction('private_pay', encrypted[0], programId);
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  return (
    <div className="feature-card">
      <h2>💳 Private Payment</h2>
      <p>Send private payments with encrypted amounts, recipients, and memos</p>
      
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
        <label>Recipient Address</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Enter recipient Solana address"
          disabled={!isInitialized || state.status !== 'idle'}
        />
      </div>

      <div className="form-group">
        <label>Memo (Optional)</label>
        <input
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Payment memo"
          maxLength={64}
          disabled={!isInitialized || state.status !== 'idle'}
        />
      </div>

      <button
        onClick={handlePayment}
        disabled={!isInitialized || state.status !== 'idle' || !amount || !recipient}
      >
        {state.status === 'idle' && 'Send Private Payment'}
        {state.status === 'encrypting' && 'Encrypting...'}
        {state.status === 'queued' && 'Queued...'}
        {state.status === 'executing' && 'Executing...'}
        {state.status === 'completed' && 'Payment Sent!'}
        {state.status === 'error' && 'Payment Failed'}
      </button>

      {state.status === 'completed' && (
        <div className="status-message status-success">
          Payment sent! Signature: {state.transactionSignature?.slice(0, 16)}...
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

export default PrivatePayment;
