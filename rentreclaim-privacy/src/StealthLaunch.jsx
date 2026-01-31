// src/StealthLaunch.jsx
import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Keypair,
  Transaction,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  MINT_SIZE,
  ACCOUNT_SIZE,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToCheckedInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { sleep, randBetween, decoyReadBurst } from "./privacyUtils";
import { encryptNote } from "./cryptoNote";

const DEVNET_RPC_URL = "https://api.devnet.solana.com";
import "@solana/wallet-adapter-react-ui/styles.css";

const RPC_URL = import.meta.env.VITE_RPC_URL || clusterApiUrl("mainnet-beta");

function Log({ lines }) {
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  return (
    <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10 text-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-white/80">Activity Log</div>
      </div>
      <div className="space-y-1 font-mono text-white/70 max-h-64 overflow-auto text-xs">
        {lines.length === 0 ? (
          <div className="text-white/40">No activity yet.</div>
        ) : (
          lines.map((l, i) => (
            <div key={i} className={l.type === "error" ? "text-red-400" : l.type === "success" ? "text-emerald-400" : ""}>
              <span className="text-white/40">[{new Date(l.t).toLocaleTimeString()}]</span> {l.msg}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}

function useLogger() {
  const [lines, setLines] = useState([]);
  const log = useCallback((msg, type = "info") => {
    setLines((prev) => [...prev, { t: Date.now(), msg, type }]);
    console.log(msg);
  }, []);
  const clear = useCallback(() => setLines([]), []);
  return { lines, log, clear };
}

async function deriveWalletFromSignature(signMessage, index = 0) {
  const message = new TextEncoder().encode(`stealth-launch-v1:${index}:derive-stealth-wallet`);
  const signature = await signMessage(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", signature);
  const seed = new Uint8Array(hashBuffer);
  return Keypair.fromSeed(seed);
}

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function encodeBase58(bytes) {
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  for (const byte of bytes) {
    if (byte !== 0) break;
    digits.push(0);
  }
  return digits.reverse().map((d) => BASE58_ALPHABET[d]).join("");
}

async function getRecentBlockhash(connection) {
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  return { blockhash, lastValidBlockHeight };
}

async function sendFromMainWallet({ connection, publicKey, signTransaction, ixs, log }) {
  const tx = new Transaction().add(...ixs);
  const { blockhash, lastValidBlockHeight } = await getRecentBlockhash(connection);
  tx.recentBlockhash = blockhash;
  tx.feePayer = publicKey;
  const signed = await signTransaction(tx);
  const sig = await connection.sendRawTransaction(signed.serialize(), { maxRetries: 3, skipPreflight: false });
  log(`Submitted (main): ${sig.slice(0, 20)}...`);
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  return sig;
}

async function sendSignedByDerived({ connection, feePayer, signers, ixs, log }) {
  const tx = new Transaction().add(...ixs);
  const { blockhash, lastValidBlockHeight } = await getRecentBlockhash(connection);
  tx.recentBlockhash = blockhash;
  tx.feePayer = feePayer;
  tx.sign(...signers);
  const sig = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3, skipPreflight: false });
  log(`Submitted (derived): ${sig.slice(0, 20)}...`);
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  return sig;
}

function StealthLaunchInner({ isDevnet, setIsDevnet }) {
  const { publicKey, connected, signTransaction, signMessage } = useWallet();
  const { connection } = useConnection();
  const [privacy, setPrivacy] = useState(true);
  const [assetProgram, setAssetProgram] = useState("TOKEN");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState(6);
  const [supplyStr, setSupplyStr] = useState("1000000");
  const [derivationMode, setDerivationMode] = useState("random");
  const [derivationIndex, setDerivationIndex] = useState(0);
  const [encryptMeta, setEncryptMeta] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [authorityMode, setAuthorityMode] = useState("burn");
  const [busy, setBusy] = useState(false);
  const [mintAddress, setMintAddress] = useState("");
  const [derivedPk, setDerivedPk] = useState("");
  const [derivedPrivateKey, setDerivedPrivateKey] = useState("");
  const [launchBlobUrl, setLaunchBlobUrl] = useState("");
  const [txSignatures, setTxSignatures] = useState([]);
  const { lines, log, clear } = useLogger();

  const doLaunch = useCallback(async () => {
    setBusy(true);
    setMintAddress("");
    setDerivedPrivateKey("");
    setLaunchBlobUrl("");
    setTxSignatures([]);
    try {
      if (!connected || !publicKey) throw new Error("Connect wallet first");
      clear();
      log("Generating stealth wallet...");
      let derived;
      if (derivationMode === "deterministic") {
        if (!signMessage) throw new Error("Wallet doesnt support message signing");
        derived = await deriveWalletFromSignature(signMessage, derivationIndex);
        log(`Derived wallet (index ${derivationIndex}): ${derived.publicKey.toBase58()}`);
      } else {
        derived = Keypair.generate();
        const privateKeyB58 = encodeBase58(derived.secretKey);
        setDerivedPrivateKey(privateKeyB58);
        log(`Random wallet: ${derived.publicKey.toBase58()}`);
      }
      setDerivedPk(derived.publicKey.toBase58());

      const progId = assetProgram === "TOKEN2022" ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
      const rentMint = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
      const rentAta = await connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZE);
      const buffer = 0.015 * 1e9;
      const need = rentMint + rentAta + Math.floor(buffer);
      log(`Funding derived with ${(need / 1e9).toFixed(4)} SOL`);

      if (privacy) {
        log("Performing decoy reads...");
        await decoyReadBurst(connection);
        await sleep(randBetween(500, 1500));
      }

      const signatures = [];
      const fundSig = await sendFromMainWallet({
        connection, publicKey, signTransaction,
        ixs: [SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: derived.publicKey, lamports: need })],
        log,
      });
      signatures.push(fundSig);

      if (privacy) {
        await sleep(randBetween(800, 2000));
        await decoyReadBurst(connection);
      }

      log("Creating mint...");
      const mint = Keypair.generate();
      const createMintIxs = [
        SystemProgram.createAccount({
          fromPubkey: derived.publicKey,
          newAccountPubkey: mint.publicKey,
          lamports: rentMint,
          space: MINT_SIZE,
          programId: progId,
        }),
        createInitializeMintInstruction(mint.publicKey, Number(decimals), derived.publicKey, derived.publicKey, progId),
      ];

      const mintSig = await sendSignedByDerived({
        connection, feePayer: derived.publicKey, signers: [derived, mint], ixs: createMintIxs, log,
      });
      signatures.push(mintSig);

      if (privacy) await sleep(randBetween(500, 1200));

      log("Minting supply...");
      const ata = await getAssociatedTokenAddress(mint.publicKey, derived.publicKey, false, progId, ASSOCIATED_TOKEN_PROGRAM_ID);
      const pow = 10n ** BigInt(decimals);
      const totalUnits = BigInt(Math.round(parseFloat(supplyStr || "0") * Number(pow)));

      const mintSupplyIxs = [
        createAssociatedTokenAccountInstruction(derived.publicKey, ata, derived.publicKey, mint.publicKey, progId, ASSOCIATED_TOKEN_PROGRAM_ID),
        createMintToCheckedInstruction(mint.publicKey, ata, derived.publicKey, totalUnits, Number(decimals), [], progId),
      ];

      const supplySig = await sendSignedByDerived({
        connection, feePayer: derived.publicKey, signers: [derived], ixs: mintSupplyIxs, log,
      });
      signatures.push(supplySig);

      if (authorityMode !== "keep") {
        if (privacy) await sleep(randBetween(300, 800));
        const newAuthority = authorityMode === "transfer" ? publicKey : null;
        const authIxs = [
          createSetAuthorityInstruction(mint.publicKey, derived.publicKey, AuthorityType.MintTokens, newAuthority, [], progId),
          createSetAuthorityInstruction(mint.publicKey, derived.publicKey, AuthorityType.FreezeAccount, newAuthority, [], progId),
        ];
        const authSig = await sendSignedByDerived({
          connection, feePayer: derived.publicKey, signers: [derived], ixs: authIxs, log,
        });
        signatures.push(authSig);
        log(authorityMode === "burn" ? "Authorities burned" : "Authorities transferred", "success");
      }

      const mintStr = mint.publicKey.toBase58();
      setMintAddress(mintStr);
      setTxSignatures(signatures);
      log(`Mint created: ${mintStr}`, "success");

      const receipt = {
        version: 1, createdAt: new Date().toISOString(), program: assetProgram,
        token: { name, symbol, decimals, supply: supplyStr, mint: mintStr, tokenAccount: ata.toBase58() },
        stealth: { derivedWallet: derived.publicKey.toBase58(), derivationMode },
        authorities: authorityMode, transactions: signatures,
      };

      let payloadText = JSON.stringify(receipt, null, 2);
      if (encryptMeta && passphrase.trim().length) {
        payloadText = await encryptNote(payloadText, passphrase.trim());
      }
      const blob = new Blob([payloadText], { type: "application/json" });
      setLaunchBlobUrl(URL.createObjectURL(blob));
      log("Stealth launch complete!", "success");
    } catch (e) {
      console.error(e);
      log(`Error: ${e.message}`, "error");
    } finally {
      setBusy(false);
    }
  }, [connected, publicKey, signTransaction, signMessage, connection, assetProgram, decimals, supplyStr, authorityMode, name, symbol, encryptMeta, passphrase, privacy, derivationMode, derivationIndex, clear, log]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-4">
          <a href="/" className="text-white/60 hover:text-white">← Back</a>
        </div>
        <h1 className="text-3xl font-bold mb-2">Stealth Token Creator</h1>
        <p className="text-white/60 mb-6">Create SPL tokens from a burner wallet with privacy features.</p>
        <div className="mb-6"><WalletMultiButton /></div>

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

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 rounded-xl p-5 border border-white/10 space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Token Program</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white" value={assetProgram} onChange={(e) => setAssetProgram(e.target.value)}>
                <option value="TOKEN">Token Program (classic)</option>
                <option value="TOKEN2022">Token-2022</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-white/70 mb-1">Name</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Token" />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1">Symbol</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="TKN" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-white/70 mb-1">Decimals</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white" value={decimals} onChange={(e) => setDecimals(parseInt(e.target.value))}>
                  <option value={0}>0</option>
                  <option value={6}>6</option>
                  <option value={9}>9</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-white/70 mb-1">Supply</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white" value={supplyStr} onChange={(e) => setSupplyStr(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">Stealth Wallet</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setDerivationMode("random")} className={`p-2 rounded-lg border text-sm ${derivationMode === "random" ? "border-emerald-500 bg-emerald-500/10" : "border-white/10"}`}>Random</button>
                <button type="button" onClick={() => setDerivationMode("deterministic")} className={`p-2 rounded-lg border text-sm ${derivationMode === "deterministic" ? "border-emerald-500 bg-emerald-500/10" : "border-white/10"}`}>Deterministic</button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1">After Launch</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white" value={authorityMode} onChange={(e) => setAuthorityMode(e.target.value)}>
                <option value="burn">Burn authorities</option>
                <option value="transfer">Transfer to main</option>
                <option value="keep">Keep on derived</option>
              </select>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} />
              <span className="text-white/70">Privacy mode</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={encryptMeta} onChange={(e) => setEncryptMeta(e.target.checked)} />
              <span className="text-white/70">Encrypt receipt</span>
            </label>
            {encryptMeta && <input className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white" type="password" placeholder="Passphrase" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} />}
            <button onClick={doLaunch} disabled={!connected || busy} className="w-full rounded-lg px-4 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 font-semibold">
              {busy ? "Creating..." : "Stealth Launch"}
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="font-semibold text-white/80 mb-3">Results</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-white/50">Derived:</span> <span className="font-mono text-xs">{derivedPk || "—"}</span></div>
                <div><span className="text-white/50">Mint:</span> {mintAddress ? <a href={`https://solscan.io/token/${mintAddress}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs text-emerald-400">{mintAddress}</a> : "—"}</div>
                {derivedPrivateKey && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2 mt-2">
                    <div className="text-amber-400 text-xs font-semibold">Save Private Key!</div>
                    <input type="password" readOnly value={derivedPrivateKey} className="w-full bg-black/30 rounded p-1 text-xs font-mono mt-1" onFocus={(e) => e.target.type = "text"} onBlur={(e) => e.target.type = "password"} />
                  </div>
                )}
                {launchBlobUrl && <a href={launchBlobUrl} download="launch.json" className="block text-center px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm mt-2">Download Receipt</a>}
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="font-semibold text-white/80 mb-2">How It Works</h3>
              <ul className="list-disc ml-5 text-sm text-white/60 space-y-1">
                <li>Burner wallet creates the mint</li>
                <li>Jittered funding + decoy reads</li>
                <li>Optional authority burn</li>
              </ul>
            </div>
          </div>
        </div>
        <Log lines={lines} />
      </div>
    </div>
  );
}


export default function StealthLaunch() {
  const [isDevnet, _setIsDevnet] = useState(() => (localStorage.getItem("cluster") || "devnet") === "devnet");
  const setIsDevnet = (v) => { localStorage.setItem("cluster", v ? "devnet" : "mainnet"); _setIsDevnet(v); };
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);
  const endpoint = isDevnet ? DEVNET_RPC_URL : RPC_URL;
  return (
    <ConnectionProvider endpoint={endpoint} key={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <StealthLaunchInner isDevnet={isDevnet} setIsDevnet={setIsDevnet} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
