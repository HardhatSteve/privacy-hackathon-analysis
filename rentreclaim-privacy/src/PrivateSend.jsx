// src/PrivateSend.jsx - with SPL Token Support
import React, { useMemo, useState } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';

import '@solana/wallet-adapter-react-ui/styles.css';

import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';

import { decoyReadBurst, sleep, randBetween } from './privacyUtils.js';
import { useRangeGate } from './hooks/useRangeGate.js';
import { encryptNote } from './cryptoNote.js';

const RPC_URL = import.meta.env.VITE_RPC_URL || 'https://api.mainnet-beta.solana.com';
const DEVNET_RPC_URL = "https://api.devnet.solana.com";
const LAMPORTS_PER_SOL = 1_000_000_000;
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

// Popular token shortcuts
const TOKEN_SHORTCUTS = [
  { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
  { symbol: 'USDT', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6 },
  { symbol: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5 },
  { symbol: 'JUP', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', decimals: 6 },
];

function ts() {
  return new Date().toLocaleTimeString();
}

function splitUnits(total, parts) {
  if (parts <= 1) return [total];
  const weights = Array.from({ length: parts }, () => Math.random() + 0.5);
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => Math.floor((w / sum) * total));
  raw[raw.length - 1] += (total - raw.reduce((a, b) => a + b, 0));
  return raw;
}

async function loadMintMeta(connection, mintStr) {
  const mintPk = new PublicKey(mintStr);
  const acc = await connection.getAccountInfo(mintPk, 'confirmed');
  if (!acc) throw new Error('Mint not found');
  const ownerStr = acc.owner.toBase58();
  const programId = ownerStr === TOKEN_2022_PROGRAM_ID.toBase58()
    ? TOKEN_2022_PROGRAM_ID
    : TOKEN_PROGRAM_ID;
  const parsed = await connection.getParsedAccountInfo(mintPk, 'confirmed');
  const decimals = parsed.value?.data?.parsed?.info?.decimals;
  if (decimals == null) throw new Error('Could not read token decimals');
  return { programId, decimals, mintPk };
}

async function buildSolTx({ from, to, lamports, connection, memoBytes }) {
  const ix = SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports });
  const tx = new Transaction().add(ix);
  if (memoBytes && memoBytes.length) {
    tx.add(new TransactionInstruction({ programId: MEMO_PROGRAM_ID, keys: [], data: memoBytes }));
  }
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = from;
  return tx;
}

async function buildTokenTx({ from, to, mintPk, amountUnits, decimals, programId, connection, memoBytes }) {
  const senderAta = getAssociatedTokenAddressSync(mintPk, from, false, programId);
  const recvAta = getAssociatedTokenAddressSync(mintPk, to, false, programId);
  
  const ixs = [];
  
  // Check if recipient ATA exists
  const recvInfo = await connection.getAccountInfo(recvAta, 'processed');
  if (!recvInfo) {
    ixs.push(createAssociatedTokenAccountInstruction(from, recvAta, to, mintPk, programId));
  }
  
  ixs.push(createTransferCheckedInstruction(senderAta, mintPk, recvAta, from, amountUnits, decimals, [], programId));
  
  if (memoBytes && memoBytes.length) {
    ixs.push(new TransactionInstruction({ programId: MEMO_PROGRAM_ID, keys: [], data: memoBytes }));
  }
  
  const tx = new Transaction();
  ixs.forEach(ix => tx.add(ix));
  
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
  tx.recentBlockhash = blockhash;
  tx.lastValidBlockHeight = lastValidBlockHeight;
  tx.feePayer = from;
  return tx;
}

