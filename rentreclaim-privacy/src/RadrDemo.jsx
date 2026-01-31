import React, { useState } from 'react';
import { shadowPaySend } from './integrations/radr.js';

export default function RadrDemo() {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('0.01');
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      const out = await shadowPaySend({ to, amountSol: parseFloat(amount) });
      setLog(l => [`[${new Date().toLocaleTimeString()}] ✅ Sent (${out.mode}): ${out.txid}`, ...l]);
    } catch (e) {
      setLog(l => [`[${new Date().toLocaleTimeString()}] ❌ Error: ${e.message}`, ...l]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <a href="/" className="text-white/60 hover:text-white">← Back</a>
        <h1 className="text-3xl font-bold mt-6">⚡ Radr ShadowPay</h1>
        <p className="text-white/70 mt-2">Private transfers via ShadowWire (ZK Bulletproofs)</p>
        
        <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <div>
            <label className="text-sm text-white/70">Recipient Address</label>
            <input value={to} onChange={e => setTo(e.target.value)} placeholder="Solana address..." className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
          </div>
          <div>
            <label className="text-sm text-white/70">Amount (SOL)</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.001" className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
          </div>
          <button onClick={send} disabled={busy || !to} className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-semibold disabled:opacity-50">
            {busy ? 'Sending...' : '⚡ Send via ShadowPay'}
          </button>
        </div>

        <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="font-semibold mb-2">Privacy Features</h3>
          <ul className="text-sm text-white/70 space-y-1">
            <li>• Bulletproofs hide transaction amounts</li>
            <li>• Pedersen Commitments for on-chain verification</li>
            <li>• Sender identity unlinkable</li>
            <li>• Demo mode (no API key) / Live mode (with VITE_RADR_KEY)</li>
          </ul>
        </div>

        {log.length > 0 && (
          <div className="mt-6 bg-black/30 rounded-xl p-4 font-mono text-xs max-h-40 overflow-y-auto">
            {log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}
