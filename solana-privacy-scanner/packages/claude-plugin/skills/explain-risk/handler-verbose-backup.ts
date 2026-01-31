/**
 * explain-risk skill handler
 *
 * Provides detailed explanations of privacy risks detected by the scanner
 */

import type { SkillResult } from '../../src/types.js';

export interface ExplainRiskOptions {
  riskId?: string;
  list?: boolean;
  verbose?: boolean;
}

interface RiskExplanation {
  id: string;
  name: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  overview: string;
  whyItMatters: string;
  howItWorks: string;
  realWorldScenario: string;
  detectionMethods: string;
  prevention: string[];
  mitigation: string[];
  solanaSpecific: string;
  relatedRisks: string[];
  resources: string[];
}

/**
 * Comprehensive knowledge base of privacy risks
 */
const RISK_EXPLANATIONS: Record<string, RiskExplanation> = {
  'fee-payer-reuse': {
    id: 'fee-payer-reuse',
    name: 'Fee Payer Reuse',
    severity: 'CRITICAL',
    overview:
      'A single wallet pays transaction fees for multiple different accounts, creating a powerful link between seemingly unrelated addresses.',
    whyItMatters:
      'Fee payer reuse is the #1 privacy risk on Solana. Unlike other blockchains, Solana allows any account to pay fees for any transaction. When one wallet consistently pays fees for multiple accounts, it definitively proves all those accounts are controlled by the same entity.',
    howItWorks:
      'Every Solana transaction requires a fee payer to cover network costs. Developers often use a single "hot wallet" to pay fees for multiple user accounts to simplify infrastructure. However, this creates an on-chain graph where the fee payer wallet becomes a hub connecting all accounts it pays for.',
    realWorldScenario:
      'A DEX uses wallet A to pay fees for all user transactions. An analyst scans wallet A and finds it has paid fees for 10,000 different user accounts. Now all 10,000 users are linked to each other and to the DEX. If just one user is identified (e.g., through a CEX withdrawal), that identity can be associated with the entire cluster.',
    detectionMethods:
      'The scanner analyzes transaction metadata to find cases where: (1) The fee payer is different from the main signer, AND (2) The same fee payer appears across multiple accounts or transactions.',
    prevention: [
      'Each account should pay its own fees whenever possible',
      'If using external fee payers, use a unique fee payer per user account',
      'Implement fee payer rotation - use different payers for different transaction types',
      'For batch operations, group unrelated accounts separately with different payers',
    ],
    mitigation: [
      'Refactor code to move fee payer Keypair inside transaction loops',
      'Generate new fee payers for each user or session',
      'If centralizing fees is unavoidable, document the privacy trade-off',
      'Consider using fee delegation services that rotate payers automatically',
    ],
    solanaSpecific:
      'This risk is unique to Solana due to its flexible fee payer model. On UTXO chains like Bitcoin, the sender always pays fees from their own UTXO, preventing this linking vector. Solana\'s account model allows separation of fee payment from transaction signing, which is powerful for UX but dangerous for privacy.',
    relatedRisks: ['signer-overlap', 'address-reuse', 'known-entity-cex'],
    resources: [
      'https://docs.solana.com/developing/programming-model/transactions#fee-payer',
      'https://solana.com/developers/guides/advanced/how-to-use-priority-fees',
    ],
  },

  'fee-payer-never-self': {
    id: 'fee-payer-never-self',
    name: 'Fee Payer Never Self',
    severity: 'HIGH',
    overview:
      'An account never pays its own transaction fees, indicating it is funded and controlled by an external entity.',
    whyItMatters:
      'When an account never pays its own fees, it reveals a dependency relationship. This is common for custodial wallets, exchange hot wallets, or subsidized accounts. It tells observers that the account is not independently operated.',
    howItWorks:
      'Normal user wallets pay their own fees by funding themselves with SOL. When an account consistently has fees paid by others, it indicates: (1) The account may not hold SOL, (2) There is a funding entity managing operations, or (3) The account is part of a larger infrastructure.',
    realWorldScenario:
      'A user creates a "gasless" wallet through an app that pays all fees. Every transaction reveals the app\'s fee payer wallet. An analyst can then cluster all users of that app together and identify the service provider. If the service has KYC, user identities may be at risk.',
    detectionMethods:
      'The scanner checks if the target account ever appears as the fee payer in its own transactions. If it always uses external fee payers, this signal is raised.',
    prevention: [
      'Ensure user wallets hold SOL and pay their own fees',
      'If offering "gasless" transactions, clearly communicate privacy implications',
      'Use fee delegation services that rotate payers per user',
      'Fund user wallets with small SOL amounts for fee independence',
    ],
    mitigation: [
      'Add SOL to the account and update logic to use it as fee payer',
      'Implement fee payer rotation per user account',
      'Document the privacy trade-off if external fee payment is required',
    ],
    solanaSpecific:
      'Solana\'s low fees (<$0.001) make it feasible for accounts to pay their own fees. "Gasless" transactions are a UX feature but come at a privacy cost. Other chains with high fees (Ethereum) make self-payment harder, but Solana has no such excuse.',
    relatedRisks: ['fee-payer-reuse', 'known-entity-protocol'],
    resources: [
      'https://docs.solana.com/developing/programming-model/transactions',
    ],
  },

  'signer-overlap': {
    id: 'signer-overlap',
    name: 'Signer Overlap',
    severity: 'HIGH',
    overview:
      'The same combination of signers appears repeatedly across multiple transactions, linking accounts and revealing shared control.',
    whyItMatters:
      'Signer overlap proves common ownership. If accounts A and B both require signatures from keypair X and Y, they are controlled by the same entity. This is especially damaging when combined with multi-sig setups.',
    howItWorks:
      'Solana transactions can require multiple signers. When the same set of signers appears across different transactions or accounts, it creates a cryptographic proof of shared control. Unlike heuristics based on behavior, signer overlap is definitive.',
    realWorldScenario:
      'A user creates multiple "anonymous" wallets for different activities. However, they use the same multi-sig setup (keys A, B, C) for security on all wallets. An analyst can cluster all these wallets together by observing the repeated signer combination, defeating the attempt at compartmentalization.',
    detectionMethods:
      'The scanner analyzes transaction signers and identifies when the same combination of public keys appears across multiple transactions. It looks for both exact matches and partial overlaps.',
    prevention: [
      'Use unique signer keys for each independent wallet',
      'Avoid reusing multi-sig configurations across unrelated accounts',
      'If using hierarchical deterministic wallets, derive independent branches',
      'Rotate signing keys when creating new compartments',
    ],
    mitigation: [
      'Migrate to unique signer sets for each activity category',
      'Use hardware wallets with different seed phrases for different purposes',
      'If shared control is required, accept the privacy trade-off and document it',
    ],
    solanaSpecific:
      'Solana\'s support for multiple signers per transaction makes complex authorization schemes easy to implement. However, this flexibility can backfire for privacy if the same authorization pattern is reused across accounts.',
    relatedRisks: ['fee-payer-reuse', 'address-reuse'],
    resources: [
      'https://docs.solana.com/developing/programming-model/transactions#signatures',
    ],
  },

  'memo-pii': {
    id: 'memo-pii',
    name: 'Memo PII Exposure',
    severity: 'CRITICAL',
    overview:
      'Transaction memos contain personally identifiable information (PII) such as emails, phone numbers, names, or addresses.',
    whyItMatters:
      'Memos are permanently stored on-chain and publicly visible. PII in memos directly links blockchain activity to real-world identities. This is one of the most egregious privacy violations and often results from developer mistakes.',
    howItWorks:
      'The Solana memo program allows transactions to include UTF-8 text. Developers sometimes include user information for record-keeping without realizing it becomes public forever. Common mistakes include: email addresses for notifications, phone numbers for 2FA, usernames from app databases, or payment references containing names.',
    realWorldScenario:
      'A payment app includes the recipient\'s email in the memo field for each transaction. An analyst can: (1) Scan all transactions from the app\'s known addresses, (2) Extract emails from memos, (3) Build a database of wallet-to-email mappings, (4) Cross-reference with data breaches or social media to fully identify users and their transaction histories.',
    detectionMethods:
      'The scanner uses regex patterns to detect common PII formats in memos: email addresses (user@domain.com), phone numbers (555-123-4567), Social Security Numbers, credit card numbers, names with titles (Mr./Mrs.), and postal addresses. Severity varies by PII type.',
    prevention: [
      'Never include PII in transaction memos',
      'Use opaque reference IDs that map to off-chain databases',
      'Implement memo sanitization in your code before transaction submission',
      'Use encrypted off-chain storage for user data',
      'If payment references are needed, use UUIDs or hashes',
    ],
    mitigation: [
      'Immediately stop sending transactions with PII in memos',
      'Add validation to reject transactions containing PII patterns',
      'Create a privacy policy acknowledging past exposure',
      'Consider notifying affected users if significant PII was leaked',
      'Implement code review specifically for memo field usage',
    ],
    solanaSpecific:
      'Solana\'s memo program (SPL Memo) is commonly used for payment tracking but is frequently misused. Unlike Bitcoin OP_RETURN which has size limits, Solana memos can be arbitrarily large, leading to more extensive PII leakage.',
    relatedRisks: ['known-entity-cex', 'address-reuse'],
    resources: [
      'https://spl.solana.com/memo',
      'https://docs.solana.com/developing/programming-model/transactions#memo-program',
    ],
  },

  'address-reuse': {
    id: 'address-reuse',
    name: 'Address Reuse',
    severity: 'MEDIUM',
    overview:
      'A single address is used repeatedly for multiple transactions instead of generating new addresses for each use.',
    whyItMatters:
      'Address reuse creates a permanent public record of all activities associated with that address. It allows anyone to see your full transaction history, balance changes, and counterparties.',
    howItWorks:
      'Every transaction to or from a reused address adds to its public history. Unlike UTXO chains where you can use a new address per transaction, Solana\'s account model makes address rotation less common. However, rotation is still possible and important for privacy.',
    realWorldScenario:
      'A user shares their Solana wallet address on Twitter for donations. That same address is also used for: NFT purchases, DEX trading, and receiving salary payments. Anyone can now see: their income, spending habits, investment strategies, and political donations - all linked to their Twitter identity.',
    detectionMethods:
      'The scanner identifies when an account has a high transaction count relative to its age, or when it engages in diverse transaction types from a single address.',
    prevention: [
      'Generate new wallet addresses for different purposes',
      'Use separate wallets for: public donations, private transactions, and savings',
      'Implement address rotation in applications',
      'Use burner wallets for one-time or temporary activities',
    ],
    mitigation: [
      'Create new addresses for future activities',
      'Migrate funds to fresh addresses using privacy-preserving methods',
      'Compartmentalize activities across multiple wallets',
      'Use stealth addresses if available (future Solana feature)',
    ],
    solanaSpecific:
      'Solana\'s account model makes address reuse more common than on Bitcoin. Creating a new account costs rent (~0.00089 SOL per account), which incentivizes reuse. However, for privacy-sensitive operations, this small cost is worth paying.',
    relatedRisks: ['counterparty-reuse', 'balance-traceability', 'known-entity-cex'],
    resources: [
      'https://docs.solana.com/developing/programming-model/accounts',
    ],
  },

  'known-entity-cex': {
    id: 'known-entity-cex',
    name: 'Known Entity Interaction (CEX)',
    severity: 'HIGH',
    overview:
      'The account has interacted with a known centralized exchange (CEX) address, linking on-chain activity to potential KYC data.',
    whyItMatters:
      'Centralized exchanges require KYC (Know Your Customer) verification. When your wallet interacts with a CEX deposit address, it creates a link between your on-chain identity and your real-world identity stored in the exchange\'s database. This is the most common way blockchain users are deanonymized.',
    howItWorks:
      'The scanner maintains a database of known CEX addresses (Coinbase, Binance, FTX, etc.). When it detects transactions to or from these addresses, it flags them as high-risk. Even a single CEX interaction can compromise privacy for all past and future transactions from that wallet.',
    realWorldScenario:
      'A user withdraws SOL from Coinbase to wallet A. The exchange knows: the user\'s real name, address, and that wallet A belongs to them. The user then trades on a DEX, buys NFTs, and donates to a political campaign - all from wallet A. An analyst can now associate all these activities with the user\'s real identity via the Coinbase link.',
    detectionMethods:
      'The scanner uses a curated database of 78+ known addresses including exchanges, bridges, and protocols. It checks if the target account has any transactions with addresses labeled as "exchange".',
    prevention: [
      'Never send funds directly from a CEX to a privacy-sensitive address',
      'Use an intermediary wallet: CEX → Wallet A → (mix/swap) → Wallet B',
      'Wait significant time between CEX withdrawal and next transaction',
      'Use peer-to-peer exchanges that don\'t require KYC',
      'Consider using privacy-preserving protocols between CEX and final destination',
    ],
    mitigation: [
      'Create a new wallet for privacy-sensitive activities',
      'Never reuse wallets that have touched KYC services',
      'If you must use the same wallet, assume all future activities are linked to your identity',
    ],
    solanaSpecific:
      'Major CEXs like Coinbase, Binance, and Kraken all support Solana. Their deposit addresses are well-documented and tracked. Solana\'s fast and cheap transactions make it easy to add intermediary hops, which you should do.',
    relatedRisks: ['address-reuse', 'counterparty-reuse', 'balance-traceability'],
    resources: [
      'https://www.coinbase.com/learn/crypto-basics/what-is-kyc',
    ],
  },

  'known-entity-bridge': {
    id: 'known-entity-bridge',
    name: 'Known Entity Interaction (Bridge)',
    severity: 'MEDIUM',
    overview:
      'The account has interacted with a known cross-chain bridge, enabling correlation across multiple blockchains.',
    whyItMatters:
      'Bridges connect Solana to other chains (Ethereum, Polygon, etc.). Bridge transactions create linkages across chains, allowing analysts to correlate your Solana activity with your activity on other blockchains, multiplying the privacy impact.',
    howItWorks:
      'When you bridge assets from Ethereum to Solana (or vice versa), both transactions are public and often linkable through timing, amounts, and bridge contract addresses. An analyst can connect your Ethereum wallet to your Solana wallet, combining the privacy leaks from both chains.',
    realWorldScenario:
      'A user bridges 10 ETH from Ethereum to Solana via Wormhole. On Ethereum, their address is linked to an ENS domain with their real name. After bridging, they use the Solana wallet for anonymous activities. However, the bridge transaction links both wallets, exposing their Solana identity via their Ethereum identity.',
    detectionMethods:
      'The scanner detects interactions with known bridge contracts (Wormhole, Allbridge, Portal, etc.) from its address database.',
    prevention: [
      'Use separate wallets for bridge operations and final destinations',
      'Bridge to an intermediary wallet, then transfer to your actual wallet',
      'Vary the timing and amount between bridge and subsequent transactions',
      'Consider using privacy-focused bridges if available',
    ],
    mitigation: [
      'Assume both chain identities are linked if you\'ve used bridges',
      'Create fresh wallets on both chains for future activities',
      'Use bridge aggregators that split and recombine amounts',
    ],
    solanaSpecific:
      'Solana has several major bridges (Wormhole, Allbridge, Portal). These bridges are central points of correlation. Solana\'s fast finality makes multi-hop strategies easier to execute for privacy.',
    relatedRisks: ['known-entity-cex', 'amount-reuse', 'timing-patterns'],
    resources: [
      'https://wormhole.com/',
      'https://allbridge.io/',
    ],
  },

  'known-entity-protocol': {
    id: 'known-entity-protocol',
    name: 'Known Entity Interaction (Protocol)',
    severity: 'LOW',
    overview:
      'The account has interacted with a known DeFi protocol, revealing usage patterns and potentially linking to protocol-specific identities.',
    whyItMatters:
      'Different DeFi protocols have different user bases and purposes. Knowing which protocols you use reveals information about your financial activities, investment strategies, and affiliations.',
    howItWorks:
      'The scanner detects interactions with major Solana protocols (Serum, Orca, Raydium, Magic Eden, etc.). While protocol usage alone isn\'t high-risk, it adds to your on-chain fingerprint and can combine with other signals.',
    realWorldScenario:
      'A user frequently interacts with a niche DeFi protocol that only has 500 active users. This narrows down their identity significantly compared to using a protocol with millions of users. Combined with timing patterns or CEX links, they could be identified within the small user cohort.',
    detectionMethods:
      'The scanner checks for interactions with addresses labeled as "protocol" in its database.',
    prevention: [
      'Be aware that protocol usage is public',
      'Use protocols with larger anonymity sets (more users)',
      'Vary your interaction patterns across different protocols',
      'Use protocol-specific addresses rather than a single address',
    ],
    mitigation: [
      'Limited mitigation available - protocol usage is permanent on-chain',
      'For future activities, use separate wallets per protocol category',
    ],
    solanaSpecific:
      'Solana has a vibrant DeFi ecosystem with distinct protocols. Many protocols have relatively small user bases, reducing anonymity sets. Solana\'s composability makes multi-protocol transactions common, creating complex on-chain fingerprints.',
    relatedRisks: ['instruction-fingerprint', 'counterparty-reuse'],
    resources: [
      'https://solana.com/ecosystem/defi',
    ],
  },

  'counterparty-reuse': {
    id: 'counterparty-reuse',
    name: 'Counterparty Reuse',
    severity: 'MEDIUM',
    overview:
      'The account repeatedly transacts with the same counterparties, revealing relationships and transaction patterns.',
    whyItMatters:
      'Repeated interactions with the same addresses create a social graph. If any of your counterparties are identified, your identity becomes easier to infer through association. It also reveals business relationships, friends, or service providers.',
    howItWorks:
      'The scanner tracks which addresses you send to or receive from. High reuse of the same counterparties suggests: business relationships (vendor/customer), personal relationships (friends/family), or service usage (recurring payments).',
    realWorldScenario:
      'A user receives monthly salary payments from the same employer wallet. An analyst can: (1) Identify the timing pattern (monthly), (2) Link the user to the employer, (3) Estimate salary based on amounts, (4) Track if the user changes jobs by observing new counterparty patterns.',
    detectionMethods:
      'The scanner counts unique counterparties and calculates a counterparty reuse ratio. High ratios indicate concentrated relationships.',
    prevention: [
      'Use unique addresses for each business relationship',
      'Encourage counterparties to rotate addresses',
      'Use intermediary addresses to break direct links',
      'Vary transaction amounts and timing to reduce patterns',
    ],
    mitigation: [
      'Migrate to new addresses for ongoing relationships',
      'Use payment processors that rotate addresses',
      'Accept the privacy trade-off if counterparty insists on address reuse',
    ],
    solanaSpecific:
      'Solana\'s account rent model encourages address reuse, making counterparty reuse common. However, the low cost of new accounts makes rotation feasible for privacy-conscious users.',
    relatedRisks: ['address-reuse', 'timing-patterns', 'amount-reuse'],
    resources: [],
  },

  'timing-burst': {
    id: 'timing-burst',
    name: 'Timing Patterns (Burst)',
    severity: 'HIGH',
    overview:
      'Concentrated transaction activity in a short time period, indicating automated behavior or coordinated operations.',
    whyItMatters:
      'Transaction bursts are fingerprints of automated systems or batch operations. They suggest bot activity, coordinated trades, or infrastructure operations rather than organic user behavior. This can identify service providers or traders.',
    howItWorks:
      'The scanner analyzes transaction timestamps. When it finds many transactions in a short period (e.g., 20 transactions in 1 hour), it flags this as a burst pattern. Bursts are rare for normal users but common for bots and infrastructure.',
    realWorldScenario:
      'An arbitrage bot executes 50 trades in 10 minutes across multiple DEXs. The burst pattern is distinctive - few users trade that frequently. An analyst can: (1) Identify the bot operator, (2) Track profitability, (3) Reverse-engineer the strategy, (4) Front-run future trades.',
    detectionMethods:
      'The scanner calculates transaction rate (tx/hour). Rates above certain thresholds trigger the signal. It also looks for gaps between bursts (bot on/off cycles).',
    prevention: [
      'Spread transactions over longer time periods',
      'Add random delays between automated operations',
      'Use multiple wallets to split burst activity',
      'Implement rate limiting in your scripts',
    ],
    mitigation: [
      'Refactor bots to use timing randomization',
      'Split operations across multiple addresses',
      'Accept the trade-off between speed and privacy',
    ],
    solanaSpecific:
      'Solana\'s high throughput (65,000 TPS capacity) and low fees make burst behavior more common than on other chains. However, this also means burst patterns are more distinctive when they occur.',
    relatedRisks: ['timing-regular', 'instruction-fingerprint'],
    resources: [],
  },

  'timing-regular': {
    id: 'timing-regular',
    name: 'Timing Patterns (Regular Interval)',
    severity: 'MEDIUM',
    overview:
      'Transactions occur at regular, predictable intervals, indicating scheduled operations or recurring payments.',
    whyItMatters:
      'Regular timing patterns reveal automated systems, payroll schedules, subscription payments, or other predictable behaviors. This reduces anonymity and makes transaction prediction possible.',
    howItWorks:
      'The scanner analyzes gaps between transactions. When intervals are consistent (e.g., every 7 days, every hour), it suggests automation or scheduled operations rather than organic user activity.',
    realWorldScenario:
      'A company pays employees every two weeks at exactly 9am UTC. An analyst can: (1) Identify all employee wallets by the timing pattern, (2) Estimate number of employees, (3) Track hiring/firing, (4) Monitor business health via payroll regularity.',
    detectionMethods:
      'The scanner calculates standard deviation of transaction intervals. Low deviation indicates regular patterns.',
    prevention: [
      'Add random delays to scheduled operations',
      'Vary payment schedules slightly',
      'Use different addresses for different recurring payments',
      'Batch operations with irregular timing',
    ],
    mitigation: [
      'Introduce timing randomization in your automation',
      'Split regular operations across multiple addresses',
    ],
    solanaSpecific:
      'Solana\'s reliability makes it popular for scheduled operations (payroll, subscriptions, etc.). The consistent block times make timing patterns more visible than on chains with variable block times.',
    relatedRisks: ['timing-burst', 'counterparty-reuse'],
    resources: [],
  },

  'timing-timezone': {
    id: 'timing-timezone',
    name: 'Timing Patterns (Timezone)',
    severity: 'LOW',
    overview:
      'Transactions cluster around specific times of day, revealing the user\'s likely geographic location or working hours.',
    whyItMatters:
      'Time-of-day patterns can reveal: geographic location (timezone), work schedule, sleep patterns, or lifestyle habits. This narrows down possible user identities significantly.',
    howItWorks:
      'The scanner analyzes transaction times and looks for patterns in hour-of-day distribution. Transactions concentrated during specific hours suggest user activity patterns.',
    realWorldScenario:
      'A user\'s transactions always occur between 9am-5pm EST on weekdays, with none on weekends. An analyst can infer: (1) User is in Eastern timezone (or UTC-5), (2) Transactions occur during work hours, (3) User likely has a traditional job, (4) Possibly trading from office computer.',
    detectionMethods:
      'The scanner converts transaction timestamps to hours and calculates the distribution. Concentrated activity in specific hours triggers this signal.',
    prevention: [
      'Use scheduled transactions that execute at random times',
      'Vary your transaction times across the full day',
      'Use bots with timezone randomization',
      'If possible, use delayed transaction submission',
    ],
    mitigation: [
      'For future transactions, randomize timing',
      'Use tools that batch and submit at varied times',
    ],
    solanaSpecific:
      'Solana\'s fast finality means transactions happen when you click submit - there\'s no mempool delay to obscure timing. This makes timezone patterns more accurate than on chains with unpredictable confirmation times.',
    relatedRisks: ['timing-regular', 'timing-burst'],
    resources: [],
  },

  'instruction-fingerprint': {
    id: 'instruction-fingerprint',
    name: 'Instruction Fingerprinting',
    severity: 'MEDIUM',
    overview:
      'Unique program call patterns and instruction sequences that identify specific applications, developers, or trading strategies.',
    whyItMatters:
      'The programs you call and the order you call them in creates a fingerprint. Unique or rare instruction patterns can identify: which app you\'re using, which version, your trading strategy, or even specific developers.',
    howItWorks:
      'Every Solana transaction lists the programs it calls. The scanner looks for: (1) Rare program combinations, (2) Unique instruction sequences, (3) Custom program usage, (4) Development/testing patterns.',
    realWorldScenario:
      'A developer deploys a custom trading bot that uses a unique sequence: Serum → Raydium → Orca in a single transaction. Only 3 wallets on Solana use this exact pattern. If the developer\'s identity is revealed through any means, the other 2 wallets are likely also theirs.',
    detectionMethods:
      'The scanner analyzes instruction lists and compares them to common patterns. Unusual combinations or custom program usage trigger this signal.',
    prevention: [
      'Use common program call patterns when possible',
      'Avoid unique instruction sequences',
      'Don\'t use development programs from production wallets',
      'Test custom programs from separate addresses',
    ],
    mitigation: [
      'Migrate unique operations to fresh addresses',
      'Use standard protocols rather than custom implementations',
      'Accept fingerprinting if using novel strategies',
    ],
    solanaSpecific:
      'Solana\'s composability makes complex multi-program transactions common. This creates rich fingerprinting opportunities. The program ID is always visible, making program usage trivially trackable.',
    relatedRisks: ['known-entity-protocol', 'timing-burst'],
    resources: [
      'https://docs.solana.com/developing/programming-model/transactions#instructions',
    ],
  },

  'token-account-lifecycle': {
    id: 'token-account-lifecycle',
    name: 'Token Account Lifecycle',
    severity: 'MEDIUM',
    overview:
      'Creating and closing token accounts reveals patterns, and rent refunds from closed accounts can link otherwise separate addresses.',
    whyItMatters:
      'When you close a token account, rent is refunded to a destination address. If you use the same refund destination across multiple token accounts, it links them all together. This is a subtle but powerful linking technique.',
    howItWorks:
      'Token accounts on Solana require rent (~0.002 SOL). When closed, this rent is refunded to an address you specify. The scanner tracks: (1) Token account creation patterns, (2) Closure timing, (3) Rent refund destinations.',
    realWorldScenario:
      'A user creates 10 different token accounts for various trades, all from different wallets for privacy. However, they close all accounts and send rent refunds to the same "savings" wallet. This links all 10 trading wallets to the savings wallet, defeating the compartmentalization.',
    detectionMethods:
      'The scanner looks for CloseAccount instructions in the SPL Token program and traces where rent refunds go.',
    prevention: [
      'Use different refund destinations for different compartments',
      'Leave token accounts open (rent is minimal)',
      'Refund rent to the same wallet that created the account',
      'Use burner addresses for refund destinations',
    ],
    mitigation: [
      'For future closures, vary refund destinations',
      'Consider leaving accounts open to avoid refund linking',
    ],
    solanaSpecific:
      'This is entirely Solana-specific due to the rent system and token account model. Other chains don\'t have this linking vector. The rent refund feature is convenient but dangerous for privacy.',
    relatedRisks: ['address-reuse', 'balance-traceability'],
    resources: [
      'https://spl.solana.com/token',
      'https://docs.solana.com/developing/programming-model/accounts#rent',
    ],
  },

  'amount-reuse': {
    id: 'amount-reuse',
    name: 'Amount Reuse',
    severity: 'LOW',
    overview:
      'Repeated use of the same transaction amounts, creating a potential fingerprint.',
    whyItMatters:
      'While less powerful on Solana than on Bitcoin, repeated amounts can still create patterns. Unique amounts (e.g., 1.23456 SOL) are more memorable and trackable than round numbers.',
    howItWorks:
      'The scanner tracks transaction amounts and flags repeated values. While many users might send 1 SOL, very few will repeatedly send exactly 1.2345678 SOL.',
    realWorldScenario:
      'A user always tips their favorite content creator exactly 0.42069 SOL. This unique amount is easily searchable on-chain. An analyst can track: (1) All wallets that send this amount, (2) The recipient, (3) Potentially link the tipper if they use the same wallet for other activities.',
    detectionMethods:
      'The scanner calculates amount frequency and flags values that appear repeatedly, especially non-round amounts.',
    prevention: [
      'Vary transaction amounts',
      'Avoid "unique" or "memorable" amounts',
      'Add random noise to amounts (e.g., 1.00423 instead of 1.0)',
      'Use round numbers only for one-off transactions',
    ],
    mitigation: [
      'For future transactions, randomize amounts',
      'Past amount patterns are permanent but low-severity',
    ],
    solanaSpecific:
      'Amount reuse is less impactful on Solana than on Bitcoin because Solana uses accounts (not UTXOs). You can\'t do amount-based clustering as effectively. However, it still adds to your overall fingerprint.',
    relatedRisks: ['counterparty-reuse', 'timing-patterns'],
    resources: [],
  },

  'balance-traceability': {
    id: 'balance-traceability',
    name: 'Balance Traceability',
    severity: 'MEDIUM',
    overview:
      'Fund flows can be traced between accounts, revealing sources and destinations of assets.',
    whyItMatters:
      'Solana\'s account model makes balance tracing simpler than UTXO chains in some ways. If you can trace where funds came from or where they went, it links your identity across transactions.',
    howItWorks:
      'The scanner analyzes transaction amounts and balances to identify traceable fund flows. Large transfers or unique amounts make tracing easier.',
    realWorldScenario:
      'A user withdraws exactly 100 SOL from Coinbase to wallet A. Hours later, wallet A sends exactly 100 SOL to wallet B. The amount and timing make it highly likely both wallets belong to the same user, linking wallet B back to the Coinbase KYC data.',
    detectionMethods:
      'The scanner looks for: (1) Large transfers that match previous balances, (2) Timing between related transfers, (3) Chains of transactions with decreasing amounts (minus fees).',
    prevention: [
      'Split large transfers into multiple smaller, irregular amounts',
      'Introduce time delays between related transfers',
      'Add intermediary wallets with balance mixing',
      'Use privacy-preserving protocols when available',
    ],
    mitigation: [
      'For future transfers, use multi-hop strategies',
      'Split and recombine amounts across transactions',
      'Use time-delayed transactions',
    ],
    solanaSpecific:
      'Solana\'s low fees make multi-hop strategies very affordable. Unlike Ethereum where each hop costs $$$, on Solana you can do 10+ hops for <$0.01 total. Use this to your advantage.',
    relatedRisks: ['amount-reuse', 'timing-patterns', 'known-entity-cex'],
    resources: [],
  },
};

