import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useEncryptedTransaction } from '../hooks/useEncryptedTransaction';
import { useArcium } from '../hooks/useArciumClient';

const PrivateSwap: React.FC = () => {
  const { publicKey } = useWallet();
  const { cipher, isInitialized } = useArcium();
  const { submitEncryptedTransaction, state, reset } = useEncryptedTransaction();
  const [amountIn, setAmountIn] = useState('');
  const [minAmountOut, setMinAmountOut] = useState('');
  const [tokenIn, setTokenIn] = useState('');
  const [tokenOut, setTokenOut] = useState('');

  const handleSwap = async () => {
    if (!publicKey || !cipher || !isInitialized) {
      alert('Please connect wallet and wait for Arcium initialization');
      return;
    }

    if (!amountIn || !minAmountOut || !tokenIn || !tokenOut) {
      alert('Please fill in all fields');
      return;
    }

    try {
      // Encrypt the swap data
      const swapData = {
        amount_in: BigInt(amountIn),
        min_amount_out: BigInt(minAmountOut),
        token_in: new PublicKey(tokenIn).toBytes(),
        token_out: new PublicKey(tokenOut).toBytes(),
      };

      // Serialize and encrypt
      const serialized = new Uint8Array(80); // 8 + 8 + 32 + 32
      const amountInBytes = new BigUint64Array([swapData.amount_in]);
      const minAmountOutBytes = new BigUint64Array([swapData.min_amount_out]);
      serialized.set(new Uint8Array(amountInBytes.buffer), 0);
      serialized.set(new Uint8Array(minAmountOutBytes.buffer), 8);
      serialized.set(swapData.token_in, 16);
      serialized.set(swapData.token_out, 48);

      const { encrypted, nonce } = cipher!.encrypt([serialized]);

      const programId = new PublicKey('ArcShield1111111111111111111111111111111');
      await submitEncryptedTransaction('private_swap', encrypted[0], programId);
    } catch (error) {
      console.error('Swap error:', error);
    }
  };

  return (
    <div className="feature-card">
      <h2>🔄 Private Swap</h2>
      <p>Swap tokens privately with encrypted amounts and slippage protection</p>
      
      <div className="form-group">
        <label>Amount In</label>
        <input
          type="number"
          value={amountIn}
          onChange={(e) => setAmountIn(e.target.value)}
          placeholder="Enter amount"
          disabled={!isInitialized || state.status !== 'idle'}
        />
      </div>

      <div className="form-group">
        <label>Minimum Amount Out (Slippage)</label>
        <input
          type="number"
          value={minAmountOut}
          onChange={(e) => setMinAmountOut(e.target.value)}
          placeholder="Minimum amount out"
          disabled={!isInitialized || state.status !== 'idle'}
        />
      </div>

      <div className="form-group">
        <label>Token In Address</label>
        <input
          type="text"
          value={tokenIn}
          onChange={(e) => setTokenIn(e.target.value)}
          placeholder="Token mint address"
          disabled={!isInitialized || state.status !== 'idle'}
        />
      </div>

      <div className="form-group">
        <label>Token Out Address</label>
        <input
          type="text"
          value={tokenOut}
          onChange={(e) => setTokenOut(e.target.value)}
          placeholder="Token mint address"
          disabled={!isInitialized || state.status !== 'idle'}
        />
      </div>

      <button
        onClick={handleSwap}
        disabled={!isInitialized || state.status !== 'idle' || !amountIn || !minAmountOut || !tokenIn || !tokenOut}
      >
        {state.status === 'idle' && 'Swap Privately'}
        {state.status === 'encrypting' && 'Encrypting...'}
        {state.status === 'queued' && 'Queued...'}
        {state.status === 'executing' && 'Executing...'}
        {state.status === 'completed' && 'Swap Complete!'}
        {state.status === 'error' && 'Swap Failed'}
      </button>

      {state.status === 'completed' && (
        <div className="status-message status-success">
          Swap completed! Signature: {state.transactionSignature?.slice(0, 16)}...
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

export default PrivateSwap;
