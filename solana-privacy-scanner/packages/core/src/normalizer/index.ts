import type {
  Transfer,
  NormalizedInstruction,
  InstructionCategory,
  ScanContext,
  LabelProvider,
  TransactionMetadata,
  TokenAccountEvent,
  PDAInteraction,
} from '../types/index.js';
import type {
  RawWalletData,
  RawTransactionData,
  RawProgramData,
} from '../collectors/index.js';
import type { ParsedTransactionWithMeta, PartiallyDecodedInstruction, ParsedInstruction } from '@solana/web3.js';

/**
 * Known program IDs for instruction categorization
 */
const PROGRAM_IDS = {
  SYSTEM: '11111111111111111111111111111111',
  TOKEN: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  ASSOCIATED_TOKEN: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  STAKE: 'Stake11111111111111111111111111111111111111',
  VOTE: 'Vote111111111111111111111111111111111111111',
  MEMO: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
  MEMO_V1: 'Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo',
};

/**
 * Helper to get account keys from both legacy and versioned transactions
 */
function getAccountKeys(tx: any): string[] {
  const message = tx?.transaction?.message;
  if (!message) return [];

  // Legacy format: accountKeys array
  if (message.accountKeys && Array.isArray(message.accountKeys)) {
    return message.accountKeys.map((key: any) =>
      typeof key === 'string' ? key : key.pubkey?.toString() || key.toString()
    );
  }

  // Versioned format: staticAccountKeys + addressTableLookups
  if (message.staticAccountKeys && Array.isArray(message.staticAccountKeys)) {
    const staticKeys = message.staticAccountKeys.map((key: any) =>
      typeof key === 'string' ? key : key.toString()
    );

    // Note: Address table lookups would need additional RPC calls to resolve
    // For now, we just use static keys which covers most use cases
    return staticKeys;
  }

  return [];
}

/**
 * Helper to get instructions from both legacy and versioned transactions
 */
function getInstructions(tx: any): Array<{ programIdIndex: number; accounts: number[]; data?: string }> {
  const message = tx?.transaction?.message;
  if (!message) return [];

  // Legacy format: instructions array with programIdIndex
  if (message.instructions && Array.isArray(message.instructions)) {
    return message.instructions;
  }

  // Versioned format: compiledInstructions
  if (message.compiledInstructions && Array.isArray(message.compiledInstructions)) {
    return message.compiledInstructions.map((instr: any) => ({
      programIdIndex: instr.programIdIndex,
      accounts: instr.accountKeyIndexes || [],
      data: instr.data,
    }));
  }

  return [];
}

/**
 * Extract transaction metadata (fee payer, signers, memos)
 */
