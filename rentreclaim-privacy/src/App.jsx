import React, { useState, useMemo, useCallback } from 'react';
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  TOKEN_2022_PROGRAM_ID, 
  createCloseAccountInstruction,
} from '@solana/spl-token';

// ============ CONFIGURATION ============
// Set these in .env file (see .env.example)
const CONFIG = {
  // RPC - Use a dedicated RPC for production (Helius, QuickNode, etc.)
  RPC_ENDPOINT: import.meta.env.VITE_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
  DEVNET_ENDPOINT: "https://api.devnet.solana.com",
  
  // Fee Configuration
  FEE_WALLET: import.meta.env.VITE_FEE_WALLET || '12XYR5vEB2Jr7iejDgDsS2KwRePHPQQXjigtbV3uAhRN',
  FEE_MODEL: 'flat', // 'flat' or 'percent'
  FLAT_FEE_LAMPORTS: 500_000, // 0.0005 SOL per account (~25% of rent)
  PERCENT_FEE_BPS: 2000, // 20% if using percent model
  
  // Batching
  CLOSES_PER_TX: 6, // Conservative for CU safety
  COMPUTE_UNIT_LIMIT: 200_000,
  COMPUTE_UNIT_PRICE: 50_000, // microLamports - adjust based on network
  
  // Rent estimate (actual varies slightly)
  EST_RENT_LAMPORTS: 2_039_280, API_URL: "https://api.rentreclaim.xyz",
};

// ============ STYLES ============
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
  
  :root {
    --bg-primary: #0a0a0f;
    --bg-secondary: #12121a;
    --bg-card: #1a1a24;
    --accent-green: #00ff88;
    --accent-purple: #a855f7;
    --accent-blue: #3b82f6;
    --text-primary: #ffffff;
    --text-secondary: #9ca3af;
    --text-muted: #6b7280;
    --border: #2a2a3a;
    --danger: #ef4444;
    --warning: #f59e0b;
  }
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'Space Mono', monospace;
    background: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
  }
  
  .app-container {
    min-height: 100vh;
    background: 
      radial-gradient(ellipse at 20% 0%, rgba(0, 255, 136, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 100%, rgba(168, 85, 247, 0.08) 0%, transparent 50%),
      var(--bg-primary);
  }
  
  .header {
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(10px);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  
  .logo {
    font-family: 'Syne', sans-serif;
    font-size: 1.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, var(--accent-green), var(--accent-blue));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .logo-icon {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, var(--accent-green), var(--accent-blue));
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
  }
  
  .wallet-btn {
    font-family: 'Space Mono', monospace;
    font-weight: 700;
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, var(--accent-green), var(--accent-blue));
    color: #000;
  }
  
  .wallet-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 255, 136, 0.3);
  }
  
  .wallet-btn.connected {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--accent-green);
  }
  
  .main-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 3rem 2rem;
  }
  
  .hero {
    text-align: center;
    margin-bottom: 4rem;
  }
  
  .hero-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(2.5rem, 6vw, 4rem);
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 1.5rem;
  }
  
  .hero-title .highlight {
    background: linear-gradient(135deg, var(--accent-green), var(--accent-blue));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .hero-subtitle {
    font-size: 1.1rem;
    color: var(--text-secondary);
    max-width: 600px;
    margin: 0 auto 2rem;
    line-height: 1.6;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
  }
  
  .stat-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1.5rem;
    text-align: center;
    transition: all 0.3s ease;
  }
  
  .stat-card:hover {
    border-color: var(--accent-green);
    transform: translateY(-4px);
  }
  
  .stat-value {
    font-family: 'Syne', sans-serif;
    font-size: 1.75rem;
    font-weight: 800;
    color: var(--accent-green);
    margin-bottom: 0.5rem;
  }
  
  .stat-label {
    font-size: 0.8rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  .scanner-section {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 2rem;
    margin-bottom: 2rem;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .section-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
  }
  
  .btn {
    font-family: 'Space Mono', monospace;
    font-weight: 700;
    padding: 0.875rem 1.75rem;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, var(--accent-green), #00cc6a);
    color: #000;
  }
  
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0, 255, 136, 0.4);
  }
  
  .btn-secondary {
    background: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border);
  }
  
  .btn-secondary:hover:not(:disabled) {
    border-color: var(--accent-green);
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .account-list {
    max-height: 350px;
    overflow-y: auto;
    margin-top: 1rem;
  }
  
  .account-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: var(--bg-secondary);
    border-radius: 12px;
    margin-bottom: 0.75rem;
    border: 1px solid transparent;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  
  .account-item:hover { border-color: var(--border); }
  .account-item.selected {
    border-color: var(--accent-green);
    background: rgba(0, 255, 136, 0.05);
  }
  
  .account-address {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }
  
  .account-mint {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
  }
  
  .account-rent {
    font-weight: 700;
    color: var(--accent-green);
  }
  
  .checkbox-wrapper {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .checkbox {
    width: 20px;
    height: 20px;
    border: 2px solid var(--border);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }
  
  .checkbox.checked {
    background: var(--accent-green);
    border-color: var(--accent-green);
  }
  
  .checkbox.checked::after {
    content: '✓';
    color: #000;
    font-size: 0.75rem;
    font-weight: 700;
  }
  
  .select-all-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: var(--bg-secondary);
    border-radius: 8px;
    margin-bottom: 1rem;
    cursor: pointer;
  }
  
  .summary-card {
    background: linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(59, 130, 246, 0.1));
    border: 1px solid var(--accent-green);
    border-radius: 16px;
    padding: 1.5rem;
    margin-top: 1.5rem;
  }
  
  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
  }
  
  .summary-row:not(:last-child) {
    border-bottom: 1px solid var(--border);
  }
  
  .summary-label { color: var(--text-secondary); }
  .summary-value { font-weight: 700; }
  .summary-value.highlight {
    color: var(--accent-green);
    font-size: 1.25rem;
  }
  
  .status-message {
    padding: 1rem;
    border-radius: 12px;
    margin: 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .status-message.info {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid var(--accent-blue);
    color: var(--accent-blue);
  }
  
  .status-message.success {
    background: rgba(0, 255, 136, 0.1);
    border: 1px solid var(--accent-green);
    color: var(--accent-green);
  }
  
  .status-message.error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid var(--danger);
    color: var(--danger);
  }
  
  .status-message.warning {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid var(--warning);
    color: var(--warning);
  }
  
  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid transparent;
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary);
  }
  
  .empty-state-icon { font-size: 4rem; margin-bottom: 1rem; }
  
  .empty-state-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
  }
  
  .progress-container { margin: 1.5rem 0; }
  
  .progress-bar {
    width: 100%;
    height: 8px;
    background: var(--bg-secondary);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-green), var(--accent-blue));
    border-radius: 4px;
    transition: width 0.3s ease;
  }
  
  .progress-text {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-top: 0.5rem;
    text-align: center;
  }
  
  .tx-log {
    background: var(--bg-secondary);
    border-radius: 8px;
    padding: 1rem;
    margin-top: 1rem;
    max-height: 200px;
    overflow-y: auto;
    font-size: 0.8rem;
  }
  
  .tx-log-entry {
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border);
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .tx-log-entry:last-child { border-bottom: none; }
  
  .tx-link {
    color: var(--accent-blue);
    text-decoration: none;
    word-break: break-all;
  }
  
  .tx-link:hover { text-decoration: underline; }
  
  .footer {
    text-align: center;
    padding: 2rem;
    color: var(--text-muted);
    font-size: 0.85rem;
    border-top: 1px solid var(--border);
    margin-top: 4rem;
  }
  
  .action-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
    flex-wrap: wrap;
  }
  
  .action-buttons .btn {
    flex: 1;
    min-width: 200px;
    justify-content: center;
  }
  
  .fee-breakdown {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
  }
  
  .referral-badge {
    background: var(--accent-purple);
    color: #fff;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
  }
  
  @media (max-width: 768px) {
    .header { padding: 1rem; }
    .main-content { padding: 1.5rem 1rem; }
    .scanner-section { padding: 1.5rem; }
    .account-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }
    .action-buttons { flex-direction: column; }
    .action-buttons .btn { min-width: 100%; }
  }
