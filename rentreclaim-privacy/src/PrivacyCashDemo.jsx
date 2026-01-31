import React, { useState } from 'react';
import { pcDeposit, pcWithdraw } from './integrations/privacyCash.js';

export default function PrivacyCashDemo() {
  const [amount, setAmount] = useState('0.01');
  const [note, setNote] = useState('');
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);

  const deposit = async () => {
    setBusy(true);
    try {
      const r = await pcDeposit({ amountSol: parseFloat(amount), noteHint: note });
      setLog(l => [`[${new Date().toLocaleTimeString()}] ✅ Deposit (${r.mode}): ${r.txid}`, ...l]);
      if (r.note) setNote(r.note);
    } catch (e) {
      setLog(l => [`[${new Date().toLocaleTimeString()}] ❌ ${e.message}`, ...l]);
    } finally { setBusy(false); }
  };

  const withdraw = async () => {
    setBusy(true);
    try {
      const r = await pcWithdraw({ note });
      setLog(l => [`[${new Date().toLocaleTimeString()}] ✅ Withdraw (${r.mode}): ${r.txid}`, ...l]);
    } catch (e) {
      setLog(l => [`[${new Date().toLocaleTimeString()}] ❌ ${e.message}`, ...l]);
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <a href="/" className="text-white/60 hover:text-white">← Back</a>
        <h1 className="text-3xl font-bold mt-6">🔐 Privacy Cash</h1>
        <p className="text-white/70 mt-2">ZK privacy pools for anonymous SOL transfers</p>
        
        <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <div>
            <label className="text-sm text-white/70">Amount (SOL)</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.001" className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
          </div>
          <div>
            <label className="text-sm text-white/70">Withdrawal Note</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Generated after deposit..." className="w-full mt-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 font-mono text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={deposit} disabled={busy} className="py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold disabled:opacity-50">
              {busy ? '...' : '⬇️ Deposit'}
            </button>
            <button onClick={withdraw} disabled={busy || !note} className="py-3 rounded-lg bg-purple-600 hover:bg-purple-500 font-semibold disabled:opacity-50">
              {busy ? '...' : '⬆️ Withdraw'}
            </button>
          </div>
        </div>

        <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="font-semibold mb-2">How It Works</h3>
          <ul className="text-sm text-white/70 space-y-1">
            <li>• Deposit SOL → receive secret withdrawal note</li>
            <li>• Withdraw later using note (unlinkable to deposit)</li>
            <li>• ZK proofs verify without revealing sender</li>
            <li>• Demo mode active (SDK integration ready)</li>
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