function extractTransactionMetadata(
  tx: ParsedTransactionWithMeta,
  signature: string
): TransactionMetadata {
  // Use helper to get account keys (handles both legacy and versioned)
  const accountKeys = getAccountKeys(tx);

  // Defensive checks
  if (!tx || !tx.transaction || !tx.transaction.message || accountKeys.length === 0) {
    // Return minimal metadata if transaction is malformed
    return {
      signature,
      blockTime: tx?.blockTime ?? null,
      feePayer: 'unknown',
      signers: [],
    };
  }

  // First account is always the fee payer
  const feePayerAddress = accountKeys[0];

  // Extract signers
  const signers: string[] = [feePayerAddress];

  // For legacy transactions, check signer property
  const legacyKeys = tx.transaction.message.accountKeys;
  if (legacyKeys && Array.isArray(legacyKeys)) {
    for (let i = 1; i < legacyKeys.length; i++) {
      const key = legacyKeys[i];
      const address = typeof key === 'string' ? key : key.pubkey?.toString();

      if (typeof key !== 'string' && key.signer) {
        if (address && !signers.includes(address)) {
          signers.push(address);
        }
      }
    }
  }

  // For versioned transactions, use message header to determine signers
  const header = (tx.transaction.message as any).header;
  if (header && header.numRequiredSignatures > 1) {
    for (let i = 1; i < header.numRequiredSignatures && i < accountKeys.length; i++) {
      if (!signers.includes(accountKeys[i])) {
        signers.push(accountKeys[i]);
      }
    }
  }

  // Extract memo if present
  let memo: string | undefined;

  // Try legacy instructions first
  const legacyInstructions = tx.transaction.message.instructions;
  if (legacyInstructions && Array.isArray(legacyInstructions)) {
    for (const instruction of legacyInstructions) {
      if (!instruction) continue;

      // Handle parsed instructions
      if (instruction.programId) {
        const programId = instruction.programId.toString();
        if (programId === PROGRAM_IDS.MEMO || programId === PROGRAM_IDS.MEMO_V1) {
          if ('parsed' in instruction && instruction.parsed) {
            const parsed = instruction.parsed as any;
            if (parsed.type === 'memo' && typeof parsed.info === 'string') {
              memo = parsed.info;
            }
          } else if ('data' in instruction && typeof instruction.data === 'string') {
            try {
              memo = Buffer.from(instruction.data, 'base64').toString('utf8');
            } catch {
              memo = instruction.data;
            }
          }
          break;
        }
      }
      // Handle compiled instructions (versioned format within legacy array)
      else if ('programIdIndex' in instruction && accountKeys.length > 0) {
        const programIdIndex = (instruction as any).programIdIndex;
        if (programIdIndex >= 0 && programIdIndex < accountKeys.length) {
          const programId = accountKeys[programIdIndex];
          if (programId === PROGRAM_IDS.MEMO || programId === PROGRAM_IDS.MEMO_V1) {
            const data = (instruction as any).data;
            if (data) {
              try {
                memo = Buffer.from(data, 'base64').toString('utf8');
              } catch {
                memo = data;
              }
            }
            break;
          }
        }
      }
    }
  }

  // Try versioned compiledInstructions for memo
  if (!memo) {
    const compiledInstructions = (tx.transaction.message as any).compiledInstructions;
    if (compiledInstructions && Array.isArray(compiledInstructions) && accountKeys.length > 0) {
      for (const instruction of compiledInstructions) {
        if (!instruction) continue;
        const programIdIndex = instruction.programIdIndex;
        if (programIdIndex >= 0 && programIdIndex < accountKeys.length) {
          const programId = accountKeys[programIdIndex];
          if (programId === PROGRAM_IDS.MEMO || programId === PROGRAM_IDS.MEMO_V1) {
            const data = instruction.data;
            if (data) {
              try {
                memo = Buffer.from(data, 'base64').toString('utf8');
              } catch {
                memo = data;
              }
            }
            break;
          }
        }
      }
    }
  }

  // Extract compute units and priority fee if available
  let computeUnitsUsed: number | undefined;
  let priorityFee: number | undefined;
  
  if (tx.meta) {
    computeUnitsUsed = tx.meta.computeUnitsConsumed;
    
    // Priority fee is in the fee field, minus base fee
    if (tx.meta.fee !== undefined && tx.meta.fee > 5000) {
      priorityFee = tx.meta.fee - 5000; // Subtract base fee
    }
  }

  return {
    signature,
    blockTime: tx.blockTime ?? null,
    feePayer: feePayerAddress,
    signers,
    computeUnitsUsed,
    priorityFee,
    memo,
  };
}

/**
 * Extract token account lifecycle events (create/close)
 */
