import React, { useState } from 'react';
import { arciumStart, arciumPoll } from './integrations/arcium.js';

export default function ArciumDemo() {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('0.01');
  const [job, setJob] = useState(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      const j = await arciumStart({ to, amountSol: parseFloat(amount) });
      setJob(j);
      setStatus(`Job ${j.id} queued (${j.mode})`);
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    } finally { setBusy(false); }
  };

  const poll = async () => {
    if (!job?.id) return;
    setBusy(true);
    try {
      const j = await arciumPoll({ id: job.id });
      setJob(j);
      setStatus(j.state === "completed" ? `✅ Completed (${j.mode})` : `State: ${j.state}`);
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <a href="/" className="text-white/60 hover:text-white">← Back</a>
        <h1 className="text-3xl font-bold mt-6">🔒 Arcium MPC</h1>
        <p className="text-white/70 mt-2">Multi-Party Computation for trustless private transfers</p>
        
        <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <div>
            <label className="text-sm text-white/70">Recipient</label>
            <input value={to} onChange={e => setTo(e.target.value)} placeholder="Solana address..." className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
          </div>
          <div>
            <label className="text-sm text-white/70">Amount (SOL)</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.001" className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={start} disabled={busy || !to} className="py-3 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 font-semibold disabled:opacity-50">
              {busy ? '...' : '🚀 Start MPC Job'}
            </button>
            <button onClick={poll} disabled={busy || !job} className="py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 font-semibold disabled:opacity-50">
              {busy ? '...' : '🔄 Poll Status'}
            </button>
          </div>
        </div>

        {status && (
          <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10 text-sm">
            {status}
          </div>
        )}

        {job?.plan && (
          <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="font-semibold mb-2">MPC Result</h3>
            <div className="text-sm text-white/70 space-y-1">
              <div>Splits: {job.plan.splits?.join(', ')} SOL</div>
              {job.plan.txid && <div>TxID: <span className="text-orange-400 font-mono">{job.plan.txid}</span></div>}
            </div>
          </div>
        )}

        <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="font-semibold mb-2">How It Works</h3>
          <ul className="text-sm text-white/70 space-y-1">
            <li>• Multi-Party Computation across distributed nodes</li>
            <li>• No single party sees full transaction details</li>
            <li>• Trustless verification without revealing amounts</li>
            <li>• Demo mode active (Arcium SDK ready)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