function PrivateSendInner({ isDevnet, setIsDevnet }) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();

  const [asset, setAsset] = useState('SOL');
  const [mint, setMint] = useState('');
  const [tokenMeta, setTokenMeta] = useState(null);
  const [dest, setDest] = useState('');
  const [amount, setAmount] = useState('');
  const [splits, setSplits] = useState(3);
  const [windowSec, setWindowSec] = useState(30);
  const [privacy, setPrivacy] = useState(true);
  const [note, setNote] = useState('');
  const [encrypt, setEncrypt] = useState(false);
  const [pass, setPass] = useState('');

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Range compliance
  const { prescreen } = useRangeGate();
  const [complianceOn, setComplianceOn] = useState(false);
  const [compliance, setCompliance] = useState(null);
  const [checking, setChecking] = useState(false);

  const runCompliance = async () => {
    if (!publicKey) return;
    setChecking(true);
    try {
      const r = await prescreen(publicKey.toBase58(), "send");
      setCompliance(r);
      pushLog(`Compliance (${r.mode}): ${r.passed ? "PASS" : "BLOCK"}`);
      if (!r.passed && r.reasons?.length) r.reasons.forEach(x => pushLog(`  - ${x}`));
    } catch (e) {
      pushLog(`Compliance error: ${e.message}`);
    } finally {
      setChecking(false);
    }
  };
  const [log, setLog] = useState([]);

  const pushLog = (line) => setLog((l) => [`[${ts()}] ${line}`, ...l]);
  const clearLog = () => setLog([]);

  const selectToken = (token) => {
    setMint(token.mint);
    setTokenMeta({ mintPk: new PublicKey(token.mint), decimals: token.decimals, programId: TOKEN_PROGRAM_ID });
    pushLog(`Selected ${token.symbol} (${token.decimals} decimals)`);
  };

  const loadMint = async () => {
    if (!mint.trim()) return;
    try {
      setErr('');
      const meta = await loadMintMeta(connection, mint.trim());
      setTokenMeta(meta);
      pushLog(`Mint loaded: ${meta.decimals} decimals`);
    } catch (e) {
      setErr(e.message || 'Failed to load mint');
    }
  };

  const handleSend = async () => {
    setErr('');
    if (!connected || !publicKey) {
      setErr('Connect wallet first.');
      return;
    }

    let toPK;
    try {
      toPK = new PublicKey(dest.trim());
    } catch {
      setErr('Destination address is invalid.');
      return;
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setErr('Amount must be a positive number.');
      return;
    }

    if (!Number.isInteger(Number(splits)) || splits < 1 || splits > 25) {
      setErr('Splits must be an integer between 1 and 25.');
      return;
    }

    if (asset === 'SPL' && !tokenMeta) {
      setErr('Load token mint first.');
      return;
    }

    if (encrypt && pass.trim().length < 4) {
      setErr('Passphrase must be at least 4 characters.');
      return;
    }

    setBusy(true);
    try {
      const partsCount = Number(splits);
      const spacingMs = partsCount > 1 ? Math.floor((Number(windowSec) * 1000) / (partsCount - 1)) : 0;

      let memoBytes = null;
      if (note.trim().length > 0) {
        const te = new TextEncoder();
        memoBytes = encrypt ? te.encode(await encryptNote(note.trim(), pass.trim())) : te.encode(note.trim());
      }

      if (asset === 'SOL') {
        const totalLamports = Math.floor(amt * LAMPORTS_PER_SOL);
        const parts = splitUnits(totalLamports, partsCount);
        pushLog(`Starting SOL private send: ${amt} SOL → ${parts.length} split(s) over ~${windowSec}s`);
        pushLog(`Destination: ${toPK.toBase58()}`);
        if (privacy) pushLog('Privacy mode ON');

        for (let i = 0; i < parts.length; i++) {
          if (i > 0) {
            const jitter = randBetween(120, 650);
            const wait = Math.max(0, spacingMs + jitter);
            if (privacy) await decoyReadBurst(connection);
            await sleep(wait);
          }
          const tx = await buildSolTx({
            from: publicKey,
            to: toPK,
            lamports: parts[i],
            connection,
            memoBytes: i === 0 ? memoBytes : null,
          });
          if (privacy) await decoyReadBurst(connection);
          const sig = await sendTransaction(tx, connection, { skipPreflight: false, preflightCommitment: 'processed' });
          pushLog(`Split ${i + 1}/${parts.length}: ${(parts[i] / LAMPORTS_PER_SOL).toFixed(6)} SOL | ${sig.slice(0, 20)}...`);
        }
      } else {
        const factor = 10 ** tokenMeta.decimals;
        const totalUnits = Math.floor(amt * factor);
        const parts = splitUnits(totalUnits, partsCount);
        pushLog(`Starting SPL private send: ${amt} tokens → ${parts.length} split(s) over ~${windowSec}s`);
        pushLog(`Destination: ${toPK.toBase58()}`);
        if (privacy) pushLog('Privacy mode ON');

        for (let i = 0; i < parts.length; i++) {
          if (i > 0) {
            const jitter = randBetween(120, 650);
            const wait = Math.max(0, spacingMs + jitter);
            if (privacy) await decoyReadBurst(connection);
            await sleep(wait);
          }
          const tx = await buildTokenTx({
            from: publicKey,
            to: toPK,
            mintPk: tokenMeta.mintPk,
            amountUnits: parts[i],
            decimals: tokenMeta.decimals,
            programId: tokenMeta.programId,
            connection,
            memoBytes: i === 0 ? memoBytes : null,
          });
          if (privacy) await decoyReadBurst(connection);
          const sig = await sendTransaction(tx, connection, { skipPreflight: false, preflightCommitment: 'processed' });
          pushLog(`Split ${i + 1}/${parts.length}: ${(parts[i] / factor).toFixed(tokenMeta.decimals)} tokens | ${sig.slice(0, 20)}...`);
        }
      }
      pushLog('✅ Done!');
    } catch (e) {
      setErr(e.message || 'Send failed.');
      pushLog(`❌ Error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const goBack = () => { window.location.hash = '/'; };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-5 py-8">
        <div className="mb-4">
          <a href="/" className="text-white/70 hover:text-white text-sm">← Back to RentReclaim</a>
        </div>

        <h1 className="text-2xl font-bold mb-2">🔒 Private Send</h1>
        <p className="text-white/60 text-sm mb-4">Send SOL or SPL tokens with split transfers, time jitter, and decoy reads</p>

        <div className="mb-6">
          <WalletMultiButton />
        </div>


        {/* Devnet Safety Toggle */}
        <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">⚠️</span>
              <span className="text-sm text-yellow-200">Test on devnet first</span>
            </div>
            <button
              onClick={() => setIsDevnet(!isDevnet)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${isDevnet ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50" : "bg-red-500/20 text-red-400 border border-red-500/50"}`}
            >
              {isDevnet ? "🧪 Devnet" : "🔴 Mainnet"}
            </button>
          </div>
        </div>
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
          {/* Asset Selection */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Asset</label>
              <select
                className="w-full rounded-lg bg-white/5 border border-white/10 p-3 outline-none focus:border-purple-500"
                value={asset}
                onChange={(e) => { setAsset(e.target.value); setTokenMeta(null); setMint(''); }}
              >
                <option value="SOL">SOL</option>
                <option value="SPL">SPL Token</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Destination Address</label>
              <input
                className="w-full rounded-lg bg-white/5 border border-white/10 p-3 outline-none focus:border-purple-500"
                placeholder="Enter Solana address"
                value={dest}
                onChange={(e) => setDest(e.target.value)}
              />
            </div>
          </div>

          {/* SPL Token Selection */}
          {asset === 'SPL' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {TOKEN_SHORTCUTS.map((t) => (
                  <button
                    key={t.symbol}
                    onClick={() => selectToken(t)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition ${
                      mint === t.mint ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {t.symbol}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg bg-white/5 border border-white/10 p-3 outline-none focus:border-purple-500"
                  placeholder="Or paste token mint address"
                  value={mint}
                  onChange={(e) => { setMint(e.target.value); setTokenMeta(null); }}
                />
                <button
                  onClick={loadMint}
                  className="px-4 rounded-lg bg-white/10 hover:bg-white/20 transition"
                >
                  Load
                </button>
              </div>
              {tokenMeta && (
                <p className="text-xs text-emerald-400">✓ Token loaded ({tokenMeta.decimals} decimals)</p>
              )}
            </div>
          )}

          {/* Amount and Splits */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Amount {asset === 'SOL' ? '(SOL)' : '(tokens)'}</label>
              <input
                className="w-full rounded-lg bg-white/5 border border-white/10 p-3 outline-none focus:border-purple-500"
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Splits</label>
              <input
                className="w-full rounded-lg bg-white/5 border border-white/10 p-3 outline-none focus:border-purple-500"
                type="number"
                min="1"
                max="25"
                value={splits}
                onChange={(e) => setSplits(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Window and Privacy */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Window (seconds)</label>
              <input
                className="w-full rounded-lg bg-white/5 border border-white/10 p-3 outline-none focus:border-purple-500"
                type="number"
                min="0"
                max="1800"
                value={windowSec}
                onChange={(e) => setWindowSec(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-3 mt-6 sm:mt-7">
              <input id="privacy" type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} className="w-4 h-4" />
              <label htmlFor="privacy" className="text-sm">Privacy mode (decoy reads + jitter)</label>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm mb-1">Optional note</label>
            <textarea
              className="w-full rounded-lg bg-white/5 border border-white/10 p-3 outline-none focus:border-purple-500"
              placeholder="Visible on-chain unless encrypted"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />

          {/* Range Compliance */}
          <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/80 flex items-center gap-2">
                <input type="checkbox" className="accent-emerald-500"
                       checked={complianceOn}
                       onChange={e => setComplianceOn(e.target.checked)} />
                🛡️ Compliance Mode (Range)
              </label>
              <button onClick={runCompliance} disabled={!connected || checking}
                className="text-xs px-3 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/10 disabled:opacity-50">
                {checking ? "Checking…" : "Check Now"}
              </button>
            </div>
            {compliance && (
              <div className="text-xs mt-2">
                {compliance.passed
                  ? <div className="text-green-400">✅ Passed ({compliance.mode}) · {compliance.country} · {compliance.ageDays}d old</div>
                  : <div className="text-red-400">❌ Blocked ({compliance.mode})</div>}
                {compliance.reasons?.length > 0 && (
                  <ul className="list-disc ml-4 text-white/60 mt-1">
                    {compliance.reasons.map((r,i) => <li key={i}>{r}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>

          </div>

          {/* Encryption */}
          <div className="grid sm:grid-cols-2 gap-4 items-center">
            <div className="flex items-center gap-3">
              <input id="encrypt" type="checkbox" checked={encrypt} onChange={(e) => setEncrypt(e.target.checked)} className="w-4 h-4" />
              <label htmlFor="encrypt" className="text-sm">Encrypt note with passphrase</label>
            </div>
            <input
              className="w-full rounded-lg bg-white/5 border border-white/10 p-3 outline-none focus:border-purple-500"
              type="password"
              placeholder="Passphrase"
              disabled={!encrypt}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
            />
          </div>

          {err && (
            <div className="text-red-300 text-sm bg-red-900/30 border border-red-500/30 rounded-lg p-3">❌ {err}</div>
          )}


          {/* Range Compliance */}
          <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/80 flex items-center gap-2">
                <input type="checkbox" className="accent-emerald-500" checked={complianceOn} onChange={e => setComplianceOn(e.target.checked)} />
                🛡️ Compliance Mode (Range)
              </label>
              <button onClick={runCompliance} disabled={!connected || checking} className="text-xs px-3 py-1 rounded bg-white/10 hover:bg-white/20 border border-white/10 disabled:opacity-50">
                {checking ? "Checking…" : "Check Now"}
              </button>
            </div>
            {compliance && (
              <div className="text-xs mt-2">
                {compliance.passed ? <div className="text-green-400">✅ Passed ({compliance.mode}) · {compliance.country} · {compliance.ageDays}d old</div> : <div className="text-red-400">❌ Blocked ({compliance.mode})</div>}
                {compliance.reasons?.length > 0 && <ul className="list-disc ml-4 text-white/60 mt-1">{compliance.reasons.map((r,i) => <li key={i}>{r}</li>)}</ul>}
              </div>
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={!connected || busy || (complianceOn && !compliance?.passed)}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              connected && !busy
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                : 'bg-white/10 cursor-not-allowed'
            }`}
          >
            {connected ? (busy ? 'Sending…' : '🔒 Send Privately') : '⚠️ Connect wallet'}
          </button>
        </div>

        {/* How It Works */}
        <div className="mt-8 bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold mb-3">🛡️ How It Works</h2>
          <div className="grid md:grid-cols-4 gap-4 text-sm text-white/70">
            <div>
              <h3 className="font-medium text-white mb-1">Split Transfers</h3>
              <p>Payment divided into randomized smaller amounts.</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">Time Jitter</h3>
              <p>Randomized intervals break timing patterns.</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">Decoy Reads</h3>
              <p>Random RPC queries mask your activity.</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">SPL Tokens</h3>
              <p>Send USDC, USDT, BONK, JUP privately.</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-white/40">⚠️ Obfuscation only. Amounts/addresses visible on-chain.</p>
        </div>

        {/* Activity Log */}
        <div className="mt-8 bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Activity Log</h2>
            <button className="text-sm text-white/70 hover:text-white" onClick={clearLog}>clear</button>
          </div>
          <div className="text-sm text-white/70 space-y-1 min-h-[72px] max-h-48 overflow-auto font-mono">
            {log.length === 0 ? (
              <div className="text-white/40">No activity yet.</div>
            ) : (
              log.map((l, i) => <div key={i} className="text-white/80">{l}</div>)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


export default function PrivateSend() {
  const [isDevnet, _setIsDevnet] = useState(() => (localStorage.getItem("cluster") || "devnet") === "devnet");
  const setIsDevnet = (v) => { localStorage.setItem("cluster", v ? "devnet" : "mainnet"); _setIsDevnet(v); };
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);
  const endpoint = isDevnet ? DEVNET_RPC_URL : RPC_URL;
  
  return (
    <ConnectionProvider endpoint={endpoint} key={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <PrivateSendInner isDevnet={isDevnet} setIsDevnet={setIsDevnet} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