function extractTokenAccountEvents(
  tx: ParsedTransactionWithMeta,
  signature: string
): TokenAccountEvent[] {
  const events: TokenAccountEvent[] = [];
  
  if (!tx.transaction?.message?.instructions) {
    return events;
  }

  for (const instruction of tx.transaction.message.instructions) {
    if (!instruction || !instruction.programId) continue;
    
    const programId = instruction.programId.toString();
    
    // Check for SPL Token or Associated Token Program instructions
    if (programId === PROGRAM_IDS.TOKEN || programId === PROGRAM_IDS.ASSOCIATED_TOKEN) {
      if ('parsed' in instruction && instruction.parsed) {
        const parsed = instruction.parsed as any;
        
        // InitializeAccount = token account creation
        if (parsed.type === 'initializeAccount' || parsed.type === 'create') {
          const info = parsed.info;
          events.push({
            type: 'create',
            tokenAccount: info.account || info.newAccount,
            owner: info.owner,
            mint: info.mint,
            signature,
            blockTime: tx.blockTime,
          });
        }
        
        // CloseAccount = token account closure (rent refund)
        if (parsed.type === 'closeAccount') {
          const info = parsed.info;
          
          // Calculate rent refund from balance changes
          let rentRefund: number | undefined;
          if (tx.meta?.postBalances && tx.meta?.preBalances) {
            const accountKeys = tx.transaction.message.accountKeys;
            for (let i = 0; i < accountKeys.length; i++) {
              const key = accountKeys[i];
              const address = typeof key === 'string' ? key : key.pubkey.toString();
              if (address === info.destination) {
                const diff = tx.meta.postBalances[i] - tx.meta.preBalances[i];
                if (diff > 0) {
                  rentRefund = diff / 1e9; // Convert lamports to SOL
                }
                break;
              }
            }
          }
          
          events.push({
            type: 'close',
            tokenAccount: info.account,
            owner: info.owner || info.destination,
            signature,
            blockTime: tx.blockTime,
            rentRefund,
          });
        }
      }
    }
  }

  return events;
}

/**
 * Detect if an address is likely a PDA (Program-Derived Address)
 * PDAs have specific characteristics: they're off-curve addresses
 * In practice, we look for accounts owned by programs that appear in multiple txs
 */
function extractPDAInteractions(
  tx: ParsedTransactionWithMeta,
  signature: string
): PDAInteraction[] {
  const interactions: PDAInteraction[] = [];
  
  if (!tx.transaction?.message?.accountKeys) {
    return interactions;
  }

  // Build a map of accounts and which programs interact with them
  const accountProgramMap = new Map<string, Set<string>>();
  
  for (const instruction of tx.transaction.message.instructions) {
    if (!instruction || !instruction.programId) continue;
    
    const programId = instruction.programId.toString();
    
    // Get accounts involved in this instruction
    const accounts: string[] = [];
    if ('accounts' in instruction && Array.isArray(instruction.accounts)) {
      for (const acc of instruction.accounts) {
        const address = typeof acc === 'string' ? acc : acc.toString();
        accounts.push(address);
      }
    }
    
    // Record program-account relationships
    for (const account of accounts) {
      if (!accountProgramMap.has(account)) {
        accountProgramMap.set(account, new Set());
      }
      accountProgramMap.get(account)!.add(programId);
    }
  }

  // Accounts interacted with by non-system programs are likely PDAs or program accounts
  for (const [address, programs] of accountProgramMap) {
    for (const programId of programs) {
      // Skip system program and well-known user-controlled programs
      if (programId === PROGRAM_IDS.SYSTEM || programId === PROGRAM_IDS.MEMO || programId === PROGRAM_IDS.MEMO_V1) {
        continue;
      }
      
      interactions.push({
        pda: address,
        programId,
        signature,
      });
    }
  }

  return interactions;
}

/**
 * Extract SOL transfers from a parsed transaction
 */
