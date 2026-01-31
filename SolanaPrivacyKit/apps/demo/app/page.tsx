"use client";

import { useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const TOKENS = ["SOL", "USDC"];

export default function Home() {
  const [shieldAmount, setShieldAmount] = useState("");
  const [shieldToken, setShieldToken] = useState("SOL");
  const [shieldResult, setShieldResult] = useState<{ success: boolean; txId?: string } | null>(null);
  const [shieldLoading, setShieldLoading] = useState(false);

  const [shieldedBalance, setShieldedBalance] = useState<string | null>(null);

  const [transferRecipient, setTransferRecipient] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferResult, setTransferResult] = useState<{ success: boolean; signature?: string } | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);

  const [proofHex, setProofHex] = useState("");
  const [publicInputs, setPublicInputs] = useState("");
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

  async function handleShield() {
    const amount = Number(shieldAmount);
    if (Number.isNaN(amount) || amount <= 0) return;
    setShieldLoading(true);
    setShieldResult(null);
    try {
      const res = await fetch("/api/shield", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, token: shieldToken }),
      });
      const data = await res.json();
      setShieldResult(res.ok ? data : { success: false });
    } catch (e) {
      setShieldResult({ success: false });
    } finally {
      setShieldLoading(false);
    }
  }

  async function handleTransfer() {
    const amount = Number(transferAmount);
    if (!transferRecipient.trim() || Number.isNaN(amount) || amount <= 0) return;
    setTransferLoading(true);
    setTransferResult(null);
    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: transferRecipient.trim(), amount }),
      });
      const data = await res.json();
      setTransferResult(res.ok ? data : { success: false });
    } catch (e) {
      setTransferResult({ success: false });
    } finally {
      setTransferLoading(false);
    }
  }

  async function handleVerify() {
    if (!proofHex.trim()) return;
    setVerifyLoading(true);
    setVerifyResult(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proof: proofHex.trim(),
          publicInputs: publicInputs ? publicInputs.split(",").map((s) => s.trim()) : [],
        }),
      });
      const data = await res.json();
      setVerifyResult(res.ok && data.valid === true);
    } catch (e) {
      setVerifyResult(false);
    } finally {
      setVerifyLoading(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Solana Privacy Devkit</h1>
      <p className="text-slate-400 text-sm">Devnet only. Connect Phantom and use the sections below.</p>

      {/* Connect wallet */}
      <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-lg font-semibold mb-4">Connect wallet</h2>
        <WalletMultiButton className="!bg-violet-600 hover:!bg-violet-500 !rounded-lg" />
      </section>

      {/* Shield amount */}
      <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-lg font-semibold mb-4">Shield amount</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Amount</label>
            <input
              type="text"
              value={shieldAmount}
              onChange={(e) => setShieldAmount(e.target.value)}
              placeholder="0"
              className="w-32 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Token</label>
            <select
              value={shieldToken}
              onChange={(e) => setShieldToken(e.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
            >
              {TOKENS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleShield}
            disabled={shieldLoading}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium hover:bg-violet-500 disabled:opacity-50"
          >
            {shieldLoading ? "Shielding…" : "Shield"}
          </button>
        </div>
        {shieldResult && (
          <p className="mt-3 text-sm text-slate-300">
            {shieldResult.success ? (
              <>Success {shieldResult.txId && <>· txId: {shieldResult.txId}</>}</>
            ) : (
              "Shield failed"
            )}
          </p>
        )}
      </section>

      {/* Shielded balance */}
      <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-lg font-semibold mb-4">Shielded balance</h2>
        <p className="text-slate-400 text-sm">
          {shieldedBalance != null ? `${shieldedBalance} (mock)` : "Not loaded — use backend/API for real balance."}
        </p>
      </section>

      {/* Private transfer */}
      <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-lg font-semibold mb-4">Private transfer</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Recipient address</label>
            <input
              type="text"
              value={transferRecipient}
              onChange={(e) => setTransferRecipient(e.target.value)}
              placeholder="Base58 address"
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Amount</label>
            <input
              type="text"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="0"
              className="w-32 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleTransfer}
            disabled={transferLoading}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium hover:bg-violet-500 disabled:opacity-50"
          >
            {transferLoading ? "Sending…" : "Send private transfer"}
          </button>
        </div>
        {transferResult && (
          <p className="mt-3 text-sm text-slate-300">
            {transferResult.success ? (
              <>Success {transferResult.signature && <>· sig: {transferResult.signature}</>}</>
            ) : (
              "Transfer failed"
            )}
          </p>
        )}
      </section>

      {/* Verify proof */}
      <section className="rounded-xl border border-slate-700 bg-slate-800/50 p-6">
        <h2 className="text-lg font-semibold mb-4">Verify proof</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Proof (hex)</label>
            <textarea
              value={proofHex}
              onChange={(e) => setProofHex(e.target.value)}
              placeholder="deadbeef..."
              rows={3}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Public inputs (comma-separated, optional)</label>
            <input
              type="text"
              value={publicInputs}
              onChange={(e) => setPublicInputs(e.target.value)}
              placeholder=""
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleVerify}
            disabled={verifyLoading}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium hover:bg-violet-500 disabled:opacity-50"
          >
            {verifyLoading ? "Verifying…" : "Verify"}
          </button>
        </div>
        {verifyResult !== null && (
          <p className={`mt-3 text-sm ${verifyResult ? "text-green-400" : "text-red-400"}`}>
            {verifyResult ? "Proof verified successfully." : "Proof verification failed."}
          </p>
        )}
      </section>
    </main>
  );
}
