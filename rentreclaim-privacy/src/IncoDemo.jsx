import React, { useState } from 'react';
import { incoPlan } from './integrations/inco.js';

export default function IncoDemo() {
  const [amount, setAmount] = useState('0.1');
  const [splits, setSplits] = useState(4);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const plan = async () => {
    setBusy(true);
    try {
      const out = await incoPlan({ amountSol: parseFloat(amount), splits });
      setResult(out);
    } catch (e) {
      setResult({ error: e.message });
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <a href="/" className="text-white/60 hover:text-white">← Back</a>
        <h1 className="text-3xl font-bold mt-6">🔮 Inco Confidential Splits</h1>
        <p className="text-white/70 mt-2">FHE-encrypted split planning for private transfers</p>
        
        <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <div>
            <label className="text-sm text-white/70">Total Amount (SOL)</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.01" className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
          </div>
          <div>
            <label className="text-sm text-white/70">Number of Splits</label>
            <input value={splits} onChange={e => setSplits(parseInt(e.target.value) || 2)} type="number" min="2" max="10" className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
          </div>
          <button onClick={plan} disabled={busy} className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 font-semibold disabled:opacity-50">
            {busy ? 'Planning...' : '🔮 Generate Confidential Plan'}
          </button>
        </div>

        {result && !result.error && (
          <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="font-semibold mb-2">Split Plan ({result.mode})</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {result.plan.map((v, i) => (
                <div key={i} className="bg-white/5 rounded px-3 py-2">
                  Split {i+1}: <span className="text-cyan-400">{v} SOL</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-white/60">
              Total: {result.plan.reduce((a,b) => a+b, 0).toFixed(6)} SOL
              {result.encrypted && <span className="ml-2 text-cyan-400">🔐 FHE Encrypted</span>}
            </div>
          </div>
        )}

        <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="font-semibold mb-2">How It Works</h3>
          <ul className="text-sm text-white/70 space-y-1">
            <li>• Fully Homomorphic Encryption (FHE) protects amounts</li>
            <li>• Splits computed on encrypted data</li>
            <li>• Nobody sees actual values during computation</li>
            <li>• Demo mode active (Inco Lightning SDK ready)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
