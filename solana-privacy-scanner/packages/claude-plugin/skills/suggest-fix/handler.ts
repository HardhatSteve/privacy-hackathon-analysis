/**
 * suggest-fix skill handler
 *
 * Generates code-level fixes for privacy issues
 */

import type { SkillResult } from '../../src/types.js';

export interface SuggestFixOptions {
  target?: string; // risk-id or file:line
  list?: boolean;
  verbose?: boolean;
}

interface FixTemplate {
  id: string;
  name: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  issueSummary: string;
  currentCode: string;
  fixedCode: string;
  explanation: string;
  alternatives: string[];
  testing: string[];
  tradeoffs: string[];
  relatedFixes: string[];
}

/**
 * Comprehensive fix template database
 */
const FIX_TEMPLATES: Record<string, FixTemplate> = {
  'fee-payer-reuse': {
    id: 'fee-payer-reuse',
    name: 'Fee Payer Reuse',
    severity: 'CRITICAL',
    issueSummary:
      'Fee payer variable declared outside loop and reused for multiple accounts, creating definitive links between all transactions.',
    currentCode: `// ❌ VULNERABLE: Single fee payer links all recipients
const feePayer = Keypair.generate();

for (const recipient of recipients) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: recipient,
      lamports: LAMPORTS_PER_SOL,
    })
  );

  transaction.feePayer = feePayer.publicKey;
  await sendAndConfirmTransaction(
    connection,
    transaction,
    [sender, feePayer]
  );
}`,
    fixedCode: `// ✅ PRIVATE: Unique fee payer per transaction
for (const recipient of recipients) {
  // Generate fresh fee payer for each transaction
  const feePayer = Keypair.generate();

  // Fund the fee payer (in production, use a funding service)
  // await fundAccount(feePayer.publicKey, minimumFeeAmount);

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: recipient,
      lamports: LAMPORTS_PER_SOL,
    })
  );

  transaction.feePayer = feePayer.publicKey;
  await sendAndConfirmTransaction(
    connection,
    transaction,
    [sender, feePayer]
  );
}`,
    explanation:
      'Moved feePayer generation inside the loop so each transaction uses a unique fee payer. This prevents linking recipients through a shared fee payer. Each fee payer must be funded before use (consider a fee payer funding service for production).',
    alternatives: [
      'Self-Payment: Have sender pay its own fees (transaction.feePayer = sender.publicKey)',
      'Fee Payer Pool: Rotate through an array of pre-funded fee payers',
      'Per-User Payers: Assign one long-lived fee payer per user account (better than one shared payer, worse than unique per-tx)',
      'Privacy Service: Use a third-party fee delegation service that handles rotation',
    ],
    testing: [
      'Verify each transaction has a different fee payer address',
      'Check that fee payers have sufficient SOL before sending',
      'Monitor transaction success rate (failures increase if payers unfunded)',
      'Test with small amounts first',
    ],
    tradeoffs: [
      'Cost: Need to fund each fee payer (adds ~0.000005 SOL per tx)',
      'Complexity: Requires fee payer funding logic',
      'Speed: Slight delay if funding payers synchronously',
      'Privacy Gain: Massive - eliminates #1 Solana privacy risk',
    ],
    relatedFixes: ['address-reuse', 'timing-patterns', 'signer-overlap'],
  },

  'memo-pii': {
    id: 'memo-pii',
    name: 'Memo PII Exposure',
    severity: 'CRITICAL',
    issueSummary:
      'Transaction memos contain personally identifiable information (emails, phones, names) that is permanently public on-chain.',
    currentCode: `// ❌ VULNERABLE: Email exposed on-chain forever
const memo = \`Payment from \${user.email} to \${recipient.email}\`;

const transaction = new Transaction().add(
  new TransactionInstruction({
    keys: [],
    programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    data: Buffer.from(memo, 'utf-8'),
  }),
  SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: recipient.publicKey,
    lamports: amount,
  })
);`,
    fixedCode: `// ✅ PRIVATE: Use opaque reference ID
import { v4 as uuidv4 } from 'uuid';

// Generate opaque reference
const paymentRef = uuidv4(); // e.g., "3d7f8a9c-1b2e-4f5d-9c8a-7b6e5d4f3c2a"

// Store mapping off-chain in your database
await db.paymentReferences.create({
  id: paymentRef,
  fromEmail: user.email,
  toEmail: recipient.email,
  timestamp: Date.now(),
});

// Only put the reference ID on-chain
const memo = \`Payment ref: \${paymentRef}\`;

const transaction = new Transaction().add(
  new TransactionInstruction({
    keys: [],
    programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
    data: Buffer.from(memo, 'utf-8'),
  }),
  SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: recipient.publicKey,
    lamports: amount,
  })
);`,
    explanation:
      'Replaced email addresses with a UUID reference. The UUID is meaningless to observers but can be looked up in your off-chain database. This keeps user PII private while maintaining transaction tracking.',
    alternatives: [
      'Remove Memo Entirely: Only use memos when absolutely necessary',
      'Hash References: Use hash of (internalId + salt) instead of UUID',
      'Encrypted Memos: Encrypt memo content with recipient public key (requires custom program)',
      'Memo Sanitization: Add validation to reject transactions with PII patterns before sending',
    ],
    testing: [
      'Scan all historical memos for PII using regex (emails, phones, etc.)',
      'Add unit tests that reject transactions with PII in memos',
      'Verify UUID lookups work correctly in your database',
      'Test memo field is still useful for your use case',
    ],
    tradeoffs: [
      'Complexity: Requires off-chain database for reference storage',
      'Centralization: Reference mapping is centralized (but PII stays private)',
      'Cost: Minimal - memos are free on Solana',
      'Privacy Gain: Critical - prevents PII exposure',
    ],
    relatedFixes: ['address-reuse', 'known-entity-cex'],
  },

  'signer-overlap': {
    id: 'signer-overlap',
    name: 'Signer Overlap',
    severity: 'HIGH',
    issueSummary:
      'Same combination of signers used across multiple transactions or accounts, proving common ownership.',
    currentCode: `// ❌ VULNERABLE: Same multi-sig setup for all wallets
const authority1 = Keypair.fromSecretKey(/* ... */);
const authority2 = Keypair.fromSecretKey(/* ... */);

// Create multiple accounts with same signers
for (const purpose of ['trading', 'savings', 'donations']) {
  const account = Keypair.generate();

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: authority1.publicKey,
      toPubkey: account.publicKey,
      lamports: LAMPORTS_PER_SOL,
    })
  );

  // Same signers for all accounts - links them together!
  await sendAndConfirmTransaction(
    connection,
    transaction,
    [authority1, authority2]
  );
}`,
    fixedCode: `// ✅ PRIVATE: Unique signer keys per compartment
import { Keypair } from '@solana/web3.js';

// Generate unique authority keypairs per purpose
const tradingAuthority = Keypair.generate();
const savingsAuthority = Keypair.generate();
const donationsAuthority = Keypair.generate();

const authorities = {
  trading: tradingAuthority,
  savings: savingsAuthority,
  donations: donationsAuthority,
};

for (const [purpose, authority] of Object.entries(authorities)) {
  const account = Keypair.generate();

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: authority.publicKey,
      toPubkey: account.publicKey,
      lamports: LAMPORTS_PER_SOL,
    })
  );

  // Each account uses unique authority - no linking!
  await sendAndConfirmTransaction(
    connection,
    transaction,
    [authority]
  );
}`,
    explanation:
      'Generated unique authority keys for each wallet compartment instead of reusing the same multi-sig setup. This prevents analysts from clustering wallets by their signer combinations.',
    alternatives: [
      'Hardware Wallet Separation: Use different hardware wallets for different purposes',
      'HD Wallets: Derive independent branches from hierarchical deterministic wallet',
      'Per-Transaction Signers: Generate fresh signers for each transaction (most private, most complex)',
      'Accept Trade-off: Document that certain accounts are knowingly linked for operational reasons',
    ],
    testing: [
      'Verify each account has unique signer combinations',
      'Check that shared signers are only used when intentional',
      'Test key management and backup procedures',
      'Ensure authorities have proper access controls',
    ],
    tradeoffs: [
      'Complexity: More keys to manage and backup',
      'Security: More keys = more attack surface if not managed properly',
      'UX: May require multiple approvals for operations',
      'Privacy Gain: High - prevents cryptographic proof of common ownership',
    ],
    relatedFixes: ['fee-payer-reuse', 'address-reuse'],
  },

  'address-reuse': {
    id: 'address-reuse',
    name: 'Address Reuse',
    severity: 'MEDIUM',
    issueSummary:
      'Single address used for multiple purposes, creating a permanent public record of all activities.',
    currentCode: `// ❌ VULNERABLE: Same wallet for everything
const wallet = Keypair.fromSecretKey(/* ... */);

// All activities from one address
await buyNFT(wallet, nftMint);
await tradeDEX(wallet, tokenA, tokenB);
await receiveDonation(wallet.publicKey);
await paySalary(wallet, employee);`,
    fixedCode: `// ✅ PRIVATE: Separate wallets per activity type
const nftWallet = Keypair.generate();
const tradingWallet = Keypair.generate();
const donationWallet = Keypair.generate();
const payrollWallet = Keypair.generate();

// Compartmentalize activities
await buyNFT(nftWallet, nftMint);
await tradeDEX(tradingWallet, tokenA, tokenB);
await receiveDonation(donationWallet.publicKey);
await paySalary(payrollWallet, employee);

// Use intermediary wallets for transfers between compartments
async function transferBetweenCompartments(
  from: Keypair,
  to: PublicKey,
  amount: number
) {
  // Optional: Use intermediary to further break linkage
  const intermediary = Keypair.generate();

  // from -> intermediary
  await transfer(from, intermediary.publicKey, amount);

  // Add random delay
  await sleep(Math.random() * 5000 + 1000);

  // intermediary -> to
  await transfer(intermediary, to, amount);
}`,
    explanation:
      'Created separate wallets for each activity category instead of using a single wallet for everything. Added an intermediary transfer function to further break linkage when moving funds between compartments.',
    alternatives: [
      'Burner Wallets: Create and destroy wallets for one-time use',
      'Hierarchical Structure: Use HD wallets with different derivation paths',
      'Time-Based Rotation: Generate new addresses periodically (weekly, monthly)',
      'Purpose-Based: One address per counterparty or transaction type',
    ],
    testing: [
      'Verify each wallet is funded appropriately',
      'Test transfer flows between compartments',
      'Monitor that wallets are not accidentally reused across categories',
      'Check that wallet backups are comprehensive',
    ],
    tradeoffs: [
      'Complexity: Multiple wallets to manage',
      'Cost: Small rent costs per additional account (~0.00089 SOL)',
      'UX: More complex wallet switching',
      'Privacy Gain: Significant - prevents activity correlation',
    ],
    relatedFixes: ['counterparty-reuse', 'balance-traceability'],
  },

  'timing-burst': {
    id: 'timing-burst',
    name: 'Timing Patterns (Burst)',
    severity: 'HIGH',
    issueSummary:
      'Concentrated transaction bursts reveal automated behavior and create distinctive fingerprints.',
    currentCode: `// ❌ VULNERABLE: Rapid-fire transactions
const trades = await getArbitrageOpportunities();

for (const trade of trades) {
  // Execute immediately - creates burst pattern
  await executeTrade(trade);
}`,
    fixedCode: `// ✅ PRIVATE: Randomized timing with jitter
const trades = await getArbitrageOpportunities();

for (const trade of trades) {
  // Add random delay between 100-500ms
  const jitter = Math.random() * 400 + 100;
  await sleep(jitter);

  await executeTrade(trade);
}

// Helper function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// For more sophisticated randomization:
function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.random() * (maxMs - minMs) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}`,
    explanation:
      'Added random delays between transactions to avoid burst patterns. The jitter spreads transactions over time, making them look more like organic user behavior rather than bot activity.',
    alternatives: [
      'Exponential Backoff: Increase delays exponentially (1s, 2s, 4s, 8s...)',
      'Scheduled Randomization: Execute at random times within a time window',
      'Multiple Wallets: Split burst across different addresses',
      'Queue System: Batch operations and execute with time-based distribution',
    ],
    testing: [
      'Monitor transaction timestamps to verify randomization',
      'Check that delays don\'t impact critical time-sensitive operations',
      'Test that total execution time is acceptable for your use case',
      'Verify burst patterns are eliminated in on-chain analysis',
    ],
    tradeoffs: [
      'Speed: Operations take longer due to delays',
      'Opportunity: May miss time-sensitive opportunities (arbitrage, etc.)',
      'Complexity: Minimal - just add sleep() calls',
      'Privacy Gain: Significant - eliminates distinctive bot fingerprint',
    ],
    relatedFixes: ['timing-regular', 'instruction-fingerprint'],
  },

  'timing-regular': {
    id: 'timing-regular',
    name: 'Timing Patterns (Regular Interval)',
    severity: 'MEDIUM',
    issueSummary:
      'Transactions occur at predictable intervals, revealing scheduled operations or automation.',
    currentCode: `// ❌ VULNERABLE: Exact regular intervals
setInterval(async () => {
  // Payroll every exactly 7 days at 9:00 AM UTC
  await processPayroll();
}, 7 * 24 * 60 * 60 * 1000);`,
    fixedCode: `// ✅ PRIVATE: Randomized intervals
async function scheduleWithJitter() {
  while (true) {
    // Base interval: 7 days
    const baseInterval = 7 * 24 * 60 * 60 * 1000;

    // Add random jitter: ±12 hours
    const jitter = (Math.random() - 0.5) * 2 * 12 * 60 * 60 * 1000;
    const interval = baseInterval + jitter;

    await sleep(interval);

    // Also randomize time-of-day (±2 hours from 9 AM)
    const hourJitter = (Math.random() - 0.5) * 4 * 60 * 60 * 1000;
    await sleep(Math.abs(hourJitter));

    await processPayroll();
  }
}

scheduleWithJitter();`,
    explanation:
      'Added random jitter to the interval (±12 hours) and time-of-day (±2 hours) to prevent predictable patterns. Payroll still happens approximately weekly but not at exact intervals.',
    alternatives: [
      'Manual Triggering: Execute operations manually at irregular times',
      'Event-Based: Trigger on events rather than time intervals',
      'Variable Windows: Use different intervals (6-8 days instead of exactly 7)',
      'Multiple Wallets: Rotate which wallet handles scheduled operations',
    ],
    testing: [
      'Monitor interval distribution over time',
      'Verify operations still happen within acceptable timeframes',
      'Check that randomization doesn\'t cause operational issues',
      'Test that recipients expect variable timing',
    ],
    tradeoffs: [
      'Predictability: Operations happen at less predictable times',
      'UX: Users may expect exact schedules (communicate changes)',
      'Complexity: Minimal - just add jitter calculation',
      'Privacy Gain: Moderate - prevents scheduling-based identification',
    ],
    relatedFixes: ['timing-burst', 'timing-timezone'],
  },

  'counterparty-reuse': {
    id: 'counterparty-reuse',
    name: 'Counterparty Reuse',
    severity: 'MEDIUM',
    issueSummary:
      'Repeated transactions with same counterparties reveal relationships and patterns.',
    currentCode: `// ❌ VULNERABLE: Direct repeated payments
const vendor = new PublicKey('VendorAddress...');

// Monthly payments directly to vendor
for (const invoice of monthlyInvoices) {
  await transfer(wallet, vendor, invoice.amount);
}`,
    fixedCode: `// ✅ PRIVATE: Use intermediary addresses
const vendor = new PublicKey('VendorAddress...');

for (const invoice of monthlyInvoices) {
  // Create intermediary wallet
  const intermediary = Keypair.generate();

  // wallet -> intermediary
  await transfer(wallet, intermediary.publicKey, invoice.amount);

  // Random delay
  await sleep(Math.random() * 10000 + 5000);

  // intermediary -> vendor
  await transfer(intermediary, vendor, invoice.amount);

  // Use different intermediary each time
}

// Alternative: Payment processor that rotates addresses
async function payViaProcessor(
  from: Keypair,
  to: PublicKey,
  amount: number
) {
  // Payment processor provides rotating deposit addresses
  const processorAddress = await paymentProcessor.getDepositAddress();
  await transfer(from, processorAddress, amount);

  // Processor forwards to vendor from their own wallets
  // Breaking the direct link between you and vendor
}`,
    explanation:
      'Added intermediary wallets between sender and vendor to break direct transaction links. Each payment uses a fresh intermediary, preventing counterparty reuse detection.',
    alternatives: [
      'Payment Processors: Use services that provide address rotation',
      'Encourage Counterparty Rotation: Ask vendors to rotate receiving addresses',
      'Batching: Combine payments to multiple counterparties to obscure relationships',
      'Accept Trade-off: Some business relationships must be public',
    ],
    testing: [
      'Verify payments reach vendors correctly',
      'Test intermediary wallet funding and forwarding',
      'Check that timing delays don\'t impact payment SLAs',
      'Monitor transaction costs (extra hops cost extra fees)',
    ],
    tradeoffs: [
      'Cost: Additional transactions mean additional fees (~$0.001 per hop)',
      'Complexity: More complex payment flows to manage',
      'Time: Payments take longer due to multi-hop process',
      'Privacy Gain: Moderate - breaks direct counterparty links',
    ],
    relatedFixes: ['address-reuse', 'balance-traceability'],
  },

  'token-account-lifecycle': {
    id: 'token-account-lifecycle',
    name: 'Token Account Lifecycle',
    severity: 'MEDIUM',
    issueSummary:
      'Token account closures send rent refunds to same address, linking otherwise separate accounts.',
    currentCode: `// ❌ VULNERABLE: All rent refunds to same savings wallet
const savingsWallet = new PublicKey('Savings...');

for (const tokenAccount of unusedTokenAccounts) {
  // Close token account, refund rent to savings
  await closeAccount(
    connection,
    payer,
    tokenAccount,
    savingsWallet, // Same destination links all token accounts!
    owner
  );
}`,
    fixedCode: `// ✅ PRIVATE: Vary refund destinations or leave accounts open
// Option 1: Refund to same wallet that created the account
for (const tokenAccount of unusedTokenAccounts) {
  const owner = getTokenAccountOwner(tokenAccount);

  await closeAccount(
    connection,
    payer,
    tokenAccount,
    owner, // Refund to creator, not centralized savings
    owner
  );
}

// Option 2: Use burner refund addresses
for (const tokenAccount of unusedTokenAccounts) {
  const burnerRefund = Keypair.generate().publicKey;

  await closeAccount(
    connection,
    payer,
    tokenAccount,
    burnerRefund, // Different refund address each time
    owner
  );
  // Note: This "wastes" rent (0.002 SOL) but maximizes privacy
}

// Option 3: Leave accounts open (recommended if affordable)
// Token account rent is only ~0.002 SOL
// Consider leaving accounts open rather than closing them`,
    explanation:
      'Changed rent refund destination from a single savings wallet to either the account owner or unique burner addresses. This prevents linking token accounts via their closure transactions.',
    alternatives: [
      'Never Close Accounts: Leave them open (only ~0.002 SOL per account)',
      'Refund to Owner: Return rent to the wallet that created the account',
      'Time-Based Closure: Close accounts at different times to reduce correlation',
      'Batch Closures: If closing multiple accounts, use different refund addresses for each',
    ],
    testing: [
      'Verify rent refunds arrive at intended destinations',
      'Check that account closures complete successfully',
      'Monitor total rent costs vs. privacy benefit',
      'Test that closed accounts are properly cleaned up',
    ],
    tradeoffs: [
      'Cost: Leaving accounts open costs ~0.002 SOL each',
      'Waste: Burner refunds "lose" the rent amount',
      'Complexity: More wallet management if using multiple refund destinations',
      'Privacy Gain: Moderate - prevents token account clustering',
    ],
    relatedFixes: ['address-reuse', 'balance-traceability'],
  },

  'balance-traceability': {
    id: 'balance-traceability',
    name: 'Balance Traceability',
    severity: 'MEDIUM',
    issueSummary:
      'Exact amounts transferred between accounts make fund flows easily traceable.',
    currentCode: `// ❌ VULNERABLE: Exact amount traced from CEX to final wallet
const cexWithdrawalAmount = 100 * LAMPORTS_PER_SOL;

// Withdraw from CEX to wallet A
const walletA = Keypair.generate();
// CEX sends exactly 100 SOL to walletA

// Transfer to wallet B
const walletB = Keypair.generate();
await transfer(walletA, walletB.publicKey, cexWithdrawalAmount);
// Same exact amount links walletA to walletB!`,
    fixedCode: `// ✅ PRIVATE: Multi-hop with amount splitting and timing
const cexWithdrawalAmount = 100 * LAMPORTS_PER_SOL;

// Step 1: Withdraw from CEX to wallet A
const walletA = Keypair.generate();
// CEX sends 100 SOL to walletA

// Step 2: Split into multiple intermediaries with random amounts
const intermediaries = [
  Keypair.generate(),
  Keypair.generate(),
  Keypair.generate(),
];

const splits = [
  40.123 * LAMPORTS_PER_SOL,
  35.789 * LAMPORTS_PER_SOL,
  24.088 * LAMPORTS_PER_SOL, // Slightly less than 100 to account for fees
];

for (let i = 0; i < intermediaries.length; i++) {
  await transfer(walletA, intermediaries[i].publicKey, splits[i]);
  await sleep(Math.random() * 30000 + 10000); // Random delay 10-40s
}

// Step 3: Wait before recombining
await sleep(Math.random() * 60000 + 60000); // Wait 1-2 minutes

// Step 4: Recombine to final wallet with different amounts
const walletB = Keypair.generate();

for (const intermediary of intermediaries) {
  // Subtract small random amounts before forwarding
  const noise = Math.random() * 0.1 * LAMPORTS_PER_SOL;
  const balance = await connection.getBalance(intermediary.publicKey);
  const sendAmount = balance - LAMPORTS_PER_SOL * 0.001 - noise;

  await transfer(intermediary, walletB.publicKey, sendAmount);
  await sleep(Math.random() * 20000 + 5000);
}`,
    explanation:
      'Implemented multi-hop strategy with amount splitting and timing delays. The original 100 SOL is split into irregular amounts, sent to multiple intermediaries, delayed, then recombined with noise. This makes tracing the fund flow much harder.',
    alternatives: [
      'Privacy Mixers: Use privacy-preserving protocols when available (careful of legitimacy)',
      'Time Delays Only: Simple delays without splitting (less effective)',
      'DEX Swaps: Swap tokens as intermediary step (adds noise via slippage)',
      'Layer 2: Bridge to/from L2 solutions if available',
    ],
    testing: [
      'Verify all funds arrive at final destination (accounting for fees)',
      'Test with small amounts first',
      'Monitor that timing delays are acceptable',
      'Check that intermediary wallets are properly funded for fees',
    ],
    tradeoffs: [
      'Cost: Multiple transactions mean multiple fees (~$0.005 total)',
      'Time: Process takes 2-5 minutes instead of instant',
      'Complexity: Significantly more complex than direct transfer',
      'Privacy Gain: High - makes fund flow analysis very difficult',
    ],
    relatedFixes: ['amount-reuse', 'timing-patterns', 'known-entity-cex'],
  },

  'privacy-best-practices': {
    id: 'privacy-best-practices',
    name: 'Privacy Best Practices',
    severity: 'HIGH',
    issueSummary:
      'Comprehensive privacy-preserving transaction template combining multiple techniques.',
    currentCode: `// ❌ VULNERABLE: Naive transaction with multiple privacy leaks
async function sendPayment(recipient: PublicKey, amount: number) {
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: recipient,
      lamports: amount,
    })
  );

  return await sendAndConfirmTransaction(connection, transaction, [wallet]);
}`,
    fixedCode: `// ✅ PRIVATE: Privacy-preserving transaction with multiple techniques
async function sendPrivatePayment(
  fromWallet: Keypair,
  toAddress: PublicKey,
  baseAmount: number
) {
  // 1. Amount randomization - add small noise to prevent amount reuse
  const noise = (Math.random() - 0.5) * 0.01 * LAMPORTS_PER_SOL;
  const amount = baseAmount + noise;

  // 2. Use intermediary wallet
  const intermediary = Keypair.generate();

  // 3. Fund intermediary (first hop)
  const tx1 = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromWallet.publicKey,
      toPubkey: intermediary.publicKey,
      lamports: amount + LAMPORTS_PER_SOL * 0.001, // Extra for fees
    })
  );

  // 4. Unique fee payer for first hop
  const feePayer1 = Keypair.generate();
  // await fundFeePayer(feePayer1.publicKey);
  tx1.feePayer = feePayer1.publicKey;

  await sendAndConfirmTransaction(connection, tx1, [fromWallet, feePayer1]);

  // 5. Random timing delay
  await sleep(Math.random() * 10000 + 5000); // 5-15 seconds

  // 6. Forward to recipient (second hop)
  const tx2 = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: intermediary.publicKey,
      toPubkey: toAddress,
      lamports: amount,
    })
  );

  // 7. Different fee payer for second hop
  const feePayer2 = Keypair.generate();
  // await fundFeePayer(feePayer2.publicKey);
  tx2.feePayer = feePayer2.publicKey;

  await sendAndConfirmTransaction(connection, tx2, [intermediary, feePayer2]);

  return {
    intermediary: intermediary.publicKey.toBase58(),
    finalAmount: amount,
  };
}

// Helper: Add random delay
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// For production: Fee payer funding service
async function fundFeePayer(feePayer: PublicKey): Promise<void> {
  // Implement your fee payer funding logic
  // Could be a separate funded wallet, a service, etc.
}`,
    explanation:
      'Comprehensive privacy template that combines: (1) Amount randomization, (2) Intermediary wallet, (3) Unique fee payers per hop, (4) Timing delays, (5) Multi-hop architecture. This addresses multiple privacy risks simultaneously.',
    alternatives: [
      'Simplified Version: Use subset of techniques based on threat model',
      'More Hops: Add additional intermediaries for higher privacy (at cost)',
      'Token Swaps: Include DEX swaps to add noise and break tracing',
      'Privacy Protocols: Use dedicated privacy solutions when available',
    ],
    testing: [
      'Verify funds arrive correctly at destination',
      'Test fee payer funding mechanism thoroughly',
      'Monitor total transaction costs',
      'Check that timing delays are acceptable for use case',
      'Scan result with privacy scanner to verify improvements',
    ],
    tradeoffs: [
      'Cost: ~$0.01-0.02 per transaction (vs ~$0.001 for direct)',
      'Time: 10-30 seconds vs instant',
      'Complexity: Significantly more complex implementation',
      'Privacy Gain: Very High - addresses multiple vectors simultaneously',
    ],
    relatedFixes: [
      'fee-payer-reuse',
      'timing-patterns',
      'balance-traceability',
      'address-reuse',
    ],
  },
};