/**
 * Get explanation for a specific risk
 */
export async function explainRisk(
  options: ExplainRiskOptions
): Promise<SkillResult> {
  try {
    // Handle list flag
    if (options.list) {
      return {
        success: true,
        message: createRiskListMessage(),
      };
    }

    // Validate risk ID provided
    if (!options.riskId) {
      return {
        success: false,
        error: 'No risk ID provided. Usage: /explain-risk <signal-id> or /explain-risk --list',
      };
    }

    // Normalize risk ID (lowercase, handle variations)
    const normalizedId = options.riskId.toLowerCase().trim();

    // Look up explanation
    const explanation = RISK_EXPLANATIONS[normalizedId];

    if (!explanation) {
      return {
        success: false,
        error: `Unknown risk ID: ${options.riskId}\n\nUse /explain-risk --list to see all available risk IDs.`,
      };
    }

    // Format and return explanation
    const message = createExplanationMessage(explanation);

    return {
      success: true,
      data: explanation,
      message,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to explain risk: ${error.message}`,
    };
  }
}

/**
 * Create formatted explanation message
 */
function createExplanationMessage(explanation: RiskExplanation): string {
  const lines: string[] = [];

  // Header
  const severityEmoji = {
    CRITICAL: '🔴',
    HIGH: '🔴',
    MEDIUM: '🟡',
    LOW: '🔵',
  }[explanation.severity];

  lines.push(`# ${severityEmoji} ${explanation.name}`);
  lines.push('');
  lines.push(`**Risk ID:** \`${explanation.id}\``);
  lines.push(`**Severity:** ${explanation.severity}`);
  lines.push('');

  // Overview
  lines.push('## What This Is');
  lines.push('');
  lines.push(explanation.overview);
  lines.push('');

  // Why it matters
  lines.push('## Why It Matters');
  lines.push('');
  lines.push(explanation.whyItMatters);
  lines.push('');

  // How it works
  lines.push('## How It Works');
  lines.push('');
  lines.push(explanation.howItWorks);
  lines.push('');

  // Real-world scenario
  lines.push('## Real-World Deanonymization Scenario');
  lines.push('');
  lines.push(explanation.realWorldScenario);
  lines.push('');

  // Detection methods
  lines.push('## How The Scanner Detects This');
  lines.push('');
  lines.push(explanation.detectionMethods);
  lines.push('');

  // Prevention
  lines.push('## Prevention Strategies');
  lines.push('');
  explanation.prevention.forEach((item) => {
    lines.push(`- ${item}`);
  });
  lines.push('');

  // Mitigation
  lines.push('## Mitigation (If Already Affected)');
  lines.push('');
  explanation.mitigation.forEach((item) => {
    lines.push(`- ${item}`);
  });
  lines.push('');

  // Solana-specific
  lines.push('## Solana-Specific Considerations');
  lines.push('');
  lines.push(explanation.solanaSpecific);
  lines.push('');

  // Related risks
  if (explanation.relatedRisks.length > 0) {
    lines.push('## Related Privacy Risks');
    lines.push('');
    explanation.relatedRisks.forEach((riskId) => {
      const related = RISK_EXPLANATIONS[riskId];
      if (related) {
        lines.push(`- **${related.name}** (\`${riskId}\`) - ${related.overview}`);
      }
    });
    lines.push('');
  }

  // Resources
  if (explanation.resources.length > 0) {
    lines.push('## Additional Resources');
    lines.push('');
    explanation.resources.forEach((url) => {
      lines.push(`- ${url}`);
    });
    lines.push('');
  }

  // Next steps
  lines.push('## Next Steps');
  lines.push('');
  lines.push('- Use `/scan-wallet` or `/scan-code` to check for this risk');
  lines.push('- Use `/suggest-fix` to get code-level solutions');
  lines.push('- Review the prevention strategies above');
  lines.push('');

  return lines.join('\n');
}

/**
 * Create list of all available risks
 */
function createRiskListMessage(): string {
  const lines: string[] = [];

  lines.push('# Available Privacy Risk Explanations');
  lines.push('');
  lines.push('Use `/explain-risk <risk-id>` to get detailed explanations.');
  lines.push('');

  // Group by category
  const solanaSpecific = [
    'fee-payer-reuse',
    'fee-payer-never-self',
    'signer-overlap',
    'memo-pii',
    'address-reuse',
  ];
  const behavioral = [
    'known-entity-cex',
    'known-entity-bridge',
    'known-entity-protocol',
    'counterparty-reuse',
    'instruction-fingerprint',
    'token-account-lifecycle',
  ];
  const timing = ['timing-burst', 'timing-regular', 'timing-timezone'];
  const traditional = ['amount-reuse', 'balance-traceability'];

  lines.push('## Solana-Specific Privacy Risks');
  lines.push('');
  solanaSpecific.forEach((id) => {
    const risk = RISK_EXPLANATIONS[id];
    if (risk) {
      lines.push(`### \`${id}\``);
      lines.push(`**${risk.name}** (${risk.severity})`);
      lines.push(risk.overview);
      lines.push('');
    }
  });

  lines.push('## Behavioral Analysis Risks');
  lines.push('');
  behavioral.forEach((id) => {
    const risk = RISK_EXPLANATIONS[id];
    if (risk) {
      lines.push(`### \`${id}\``);
      lines.push(`**${risk.name}** (${risk.severity})`);
      lines.push(risk.overview);
      lines.push('');
    }
  });

  lines.push('## Timing Pattern Risks');
  lines.push('');
  timing.forEach((id) => {
    const risk = RISK_EXPLANATIONS[id];
    if (risk) {
      lines.push(`### \`${id}\``);
      lines.push(`**${risk.name}** (${risk.severity})`);
      lines.push(risk.overview);
      lines.push('');
    }
  });

  lines.push('## Traditional Privacy Risks (Adapted for Solana)');
  lines.push('');
  traditional.forEach((id) => {
    const risk = RISK_EXPLANATIONS[id];
    if (risk) {
      lines.push(`### \`${id}\``);
      lines.push(`**${risk.name}** (${risk.severity})`);
      lines.push(risk.overview);
      lines.push('');
    }
  });

  lines.push('---');
  lines.push('');
  lines.push(`Total risks documented: ${Object.keys(RISK_EXPLANATIONS).length}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * CLI entry point for testing
 */
export async function main(): Promise<void> {
  const args = process.argv.slice(2);

  const options: ExplainRiskOptions = {
    riskId: undefined,
    list: args.includes('--list'),
    verbose: args.includes('--verbose'),
  };

  // Get risk ID if provided
  if (args.length > 0 && !args[0].startsWith('--')) {
    options.riskId = args[0];
  }

  const result = await explainRisk(options);

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