`;

// ============ HELPER FUNCTIONS ============
const shortenAddress = (address, chars = 4) => {
  if (!address) return '';
  const str = typeof address === 'string' ? address : address.toBase58();
  return `${str.slice(0, chars)}...${str.slice(-chars)}`;
};

const formatSol = (lamports) => {
  const sol = lamports / 1e9;
  if (sol < 0.0001) return `${lamports.toLocaleString()} lamports`;
  if (sol < 0.01) return `${sol.toFixed(6)} SOL`;
  return `${sol.toFixed(4)} SOL`;
};

const formatSolShort = (lamports) => (lamports / 1e9).toFixed(4);

const getReferralCode = () => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('ref');
};

const generateCSV = (results, totals) => {
  const headers = ['Timestamp', 'Account', 'Mint', 'Program', 'Status', 'Signature', 'Recovered (lamports)'];
  const rows = results.map(r => [
    new Date().toISOString(),
    r.address,
    r.mint || 'N/A',
    r.program || 'Token Program',
    r.status,
    r.signature || 'N/A',
    r.recovered || 0,
  ]);
  
  const summaryRows = [
    [],
    ['SUMMARY'],
    ['Total Accounts', totals.count],
    ['Total Recovered (lamports)', totals.totalRecovered],
    ['Total Recovered (SOL)', (totals.totalRecovered / 1e9).toFixed(6)],
    ['Fee Paid (lamports)', totals.feePaid],
    ['Fee Paid (SOL)', (totals.feePaid / 1e9).toFixed(6)],
  ];
  
  return [headers, ...rows, ...summaryRows].map(row => row.join(',')).join('\n');
};

const downloadCSV = (csv, filename) => {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ============ CORE LOGIC ============
async function findZeroBalanceAccounts(connection, owner) {
  const accounts = [];
  
  async function scanProgram(programId, programName) {
    try {
      const response = await connection.getParsedTokenAccountsByOwner(
        owner,
        { programId },
        { commitment: 'confirmed' }
      );
      
      for (const { pubkey, account } of response.value) {
        try {
          const parsed = account.data.parsed?.info;
          if (!parsed) continue;
          
          const isZero = parsed.tokenAmount?.amount === "0";
          // Check for Token-2022 withheld amount (cannot close if > 0)
          const extensions = parsed.extensions || [];
          const transferFeeExt = extensions.find(e => e?.extension === "transferFeeAmount");
          const withheldAmount = transferFeeExt?.state?.withheldAmount || 0;
          const hasWithheld = Number(withheldAmount) > 0;
          const isInitialized = parsed.state === "initialized";
          const closeAuthority = parsed.closeAuthority;
          const canClose = !closeAuthority || closeAuthority === owner.toBase58();
          
          if (isZero && isInitialized && canClose && !hasWithheld) {
            accounts.push({
              address: pubkey.toBase58(),
              pubkey: pubkey,
              mint: parsed.mint,
              program: programName,
              programId: programId.toBase58(),
              rentLamports: account.lamports,
            });
          }
        } catch (e) {
          console.warn('Error parsing account:', e);
        }
      }
    } catch (e) {
      console.error(`Error scanning ${programName}:`, e);
    }
  }
  
  await Promise.all([
    scanProgram(TOKEN_PROGRAM_ID, 'Token Program'),
    scanProgram(TOKEN_2022_PROGRAM_ID, 'Token-2022'),
  ]);
  
  return accounts;
}


// Privacy feature: Decoy RPC reads to obscure real wallet scanning
async function performDecoyReads(connection, count = 5) {
  // Well-known token mints to query (looks like normal DeFi activity)
  const decoyMints = [
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
    "So11111111111111111111111111111111111111112",   // wSOL
    "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",  // mSOL
    "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj", // stSOL
    "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", // BONK
    "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",  // JUP
  ];
  
  const shuffled = decoyMints.sort(() => Math.random() - 0.5).slice(0, count);
  const decoyPromises = shuffled.map(mint => 
    connection.getTokenSupply(new PublicKey(mint)).catch(() => null)
  );
  
  // Add random delays between 50-200ms to seem more natural
  await Promise.all(decoyPromises.map(async (p, i) => {
    await new Promise(r => setTimeout(r, 50 + Math.random() * 150 * i));
    return p;
  }));
}

function calculateFee(numAccounts, totalRent) {
  if (CONFIG.FEE_MODEL === 'flat') {
    return numAccounts * CONFIG.FLAT_FEE_LAMPORTS;
  }
  return Math.floor((totalRent * CONFIG.PERCENT_FEE_BPS) / 10000);
}

async function buildBatchTransactions(connection, owner, accounts, feeWallet) {
  const batches = [];
  
  // Group accounts by programId to avoid mixing Token Program and Token-2022
  const byProgram = {};
  for (const account of accounts) {
    const pid = account.programId;
    if (!byProgram[pid]) byProgram[pid] = [];
    byProgram[pid].push(account);
  }
  
  // Build batches for each program type separately
  for (const [programId, programAccounts] of Object.entries(byProgram)) {
    for (let i = 0; i < programAccounts.length; i += CONFIG.CLOSES_PER_TX) {
      const chunk = programAccounts.slice(i, i + CONFIG.CLOSES_PER_TX);
      const tx = new Transaction();
      
      tx.add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: CONFIG.COMPUTE_UNIT_LIMIT }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: CONFIG.COMPUTE_UNIT_PRICE })
      );
      
      for (const account of chunk) {
        tx.add(
          createCloseAccountInstruction(
            new PublicKey(account.address),
            owner,
            owner,
            [],
            new PublicKey(account.programId)
          )
        );
      }
      
      if (feeWallet) {
        const chunkRent = chunk.reduce((sum, a) => sum + a.rentLamports, 0);
        const fee = calculateFee(chunk.length, chunkRent);
        
        if (fee > 0) {
          tx.add(
            SystemProgram.transfer({
              fromPubkey: owner,
              toPubkey: new PublicKey(feeWallet),
              lamports: fee,
            })
          );
        }
      }
      
      tx.feePayer = owner;
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      
      batches.push({ transaction: tx, accounts: chunk, blockhash, lastValidBlockHeight });
    }
  }
  
  return batches;
}

// ============ MAIN COMPONENT ============
export default function App() {
  const [wallet, setWallet] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [emptyAccounts, setEmptyAccounts] = useState([]);
  const [selectedAccounts, setSelectedAccounts] = useState(new Set());
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [progress, setProgress] = useState({ current: 0, total: 0 }); const [instantQuote, setInstantQuote] = useState(null); const [advanceLoading, setAdvanceLoading] = useState(false);
  const [txLog, setTxLog] = useState([]);
  const [privacyMode, setPrivacyMode] = useState(true);
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);
  const [finalTotals, setFinalTotals] = useState(null);
  
  const [isDevnet, _setIsDevnet] = useState(() => (localStorage.getItem("cluster") || "devnet") === "devnet");
  const setIsDevnet = (v) => { localStorage.setItem("cluster", v ? "devnet" : "mainnet"); _setIsDevnet(v); };

  // Destiny numerology calculation
  const calculateDestiny = useCallback((address) => {
    if (!address) return null;
    const sum = address.split('').reduce((acc, char) => {
      const code = char.charCodeAt(0);
      if (code >= 48 && code <= 57) return acc + (code - 48);
      if (code >= 65 && code <= 90) return acc + (code - 64);
      if (code >= 97 && code <= 122) return acc + (code - 96);
      return acc;
    }, 0);
    let destiny = sum;
    while (destiny > 9) destiny = String(destiny).split('').reduce((a, b) => a + parseInt(b), 0);
    return destiny;
  }, []);

  const destinyMessages = {
    1: { title: "The Pioneer", msg: "2026 is your INIT year. Your recovered SOL is seed capital for a new beginning." },
    2: { title: "The Connector", msg: "2026 brings partnerships. This SOL recovery connects you to bigger opportunities." },
    3: { title: "The Creator", msg: "2026 sparks creation. Use this recovered SOL to build something meaningful." },
    4: { title: "The Builder", msg: "2026 rewards structure. Your wallet cleanup reflects your readiness to scale." },
    5: { title: "The Adventurer", msg: "2026 brings change. This recovered SOL funds your next bold move." },
    6: { title: "The Nurturer", msg: "2026 is about growth. Reinvest this SOL into what you're cultivating." },
    7: { title: "The Seeker", msg: "2026 deepens wisdom. Your clean wallet reflects inner clarity." },
    8: { title: "The Achiever", msg: "2026 multiplies abundance. This SOL recovery is just the beginning." },
    9: { title: "The Humanitarian", msg: "2026 completes cycles. You've cleared the old to welcome the new." },
  };

  const walletDestiny = useMemo(() => {
    if (!wallet?.publicKey) return null;
    const num = calculateDestiny(wallet.publicKey.toBase58());
    return { number: num, ...destinyMessages[num] };
  }, [wallet, calculateDestiny]);
  const referralCode = useMemo(() => getReferralCode(), []);
  const connection = useMemo(() => new Connection(isDevnet ? CONFIG.DEVNET_ENDPOINT : CONFIG.RPC_ENDPOINT, "confirmed"), [isDevnet]);
  
  const connectWallet = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    const phantom = window.solana;
    if (!phantom?.isPhantom) {
      setStatus({ type: 'error', message: 'Phantom wallet not found. Please install it from phantom.app' });
      return;
    }
    
    setConnecting(true);
    try {
      const response = await phantom.connect();
      setWallet({
        publicKey: response.publicKey,
        signTransaction: phantom.signTransaction.bind(phantom),
      });
      setStatus({ type: 'success', message: 'Wallet connected!' });
    } catch (error) {
      setStatus({ type: 'error', message: `Failed to connect: ${error.message}` });
    } finally {
      setConnecting(false);
    }
  }, []);
  
  const disconnectWallet = useCallback(() => {
    if (window.solana) window.solana.disconnect();
    setWallet(null);
    setEmptyAccounts([]);
    setSelectedAccounts(new Set());
    setResults([]);
    setTxLog([]);
    setStatus({ type: '', message: '' });
  }, []);
  
  const scanAccounts = useCallback(async () => {
    if (!wallet) return;
    
    setScanning(true);
    setStatus({ type: 'info', message: privacyMode ? '🛡️ Privacy scan: mixing traffic...' : 'Privacy scan: mixing traffic...' });
    setEmptyAccounts([]);
    setSelectedAccounts(new Set());
    setResults([]);
    setTxLog([]);
    setFinalTotals(null);
    
    try {
      // Privacy mode: add decoy RPC calls to obscure real scan
      if (privacyMode) await performDecoyReads(connection, 5);

      const accounts = await findZeroBalanceAccounts(connection, wallet.publicKey);
      setEmptyAccounts(accounts);
      setSelectedAccounts(new Set(accounts.map(a => a.address)));
      
      if (accounts.length === 0) {
        setStatus({ type: 'success', message: '✨ Your wallet is clean! No empty accounts found.' });
      } else {
        const totalRent = accounts.reduce((sum, a) => sum + a.rentLamports, 0);
        setStatus({ type: 'success', message: `Found ${accounts.length} empty accounts with ${formatSol(totalRent)} recoverable!` });
        fetchInstantQuote();
      }
    } catch (error) {
      setStatus({ type: 'error', message: `Scan failed: ${error.message}` });
    } finally {
      setScanning(false);
    }
  }, [wallet, connection, privacyMode]);
  
  const toggleAccount = useCallback((address) => {
    setSelectedAccounts(prev => {
      const next = new Set(prev);
      next.has(address) ? next.delete(address) : next.add(address);
      return next;
    });
  }, []);
  
  const toggleAll = useCallback(() => {
    setSelectedAccounts(prev => 
      prev.size === emptyAccounts.length ? new Set() : new Set(emptyAccounts.map(a => a.address))
    );
  }, [emptyAccounts]);
  
  const totals = useMemo(() => {
    const selected = emptyAccounts.filter(a => selectedAccounts.has(a.address));
    const totalRent = selected.reduce((sum, a) => sum + a.rentLamports, 0);
    const fee = calculateFee(selected.length, totalRent);
    return {
      count: selected.length,
      totalRent,
      fee,
      netRecovery: totalRent - fee,
      batches: Math.ceil(selected.length / CONFIG.CLOSES_PER_TX),
    };
  }, [emptyAccounts, selectedAccounts]);
  
// Fetch instant advance quote
  const fetchInstantQuote = useCallback(async () => {
    if (!wallet) return;
    try {
      const res = await fetch(`${CONFIG.API_URL}/quote?wallet=${wallet.publicKey.toBase58()}`);
      const data = await res.json();
      setInstantQuote(data);
    } catch (e) { console.error('Quote error:', e); }
  }, [wallet]);

  // Execute instant advance
  const doInstantAdvance = useCallback(async () => {
    if (!wallet || !instantQuote?.eligible) return;
    setAdvanceLoading(true);
    setStatus({ type: 'info', message: 'Processing instant advance...' });
    try {
      const res = await fetch(`${CONFIG.API_URL}/build-tx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: wallet.publicKey.toBase58(), accounts: instantQuote.accounts })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const tx = Transaction.from(Buffer.from(data.transaction, 'base64'));
      const signed = await wallet.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, 'confirmed');
      setStatus({ type: 'success', message: `Done! Received ${data.advanceSol.toFixed(4)} SOL` });
      setInstantQuote(null);
      scanAccounts();
    } catch (e) {
      setStatus({ type: 'error', message: e.message });
    } finally { setAdvanceLoading(false); }
  }, [wallet, instantQuote]); 
 const closeAccounts = useCallback(async () => {
    if (!wallet || selectedAccounts.size === 0) return;
    
    setCleaning(true);
    setProgress({ current: 0, total: totals.batches });
    setResults([]);
    setTxLog([]);
    setFinalTotals(null);
    setStatus({ type: 'info', message: 'Building transactions...' });
    
    const selected = emptyAccounts.filter(a => selectedAccounts.has(a.address));
    const newResults = [];
    const newTxLog = [];
    let totalRecovered = 0;
    let totalFeePaid = 0;
    
    try {
      const batches = await buildBatchTransactions(connection, wallet.publicKey, selected, CONFIG.FEE_WALLET);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        // Privacy mode: random delay + decoy reads between batches
        if (privacyMode && i > 0) {
          await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
          await performDecoyReads(connection, 2);
        }
        setStatus({ type: 'info', message: `Processing batch ${i + 1}/${batches.length}...` });
        setProgress({ current: i, total: batches.length });
        
        try {
          const signed = await wallet.signTransaction(batch.transaction);
          const signature = await connection.sendRawTransaction(signed.serialize(), {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
          });
          
          await connection.confirmTransaction({
            signature,
            blockhash: batch.blockhash,
            lastValidBlockHeight: batch.lastValidBlockHeight,
          }, 'confirmed');
          
          const batchRent = batch.accounts.reduce((sum, a) => sum + a.rentLamports, 0);
          const batchFee = calculateFee(batch.accounts.length, batchRent);
          totalRecovered += batchRent;
          totalFeePaid += batchFee;
          
          for (const account of batch.accounts) {
            newResults.push({
              address: account.address,
              mint: account.mint,
              program: account.program,
              status: 'success',
              signature,
              recovered: account.rentLamports,
            });
          }
          
          newTxLog.push({
            type: 'success',
            message: `Closed ${batch.accounts.length} accounts`,
            signature,
            recovered: batchRent,
            fee: batchFee,
          });
          
        } catch (error) {
          for (const account of batch.accounts) {
            newResults.push({
              address: account.address,
              mint: account.mint,
              program: account.program,
              status: 'failed',
              error: error.message,
            });
          }
          newTxLog.push({ type: 'error', message: `Batch failed: ${error.message?.slice(0, 100)}` });
        }
        
        setResults([...newResults]);
        setTxLog([...newTxLog]);
      }
      
      setProgress({ current: batches.length, total: batches.length });
      
      const successCount = newResults.filter(r => r.status === 'success').length;
      const netRecovered = totalRecovered - totalFeePaid;
      
      setFinalTotals({ count: successCount, totalRecovered, feePaid: totalFeePaid, netRecovered });
      
      if (successCount === selected.length) {
        setStatus({ type: 'success', message: `🎉 Closed ${successCount} accounts! You recovered ${formatSol(netRecovered)}` });
      } else if (successCount > 0) {
        setStatus({ type: 'warning', message: `Closed ${successCount}/${selected.length} accounts. Some batches failed.` });
      } else {
        setStatus({ type: 'error', message: 'All transactions failed. Please try again.' });
      }
      
      if (successCount > 0) setTimeout(() => scanAccounts(), 15000);
      
    } catch (error) {
      setStatus({ type: 'error', message: `Cleanup failed: ${error.message}` });
    } finally {
      setCleaning(false);
    }
  }, [wallet, connection, emptyAccounts, selectedAccounts, totals, scanAccounts, privacyMode]);
  
  const downloadResults = useCallback(() => {
    if (results.length === 0 || !finalTotals) return;
    const csv = generateCSV(results, finalTotals);
    downloadCSV(csv, `rent-reclaim-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
  }, [results, finalTotals]);
  
  return (
    <div className="app-container">
      <style>{styles}</style>
      
      <header className="header">
        <div className="logo">
          <div className="logo-icon">🧹</div>
          RentReclaim
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {referralCode && <span className="referral-badge">ref: {referralCode}</span>}
          {wallet ? (
            <button className="wallet-btn connected" onClick={disconnectWallet}>
              {shortenAddress(wallet.publicKey.toBase58(), 4)}
            </button>
          ) : (
            <button className="wallet-btn" onClick={connectWallet} disabled={connecting}>
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </header>
      

      {/* Devnet Safety Toggle */}
      <div style={{maxWidth: "600px", margin: "0 auto 1rem", padding: "1rem 1.5rem", background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: "12px"}}>
        <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
          <div style={{display: "flex", alignItems: "center", gap: "0.5rem"}}>
            <span>⚠️</span>
            <span style={{fontSize: "0.9rem", color: "rgb(253,224,71)"}}>Test on devnet first</span>
          </div>
          <button
            onClick={() => setIsDevnet(!isDevnet)}
            style={{padding: "0.375rem 0.75rem", fontSize: "0.75rem", fontWeight: "600", borderRadius: "0.5rem", border: isDevnet ? "1px solid rgba(234,179,8,0.5)" : "1px solid rgba(239,68,68,0.5)", background: isDevnet ? "rgba(234,179,8,0.2)" : "rgba(239,68,68,0.2)", color: isDevnet ? "rgb(250,204,21)" : "rgb(248,113,113)", cursor: "pointer"}}
          >
            {isDevnet ? "🧪 Devnet" : "🔴 Mainnet"}
          </button>
        </div>
      </div>
      <main className="main-content">
        <section className="hero">
          <h1 className="hero-title">
            Recover Your <span className="highlight">Locked SOL</span>
          </h1>
          <p className="hero-subtitle">
            Every empty token account holds ~0.001 SOL in rent (was ~0.002 before SIMD-0436). 
            Clean up your wallet and get your SOL back instantly.
          </p>
        </section>

        {/* SIMD-0436 Rent Update Banner */}
        <div style={{margin: "0 auto 2rem", maxWidth: "600px", padding: "1rem 1.5rem", background: "linear-gradient(135deg, rgba(0,255,136,0.1), rgba(59,130,246,0.1))", border: "1px solid var(--border)", borderRadius: "12px", textAlign: "center"}}>
          <span style={{background: "var(--accent-green)", color: "#000", padding: "0.25rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "700", marginRight: "0.5rem"}}>SIMD-0436</span>
          <span style={{fontSize: "0.85rem", color: "var(--text-secondary)"}}>Solana halved rent costs (~50%) — great time to reclaim!</span>
        </div>
        
        {wallet && emptyAccounts.length > 0 && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{emptyAccounts.length}</div>
              <div className="stat-label">Empty Accounts</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatSolShort(totals.totalRent)}</div>
              <div className="stat-label">Recoverable SOL</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{formatSolShort(totals.fee)}</div>
              <div className="stat-label">Service Fee</div>
              <div className="fee-breakdown">
                {CONFIG.FEE_MODEL === 'flat' ? `${(CONFIG.FLAT_FEE_LAMPORTS / 1e9).toFixed(4)} SOL/acct` : `${CONFIG.PERCENT_FEE_BPS / 100}%`}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{formatSolShort(totals.netRecovery)}</div>
              <div className="stat-label">You Receive</div>
            </div>
          </div>
        )}
        
        <section className="scanner-section">
          <div className="section-header">
            <h2 className="section-title">{wallet ? 'Token Account Scanner' : 'Connect Your Wallet'}</h2>
            {wallet && (
              <button className="btn btn-secondary" onClick={scanAccounts} disabled={scanning || cleaning}>
                {scanning ? <><span className="spinner"></span> Scanning...</> : <>🔍 Scan Wallet</>}
              </button>
            )}
          </div>

          {/* Privacy Mode Toggle */}
          {wallet && (
            <div style={{display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", margin: "1rem 0", padding: "0.75rem 1rem", background: "var(--bg-secondary)", borderRadius: "8px", maxWidth: "400px", marginLeft: "auto", marginRight: "auto"}}>
              <span style={{fontSize: "0.85rem", color: privacyMode ? "var(--accent-green)" : "var(--text-muted)"}}>🛡️ Privacy Mode</span><button onClick={() => setShowPrivacyInfo(true)} style={{background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem", padding: "0 0.25rem"}}>ⓘ</button>
              <button onClick={() => setPrivacyMode(!privacyMode)} style={{width: "44px", height: "24px", borderRadius: "12px", border: "none", background: privacyMode ? "var(--accent-green)" : "var(--border)", cursor: "pointer", position: "relative", transition: "background 0.2s"}}>
                <span style={{position: "absolute", top: "2px", left: privacyMode ? "22px" : "2px", width: "20px", height: "20px", borderRadius: "50%", background: "#fff", transition: "left 0.2s"}}></span>
              </button>
              <span style={{fontSize: "0.7rem", color: "var(--text-muted)", maxWidth: "200px"}}>{privacyMode ? "Decoy reads + batching enabled" : "Standard mode"}</span>
            </div>
          )}
          
          {status.message && (
            <div className={`status-message ${status.type}`}>
              {status.type === 'info' && <span className="spinner"></span>}
              {status.type === 'success' && '✅'}
              {status.type === 'error' && '❌'}
              {status.type === 'warning' && '⚠️'}
              {status.message}
            </div>
          )}
          
          {cleaning && progress.total > 0 && (
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
              </div>
              <div className="progress-text">Batch {progress.current}/{progress.total}</div>
            </div>
          )}
          
          {!wallet && (
            <div className="empty-state">
              <div className="empty-state-icon">🔌</div>
              <div className="empty-state-title">Wallet Not Connected</div>
              <p>Connect your Solana wallet to scan for empty token accounts</p>
            </div>
          )}
          
          {wallet && emptyAccounts.length === 0 && !scanning && !status.message && (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">Ready to Scan</div>
              <p>Click "Scan Wallet" to find empty token accounts</p>
            </div>
          )}
          
          {emptyAccounts.length > 0 && (
            <>
              <div className="select-all-row" onClick={toggleAll}>
                <div className="checkbox-wrapper">
                  <div className={`checkbox ${selectedAccounts.size === emptyAccounts.length ? 'checked' : ''}`}></div>
                  <span>Select All ({emptyAccounts.length})</span>
                </div>
                <span style={{ color: 'var(--text-secondary)' }}>{selectedAccounts.size} selected</span>
              </div>
              
              <div className="account-list">
                {emptyAccounts.map((account) => (
                  <div 
                    key={account.address}
                    className={`account-item ${selectedAccounts.has(account.address) ? 'selected' : ''}`}
                    onClick={() => toggleAccount(account.address)}
                  >
                    <div className="checkbox-wrapper">
                      <div className={`checkbox ${selectedAccounts.has(account.address) ? 'checked' : ''}`}></div>
                      <div>
                        <div className="account-address">{shortenAddress(account.address, 8)}</div>
                        <div className="account-mint">Mint: {shortenAddress(account.mint, 6)} • {account.program}</div>
                      </div>
                    </div>
                    <div className="account-rent">{formatSol(account.rentLamports)}</div>
                  </div>
                ))}
              </div>
              
              <div className="summary-card">
                <div className="summary-row">
                  <span className="summary-label">Accounts to close</span>
                  <span className="summary-value">{totals.count}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Total recoverable</span>
                  <span className="summary-value">{formatSol(totals.totalRent)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Service fee ({CONFIG.FEE_MODEL === 'flat' ? `${(CONFIG.FLAT_FEE_LAMPORTS / 1e9).toFixed(4)}/acct` : `${CONFIG.PERCENT_FEE_BPS/100}%`})</span>
                  <span className="summary-value" style={{ color: 'var(--text-secondary)' }}>-{formatSol(totals.fee)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Transactions needed</span>
                  <span className="summary-value">{totals.batches}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">You receive</span>
                  <span className="summary-value highlight">{formatSol(totals.netRecovery)}</span>
                </div>
                
                <div className="action-buttons">
                  <button className="btn btn-primary" onClick={closeAccounts} disabled={cleaning || totals.count === 0}>
                    {cleaning ? <><span className="spinner"></span> Closing...</> : <>🧹 Close {totals.count} Accounts</>}
                  </button>
                  <button className="btn btn-primary" style={{background: "linear-gradient(135deg, #a855f7, #3b82f6)"}} onClick={doInstantAdvance} disabled={advanceLoading || !instantQuote?.eligible}>
                    {advanceLoading ? "Processing..." : `⚡ Instant (${instantQuote?.advanceSol?.toFixed(4) || "0"} SOL)`}
                  </button>
                  {finalTotals && <button className="btn btn-secondary" onClick={downloadResults}>📄 Download CSV</button>}
                </div>

              {/* Success Celebration + Destiny */}
              {finalTotals && finalTotals.count > 0 && (
                <div style={{marginTop: "1.5rem", padding: "1.5rem", background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(139,92,246,0.1))", borderRadius: "16px", border: "1px solid rgba(16,185,129,0.3)"}}>
                  <div style={{textAlign: "center", marginBottom: "1rem"}}>
                    <div style={{fontSize: "2rem", marginBottom: "0.5rem"}}>🎉</div>
                    <div style={{fontSize: "1.25rem", fontWeight: "bold", color: "var(--accent-green)"}}>
                      +{formatSol(finalTotals.netRecovered)} SOL Recovered!
                    </div>
                  </div>
                  
                  {walletDestiny && (
                    <div style={{padding: "1rem", background: "rgba(139,92,246,0.15)", borderRadius: "12px", marginBottom: "1rem", textAlign: "center"}}>
                      <div style={{fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.25rem"}}>YOUR 2026 DESTINY NUMBER</div>
                      <div style={{fontSize: "2rem", fontWeight: "bold", color: "#a855f7"}}>{walletDestiny.number}</div>
                      <div style={{fontSize: "1rem", fontWeight: "600", color: "var(--text-primary)", marginBottom: "0.5rem"}}>{walletDestiny.title}</div>
                      <div style={{fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.4"}}>{walletDestiny.msg}</div>
                    </div>
                  )}
                  
                  <div style={{fontSize: "0.85rem", color: "var(--text-secondary)", textAlign: "center", marginBottom: "1rem"}}>
                    🔒 Protect your recovered SOL with a hardware wallet
                  </div>
                  
                  <div style={{display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap"}}>
                    <span style={{fontSize: "0.75rem", opacity: 0.7}}>🔒 Security tip: consider a hardware wallet for long-term storage</span>
                  </div>
                </div>
              )}
              </div>
            </>
          )}
          
          {txLog.length > 0 && (
            <div className="tx-log">
              <div style={{ marginBottom: '0.5rem', fontWeight: 700 }}>Transaction Log</div>
              {txLog.map((entry, i) => (
                <div key={i} className="tx-log-entry">
                  <span>{entry.type === 'success' ? '✅' : '❌'}</span>
                  <span>{entry.message}</span>
                  {entry.signature && (
                    <a href={`https://solscan.io/tx/${entry.signature}`} target="_blank" rel="noopener noreferrer" className="tx-link">View →</a>
                  )}
                  {entry.recovered && <span style={{ color: 'var(--accent-green)' }}>+{formatSol(entry.recovered - entry.fee)}</span>}
                </div>
              ))}
            </div>
          )}
        </section>
        
        <section className="scanner-section">
          <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>How It Works</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>1</div>
              <div className="stat-label">Connect Wallet</div>
              <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Connect Phantom, Solflare, or any Solana wallet</p>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>2</div>
              <div className="stat-label">Scan & Select</div>
              <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>We find all empty token accounts holding rent</p>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>3</div>
              <div className="stat-label">Recover SOL</div>
              <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Sign transactions and get your SOL back instantly</p>
            </div>
          </div>
          
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>🔒 100% Non-Custodial</strong><br />
            Your keys never leave your wallet. All transactions are built locally and signed by you.
          </div>
        </section>
      </main>
      
      <footer className="footer">
        <p>Non-custodial • Your keys never leave your wallet</p>
      <p style={{ marginTop: '0.5rem' }}>Built for Solana degens 💚</p>
          <div style={{marginTop: "1.5rem", padding: "1rem", background: "var(--bg-secondary)", borderRadius: "12px", textAlign: "center"}}>
            <p style={{color: "var(--text-secondary)"}}>🔒 Always use a hardware wallet for long-term storage</p>
          </div>
      </footer>

      {/* Privacy Info Modal */}
      {showPrivacyInfo && (
        <div style={{position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000}} onClick={() => setShowPrivacyInfo(false)}>
          <div style={{background: "var(--bg-card)", borderRadius: "16px", padding: "2rem", maxWidth: "500px", margin: "1rem", border: "1px solid var(--border)"}} onClick={e => e.stopPropagation()}>
            <h3 style={{fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem", color: "var(--accent-green)"}}>🛡️ Privacy Mode Features</h3>
            <div style={{display: "flex", flexDirection: "column", gap: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem"}}>
              <div><strong style={{color: "var(--text-primary)"}}>Decoy RPC Reads</strong><br/>Queries popular token mints (USDC, USDT, wSOL, etc.) to mix your scan with normal DeFi traffic, making it harder to identify rent reclaim activity.</div>
              <div><strong style={{color: "var(--text-primary)"}}>Random Delays</strong><br/>Adds 500-1500ms random pauses between transaction batches to break timing patterns that could link your transactions.</div>
              <div><strong style={{color: "var(--text-primary)"}}>Traffic Mixing</strong><br/>Additional decoy reads between batches further obscure your actual account closure operations.</div>
              <div style={{padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "8px", fontSize: "0.8rem"}}><strong>Why Privacy?</strong> Empty token accounts can reveal your trading history. Privacy mode helps obscure this activity from RPC observers.</div>
            </div>
            <button onClick={() => setShowPrivacyInfo(false)} style={{marginTop: "1.5rem", width: "100%", padding: "0.75rem", background: "var(--accent-green)", color: "#000", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer"}}>Got it</button>
          </div>
        </div>
      )}

    </div>
  );
}