function extractSOLTransfers(
  tx: ParsedTransactionWithMeta,
  signature: string
): Transfer[] {
  const transfers: Transfer[] = [];

  if (!tx.meta || !tx.transaction) {
    return transfers;
  }

  const preBalances = tx.meta.preBalances;
  const postBalances = tx.meta.postBalances;
  const accountKeys = tx.transaction.message.accountKeys;

  // Defensive checks
  if (!accountKeys || !Array.isArray(accountKeys) || accountKeys.length === 0) {
    return transfers;
  }

  if (!preBalances || !postBalances) {
    return transfers;
  }

  // Compare pre and post balances to find transfers
  for (let i = 0; i < accountKeys.length; i++) {
    const pre = preBalances[i];
    const post = postBalances[i];
    
    // Skip if balances are undefined
    if (pre === undefined || post === undefined) {
      continue;
    }
    
    const diff = post - pre;

    // Skip if no change or if it's fee-related (usually account 0)
    if (diff === 0) continue;

    const account = accountKeys[i];
    if (!account) continue;
    
    const address = typeof account === 'string' ? account : account.pubkey?.toString();
    if (!address) continue;

    // If balance increased, this account received SOL
    if (diff > 0) {
      // Find who sent it (simple heuristic: first account with decreased balance)
      for (let j = 0; j < accountKeys.length; j++) {
        const preSender = preBalances[j];
        const postSender = postBalances[j];
        
        if (preSender === undefined || postSender === undefined) {
          continue;
        }
        
        if (postSender < preSender) {
          const sender = accountKeys[j];
          if (!sender) continue;
          
          const senderAddress = typeof sender === 'string' ? sender : sender.pubkey?.toString();
          if (!senderAddress) continue;
          
          transfers.push({
            from: senderAddress,
            to: address,
            amount: diff / 1e9, // Convert lamports to SOL
            token: undefined,
            signature,
            blockTime: tx.blockTime,
          });
          break;
        }
      }
    }
  }

  return transfers;
}

/**
 * Extract SPL token transfers from a parsed transaction
 */
function extractSPLTransfers(
  tx: ParsedTransactionWithMeta,
  signature: string
): Transfer[] {
  const transfers: Transfer[] = [];

  if (!tx.meta || !tx.meta.postTokenBalances || !tx.meta.preTokenBalances) {
    return transfers;
  }

  const preTokenBalances = tx.meta.preTokenBalances;
  const postTokenBalances = tx.meta.postTokenBalances;

  // Create a map of account index to token balance changes
  const balanceChanges = new Map<number, { mint: string; change: number; decimals: number }>();

  // Calculate changes
  for (const post of postTokenBalances) {
    const pre = preTokenBalances.find(
      (p) => p.accountIndex === post.accountIndex && p.mint === post.mint
    );

    const preAmount = pre?.uiTokenAmount.uiAmount ?? 0;
    const postAmount = post.uiTokenAmount.uiAmount ?? 0;
    const change = postAmount - preAmount;

    if (change !== 0) {
      balanceChanges.set(post.accountIndex, {
        mint: post.mint,
        change,
        decimals: post.uiTokenAmount.decimals,
      });
    }
  }

  // Match senders and receivers
  const accountKeys = tx.transaction.message.accountKeys;
  
  if (!accountKeys || !Array.isArray(accountKeys)) {
    return transfers;
  }
  
  balanceChanges.forEach((info, accountIndex) => {
    if (accountIndex >= accountKeys.length) {
      return; // Skip if index out of bounds
    }
    
    const account = accountKeys[accountIndex];
    if (!account) return;
    
    const address = typeof account === 'string' ? account : account.pubkey?.toString();
    if (!address) return;

    if (info.change > 0) {
      // This account received tokens - find sender
      balanceChanges.forEach((senderInfo, senderIndex) => {
        if (
          senderInfo.mint === info.mint &&
          senderInfo.change < 0 &&
          senderIndex !== accountIndex &&
          senderIndex < accountKeys.length
        ) {
          const sender = accountKeys[senderIndex];
          if (!sender) return;
          
          const senderAddress = typeof sender === 'string' ? sender : sender.pubkey?.toString();
          if (!senderAddress) return;

          transfers.push({
            from: senderAddress,
            to: address,
            amount: info.change,
            token: info.mint,
            signature,
            blockTime: tx.blockTime,
          });
        }
      });
    }
  });

  return transfers;
}