/**
 * Generate fix suggestion for a specific issue
 */
export async function suggestFix(
  options: SuggestFixOptions
): Promise<SkillResult> {
  try {
    // Handle list flag
    if (options.list) {
      return {
        success: true,
        message: createFixListMessage(),
      };
    }

    // Validate target provided
    if (!options.target) {
      return {
        success: false,
        error:
          'No target provided. Usage: /suggest-fix <risk-id> or /suggest-fix <file>:<line> or /suggest-fix --list',
      };
    }

    // Parse target (could be risk-id or file:line)
    const target = options.target.toLowerCase().trim();

    // Check if it's a file:line format
    if (target.includes(':')) {
      return {
        success: false,
        error:
          'File:line format not yet implemented. Use risk ID instead (e.g., /suggest-fix fee-payer-reuse)',
      };
    }

    // Look up fix template
    const template = FIX_TEMPLATES[target];

    if (!template) {
      return {
        success: false,
        error: `Unknown risk ID: ${options.target}\n\nUse /suggest-fix --list to see all available fix templates.`,
      };
    }

    // Format and return fix
    const message = createFixMessage(template);

    return {
      success: true,
      data: template,
      message,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to generate fix: ${error.message}`,
    };
  }
}

/**
 * Create formatted fix message
 */
function createFixMessage(template: FixTemplate): string {
  const lines: string[] = [];

  // Header
  const severityEmoji = {
    CRITICAL: '🔴',
    HIGH: '🔴',
    MEDIUM: '🟡',
    LOW: '🔵',
  }[template.severity];

  lines.push(`# ${severityEmoji} Fix: ${template.name}`);
  lines.push('');
  lines.push(`**Risk ID:** \`${template.id}\``);
  lines.push(`**Severity:** ${template.severity}`);
  lines.push('');

  // Issue summary
  lines.push('## Issue Summary');
  lines.push('');
  lines.push(template.issueSummary);
  lines.push('');

  // Current code
  lines.push('## Current Code (❌ VULNERABLE)');
  lines.push('');
  lines.push('```typescript');
  lines.push(template.currentCode);
  lines.push('```');
  lines.push('');

  // Fixed code
  lines.push('## Fixed Code (✅ PRIVATE)');
  lines.push('');
  lines.push('```typescript');
  lines.push(template.fixedCode);
  lines.push('```');
  lines.push('');

  // Explanation
  lines.push('## What Changed');
  lines.push('');
  lines.push(template.explanation);
  lines.push('');

  // Alternative approaches
  if (template.alternatives.length > 0) {
    lines.push('## Alternative Approaches');
    lines.push('');
    template.alternatives.forEach((alt, i) => {
      lines.push(`**Option ${i + 1}:** ${alt}`);
      lines.push('');
    });
  }

  // Testing recommendations
  if (template.testing.length > 0) {
    lines.push('## Testing Recommendations');
    lines.push('');
    template.testing.forEach((test) => {
      lines.push(`- ${test}`);
    });
    lines.push('');
  }

  // Trade-offs
  if (template.tradeoffs.length > 0) {
    lines.push('## Trade-offs to Consider');
    lines.push('');
    template.tradeoffs.forEach((tradeoff) => {
      lines.push(`- ${tradeoff}`);
    });
    lines.push('');
  }

  // Related fixes
  if (template.relatedFixes.length > 0) {
    lines.push('## Related Fixes');
    lines.push('');
    template.relatedFixes.forEach((fixId) => {
      const related = FIX_TEMPLATES[fixId];
      if (related) {
        lines.push(`- **${related.name}** (\`${fixId}\`)`);
      }
    });
    lines.push('');
  }

  // Next steps
  lines.push('## Next Steps');
  lines.push('');
  lines.push('1. Review the fix and adapt it to your codebase');
  lines.push('2. Test thoroughly in development environment');
  lines.push('3. Run `/scan-code` to verify the issue is resolved');
  lines.push('4. Consider related fixes for comprehensive privacy improvements');
  lines.push('5. Document privacy decisions in your code comments');
  lines.push('');

  return lines.join('\n');
}

/**
 * Create list of all available fixes
 */
function createFixListMessage(): string {
  const lines: string[] = [];

  lines.push('# Available Fix Templates');
  lines.push('');
  lines.push('Use `/suggest-fix <risk-id>` to get code-level fixes.');
  lines.push('');

  // Group by severity
  const critical = Object.values(FIX_TEMPLATES).filter(
    (f) => f.severity === 'CRITICAL'
  );
  const high = Object.values(FIX_TEMPLATES).filter((f) => f.severity === 'HIGH');
  const medium = Object.values(FIX_TEMPLATES).filter(
    (f) => f.severity === 'MEDIUM'
  );
  const low = Object.values(FIX_TEMPLATES).filter((f) => f.severity === 'LOW');

  if (critical.length > 0) {
    lines.push('## 🔴 CRITICAL Fixes');
    lines.push('');
    critical.forEach((fix) => {
      lines.push(`### \`${fix.id}\``);
      lines.push(`**${fix.name}**`);
      lines.push(fix.issueSummary);
      lines.push('');
    });
  }

  if (high.length > 0) {
    lines.push('## 🔴 HIGH Priority Fixes');
    lines.push('');
    high.forEach((fix) => {
      lines.push(`### \`${fix.id}\``);
      lines.push(`**${fix.name}**`);
      lines.push(fix.issueSummary);
      lines.push('');
    });
  }

  if (medium.length > 0) {
    lines.push('## 🟡 MEDIUM Priority Fixes');
    lines.push('');
    medium.forEach((fix) => {
      lines.push(`### \`${fix.id}\``);
      lines.push(`**${fix.name}**`);
      lines.push(fix.issueSummary);
      lines.push('');
    });
  }

  if (low.length > 0) {
    lines.push('## 🔵 LOW Priority Fixes');
    lines.push('');
    low.forEach((fix) => {
      lines.push(`### \`${fix.id}\``);
      lines.push(`**${fix.name}**`);
      lines.push(fix.issueSummary);
      lines.push('');
    });
  }

  lines.push('---');
  lines.push('');
  lines.push(`Total fix templates available: ${Object.keys(FIX_TEMPLATES).length}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * CLI entry point for testing
 */
export async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const options: SuggestFixOptions = {
    target: undefined,
    list: args.includes('--list'),
    verbose: args.includes('--verbose'),
  };

  // Get target if provided
  if (args.length > 0 && !args[0].startsWith('--')) {
    options.target = args[0];
  }

  const result = await suggestFix(options);

  if (!result.success) {
    console.error('❌ Error:', result.error);
    process.exit(1);
  }

  console.log(result.message || JSON.stringify(result.data, null, 2));
  process.exit(0);
}

// Allow running as standalone script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
