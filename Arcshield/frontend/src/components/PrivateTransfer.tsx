import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useEncryptedTransaction } from '../hooks/useEncryptedTransaction';
import { useArcium } from '../hooks/useArciumClient';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import Badge from './ui/Badge';
import LoadingSpinner from './ui/LoadingSpinner';

const PrivateTransfer: React.FC = () => {
  const { publicKey } = useWallet();
  const { cipher, isInitialized } = useArcium();
  const { submitEncryptedTransaction, state, reset } = useEncryptedTransaction();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');

  const handleTransfer = async () => {
    if (!publicKey || !cipher || !isInitialized) {
      alert('Please connect wallet and wait for Arcium initialization');
      return;
    }

    if (!amount || !recipient) {
      alert('Please fill in all fields');
      return;
    }

    try {
      // Encrypt the transfer data
      const transferData = {
        amount: BigInt(amount),
        recipient: new PublicKey(recipient).toBytes(),
      };

      // Serialize and encrypt
      const serialized = new Uint8Array(40); // 8 bytes for u64 + 32 bytes for recipient
      const amountBytes = new BigUint64Array([transferData.amount]);
      serialized.set(new Uint8Array(amountBytes.buffer), 0);
      serialized.set(transferData.recipient, 8);

      const { encrypted, nonce } = cipher!.encrypt([serialized]);

      // Submit encrypted transaction
      // In production, this would use the actual program ID
      const programId = new PublicKey('ArcShield1111111111111111111111111111111');
      await submitEncryptedTransaction('private_transfer', encrypted[0], programId);
    } catch (error) {
      console.error('Transfer error:', error);
    }
  };

  const getStatusBadge = () => {
    switch (state.status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'error':
        return <Badge variant="error">Failed</Badge>;
      case 'queued':
      case 'executing':
        return <Badge variant="warning">Processing</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card
      title="Private Transfer"
      subtitle="Send tokens privately with encrypted amounts and recipients"
      headerActions={getStatusBadge()}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Input
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          disabled={!isInitialized || state.status !== 'idle'}
        />

        <Input
          label="Recipient Address"
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Enter recipient Solana address"
          disabled={!isInitialized || state.status !== 'idle'}
        />

        <Button
          onClick={handleTransfer}
          disabled={!isInitialized || state.status !== 'idle' || !amount || !recipient}
          isLoading={state.status === 'encrypting' || state.status === 'queued' || state.status === 'executing'}
        >
          {state.status === 'idle' && 'Transfer Privately'}
          {state.status === 'encrypting' && 'Encrypting...'}
          {state.status === 'queued' && 'Queued...'}
          {state.status === 'executing' && 'Executing...'}
          {state.status === 'completed' && 'Transfer Complete!'}
          {state.status === 'error' && 'Transfer Failed'}
        </Button>

        {state.status === 'completed' && state.transactionSignature && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', fontSize: '12px', color: 'var(--color-status-success)' }}>
            Transfer completed! Signature: {state.transactionSignature.slice(0, 16)}...
          </div>
        )}

        {state.status === 'error' && state.error && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', fontSize: '12px', color: 'var(--color-status-error)' }}>
            Error: {state.error}
          </div>
        )}

        {(state.status === 'queued' || state.status === 'executing') && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: '6px', fontSize: '12px', color: 'var(--color-status-warning)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LoadingSpinner size="sm" />
            Computation is being processed by MPC cluster...
          </div>
        )}
      </div>
    </Card>
  );
};

export default PrivateTransfer;