/**
 * Categorize an instruction based on program ID and instruction type
 */
function categorizeInstruction(
  instruction: ParsedInstruction | PartiallyDecodedInstruction
): InstructionCategory {
  const programId = instruction.programId.toString();

  // System program instructions
  if (programId === PROGRAM_IDS.SYSTEM) {
    if ('parsed' in instruction && instruction.parsed.type) {
      const type = instruction.parsed.type;
      if (type === 'transfer' || type === 'transferWithSeed') {
        return 'transfer';
      }
    }
    return 'transfer';
  }

  // Token program instructions
  if (programId === PROGRAM_IDS.TOKEN || programId === PROGRAM_IDS.ASSOCIATED_TOKEN) {
    if ('parsed' in instruction && instruction.parsed.type) {
      const type = instruction.parsed.type;
      if (type === 'transfer' || type === 'transferChecked') {
        return 'transfer';
      }
      return 'token_operation';
    }
    return 'token_operation';
  }

  // Stake program
  if (programId === PROGRAM_IDS.STAKE) {
    return 'stake';
  }

  // Vote program
  if (programId === PROGRAM_IDS.VOTE) {
    return 'vote';
  }

  // Check for common swap programs (simplified heuristic)
  if (
    programId.includes('Swap') ||
    programId.includes('swap') ||
    programId === 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4' || // Jupiter
    programId === 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc' // Orca Whirlpool
  ) {
    return 'swap';
  }

  // Default to program interaction
  return 'program_interaction';
}

/**
 * Extract normalized instructions from a transaction
 */
function extractInstructions(
  tx: ParsedTransactionWithMeta,
  signature: string
): NormalizedInstruction[] {
  const instructions: NormalizedInstruction[] = [];

  if (!tx.transaction || !tx.transaction.message) {
    return instructions;
  }

  const message = tx.transaction.message;

  // Get account keys for resolving indices (handles both legacy and versioned)
  const accountKeys = getAccountKeys(tx);

  // Try legacy format first: parsed instructions with programId
  const legacyInstructions = message.instructions;
  if (legacyInstructions && Array.isArray(legacyInstructions)) {
    for (const instruction of legacyInstructions) {
      if (!instruction) continue;

      // Handle parsed instructions (have programId directly)
      if (instruction.programId) {
        const programId = instruction.programId.toString();
        const category = categorizeInstruction(instruction);

        let data: Record<string, unknown> | undefined;
        if ('parsed' in instruction) {
          data = instruction.parsed as Record<string, unknown>;
        }

        const accounts: string[] = [];
        if ('accounts' in instruction && Array.isArray(instruction.accounts)) {
          for (const acc of instruction.accounts) {
            const address = typeof acc === 'string' ? acc : acc.toString();
            accounts.push(address);
          }
        }

        instructions.push({
          programId,
          category,
          signature,
          blockTime: tx.blockTime,
          data,
          accounts: accounts.length > 0 ? accounts : undefined,
        });
      }
      // Handle compiled instructions (have programIdIndex)
      else if ('programIdIndex' in instruction && accountKeys.length > 0) {
        const programIdIndex = (instruction as any).programIdIndex;
        if (programIdIndex >= 0 && programIdIndex < accountKeys.length) {
          const programId = accountKeys[programIdIndex];

          const accounts: string[] = [];
          const accountIndices = (instruction as any).accounts || (instruction as any).accountKeyIndexes || [];
          for (const idx of accountIndices) {
            if (idx >= 0 && idx < accountKeys.length) {
              accounts.push(accountKeys[idx]);
            }
          }

          instructions.push({
            programId,
            category: 'program_interaction',
            signature,
            blockTime: tx.blockTime,
            accounts: accounts.length > 0 ? accounts : undefined,
          });
        }
      }
    }
  }

  // Try versioned format: compiledInstructions
  const compiledInstructions = (message as any).compiledInstructions;
  if (compiledInstructions && Array.isArray(compiledInstructions) && accountKeys.length > 0) {
    for (const instruction of compiledInstructions) {
      if (!instruction) continue;

      const programIdIndex = instruction.programIdIndex;
      if (programIdIndex >= 0 && programIdIndex < accountKeys.length) {
        const programId = accountKeys[programIdIndex];

        const accounts: string[] = [];
        const accountIndices = instruction.accountKeyIndexes || [];
        for (const idx of accountIndices) {
          if (idx >= 0 && idx < accountKeys.length) {
            accounts.push(accountKeys[idx]);
          }
        }

        instructions.push({
          programId,
          category: 'program_interaction',
          signature,
          blockTime: tx.blockTime,
          accounts: accounts.length > 0 ? accounts : undefined,
        });
      }
    }
  }

  return instructions;
}

/**
 * Extract unique counterparties from transfers
 */
function extractCounterparties(transfers: Transfer[], targetAddress: string): Set<string> {
  const counterparties = new Set<string>();

  for (const transfer of transfers) {
    // Add the other party in the transfer
    if (transfer.from === targetAddress) {
      counterparties.add(transfer.to);
    } else if (transfer.to === targetAddress) {
      counterparties.add(transfer.from);
    }
  }

  return counterparties;
}

/**
 * Calculate time range from transactions
 */
function calculateTimeRange(transactions: RawTransactionData[]): {
  earliest: number | null;
  latest: number | null;
} {
  let earliest: number | null = null;
  let latest: number | null = null;

  for (const tx of transactions) {
    if (tx.blockTime) {
      if (earliest === null || tx.blockTime < earliest) {
        earliest = tx.blockTime;
      }
      if (latest === null || tx.blockTime > latest) {
        latest = tx.blockTime;
      }
    }
  }

  return { earliest, latest };
}

/**
 * Normalize wallet data into a ScanContext
 */
export function normalizeWalletData(
  rawData: RawWalletData,
  labelProvider?: LabelProvider
): ScanContext {
  const allTransfers: Transfer[] = [];
  const allInstructions: NormalizedInstruction[] = [];
  const allTransactionMetadata: TransactionMetadata[] = [];
  const allTokenAccountEvents: TokenAccountEvent[] = [];
  const allPDAInteractions: PDAInteraction[] = [];

  // Ensure transactions exists and is an array
  const transactions = rawData.transactions || [];

  // Process each transaction
  for (const rawTx of transactions) {
    if (!rawTx.transaction) continue;

    try {
      // Extract transfers
      const solTransfers = extractSOLTransfers(rawTx.transaction, rawTx.signature);
      const splTransfers = extractSPLTransfers(rawTx.transaction, rawTx.signature);
      allTransfers.push(...solTransfers, ...splTransfers);

      // Extract instructions
      const instructions = extractInstructions(rawTx.transaction, rawTx.signature);
      allInstructions.push(...instructions);

      // Extract Solana-specific metadata
      const metadata = extractTransactionMetadata(rawTx.transaction, rawTx.signature);
      allTransactionMetadata.push(metadata);

      // Extract token account events
      const tokenEvents = extractTokenAccountEvents(rawTx.transaction, rawTx.signature);
      allTokenAccountEvents.push(...tokenEvents);

      // Extract PDA interactions
      const pdaInteractions = extractPDAInteractions(rawTx.transaction, rawTx.signature);
      allPDAInteractions.push(...pdaInteractions);
    } catch (error) {
      // Skip problematic transactions but continue processing
      console.warn(`Failed to normalize transaction ${rawTx.signature}:`, error);
      continue;
    }
  }

  // Extract counterparties
  const counterparties = extractCounterparties(allTransfers, rawData.address);

  // Calculate time range
  const timeRange = calculateTimeRange(transactions);

  // Normalize token accounts
  const tokenAccounts = rawData.tokenAccounts.map((ta) => {
    try {
      return {
        mint: ta.account.data.parsed.info.mint,
        address: ta.pubkey.toString(),
        balance: ta.account.data.parsed.info.tokenAmount.uiAmount ?? 0,
      };
    } catch (error) {
      // Skip malformed token accounts
      return null;
    }
  }).filter((ta): ta is NonNullable<typeof ta> => ta !== null);

  // Aggregate Solana-specific data
  const feePayers = new Set<string>();
  const signers = new Set<string>();
  const programs = new Set<string>();

  for (const metadata of allTransactionMetadata) {
    feePayers.add(metadata.feePayer);
    for (const signer of metadata.signers) {
      signers.add(signer);
    }
  }

  for (const instruction of allInstructions) {
    programs.add(instruction.programId);
  }

  // Look up labels for counterparties AND programs
  const allAddressesToLookup = [...counterparties, ...programs];
  const labels = labelProvider
    ? labelProvider.lookupMany(allAddressesToLookup)
    : new Map();

  return {
    target: rawData.address,
    targetType: 'wallet',
    transfers: allTransfers,
    instructions: allInstructions,
    counterparties,
    labels,
    tokenAccounts,
    timeRange,
    transactionCount: transactions.length,
    // Solana-specific fields
    transactions: allTransactionMetadata,
    tokenAccountEvents: allTokenAccountEvents,
    pdaInteractions: allPDAInteractions,
    feePayers,
    signers,
    programs,
  };
}

/**
 * Normalize transaction data into a ScanContext
 */
export function normalizeTransactionData(
  rawData: RawTransactionData,
  labelProvider?: LabelProvider
): ScanContext {
  const allTransfers: Transfer[] = [];
  const allInstructions: NormalizedInstruction[] = [];
  const counterparties = new Set<string>();
  const allTransactionMetadata: TransactionMetadata[] = [];
  const allTokenAccountEvents: TokenAccountEvent[] = [];
  const allPDAInteractions: PDAInteraction[] = [];
  const feePayers = new Set<string>();
  const signers = new Set<string>();
  const programs = new Set<string>();

  if (rawData.transaction) {
    try {
      // Extract transfers
      const solTransfers = extractSOLTransfers(rawData.transaction, rawData.signature);
      const splTransfers = extractSPLTransfers(rawData.transaction, rawData.signature);
      allTransfers.push(...solTransfers, ...splTransfers);

      // Extract instructions
      const instructions = extractInstructions(rawData.transaction, rawData.signature);
      allInstructions.push(...instructions);

      // Extract Solana-specific metadata
      const metadata = extractTransactionMetadata(rawData.transaction, rawData.signature);
      allTransactionMetadata.push(metadata);
      feePayers.add(metadata.feePayer);
      for (const signer of metadata.signers) {
        signers.add(signer);
      }

      // Extract token account events
      const tokenEvents = extractTokenAccountEvents(rawData.transaction, rawData.signature);
      allTokenAccountEvents.push(...tokenEvents);

      // Extract PDA interactions
      const pdaInteractions = extractPDAInteractions(rawData.transaction, rawData.signature);
      allPDAInteractions.push(...pdaInteractions);

      // Extract all unique addresses involved
      const accountKeys = rawData.transaction.transaction.message.accountKeys;
      if (accountKeys && Array.isArray(accountKeys)) {
        for (const key of accountKeys) {
          const address = typeof key === 'string' ? key : key.pubkey.toString();
          counterparties.add(address);
        }
      }

      // Collect programs
      for (const instruction of instructions) {
        programs.add(instruction.programId);
      }
    } catch (error) {
      console.warn(`Failed to normalize transaction ${rawData.signature}:`, error);
    }
  }

  // Lookup labels for both counterparties AND programs
  const allAddressesToLookup = [...counterparties, ...programs];
  const labels = labelProvider
    ? labelProvider.lookupMany(allAddressesToLookup)
    : new Map();

  return {
    target: rawData.signature,
    targetType: 'transaction',
    transfers: allTransfers,
    instructions: allInstructions,
    counterparties,
    labels,
    tokenAccounts: [],
    timeRange: {
      earliest: rawData.transaction ? rawData.blockTime : null,
      latest: rawData.transaction ? rawData.blockTime : null,
    },
    transactionCount: rawData.transaction ? 1 : 0,
    // Solana-specific fields
    transactions: allTransactionMetadata,
    tokenAccountEvents: allTokenAccountEvents,
    pdaInteractions: allPDAInteractions,
    feePayers,
    signers,
    programs,
  };
}

/**
 * Normalize program data into a ScanContext
 */
export function normalizeProgramData(
  rawData: RawProgramData,
  labelProvider?: LabelProvider
): ScanContext {
  const allTransfers: Transfer[] = [];
  const allInstructions: NormalizedInstruction[] = [];
  const counterparties = new Set<string>();
  const allTransactionMetadata: TransactionMetadata[] = [];
  const allTokenAccountEvents: TokenAccountEvent[] = [];
  const allPDAInteractions: PDAInteraction[] = [];
  const feePayers = new Set<string>();
  const signers = new Set<string>();
  const programs = new Set<string>();

  // Ensure relatedTransactions exists and is an array
  const transactions = rawData.relatedTransactions || [];

  // Process related transactions
  for (const rawTx of transactions) {
    if (!rawTx.transaction) continue;

    try {
      // Extract transfers
      const solTransfers = extractSOLTransfers(rawTx.transaction, rawTx.signature);
      const splTransfers = extractSPLTransfers(rawTx.transaction, rawTx.signature);
      allTransfers.push(...solTransfers, ...splTransfers);

      // Extract instructions
      const instructions = extractInstructions(rawTx.transaction, rawTx.signature);
      allInstructions.push(...instructions);

      // Extract Solana-specific metadata
      const metadata = extractTransactionMetadata(rawTx.transaction, rawTx.signature);
      allTransactionMetadata.push(metadata);
      feePayers.add(metadata.feePayer);
      for (const signer of metadata.signers) {
        signers.add(signer);
      }

      // Extract token account events
      const tokenEvents = extractTokenAccountEvents(rawTx.transaction, rawTx.signature);
      allTokenAccountEvents.push(...tokenEvents);

      // Extract PDA interactions
      const pdaInteractions = extractPDAInteractions(rawTx.transaction, rawTx.signature);
      allPDAInteractions.push(...pdaInteractions);

      // Extract counterparties
      const accountKeys = rawTx.transaction.transaction.message.accountKeys;
      if (accountKeys && Array.isArray(accountKeys)) {
        for (const key of accountKeys) {
          const address = typeof key === 'string' ? key : key.pubkey.toString();
          counterparties.add(address);
        }
      }

      // Collect programs
      for (const instruction of instructions) {
        programs.add(instruction.programId);
      }
    } catch (error) {
      console.warn(`Failed to normalize program transaction ${rawTx.signature}:`, error);
      continue;
    }
  }

  // Calculate time range
  const timeRange = calculateTimeRange(transactions);

  // Look up labels for counterparties
  const labels = labelProvider
    ? labelProvider.lookupMany(Array.from(counterparties))
    : new Map();

  return {
    target: rawData.programId,
    targetType: 'program',
    transfers: allTransfers,
    instructions: allInstructions,
    counterparties,
    labels,
    tokenAccounts: [],
    timeRange,
    transactionCount: transactions.length,
    // Solana-specific fields
    transactions: allTransactionMetadata,
    tokenAccountEvents: allTokenAccountEvents,
    pdaInteractions: allPDAInteractions,
    feePayers,
    signers,
    programs,
  };
}
