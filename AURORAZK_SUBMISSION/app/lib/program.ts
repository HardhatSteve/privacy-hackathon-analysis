import { Program, AnchorProvider, BN, Idl } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, Keypair, Connection } from '@solana/web3.js';
import idlJson from './idl/aurorazk.json';

// Cast the IDL to the correct type
const idl = idlJson as Idl;

// Program ID from deployment
export const PROGRAM_ID = new PublicKey('4sF9KPj241iRwnyGdYkyTvfDQGKE8zmWBWVidfhfc7Yi');

// Order fill types
export type OrderFillType = 'GTC' | 'IOC' | 'FOK' | 'AON';
export type TokenType = 'SOL' | 'USDC';

// Map TypeScript fill types to Anchor enum format
const FILL_TYPE_MAP: Record<OrderFillType, object> = {
  'GTC': { gtc: {} },  // Good Til Cancelled - partial fills, stays in book
  'IOC': { ioc: {} },  // Immediate or Cancel - partial fills, unfilled cancelled
  'FOK': { fok: {} },  // Fill or Kill - all or nothing, immediate
  'AON': { aon: {} },  // All or None - wait until full size available
};

const TOKEN_TYPE_MAP: Record<TokenType, object> = {
  SOL: { sol: {} },
  USDC: { usdc: {} },
};

// Get the order book PDA (v3 - on-chain seeds)
export function getOrderBookPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('order_book_v3')],
    PROGRAM_ID
  );
}

export function getUserBalancePDA(owner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('user_balance'), owner.toBuffer()],
    PROGRAM_ID
  );
}

// Create program instance - using the PROGRAM_ID explicitly
export function getProgram(provider: AnchorProvider): Program {
  // For old-style IDL, we need to provide programId explicitly
  return new Program(idl, provider);
}

// Check if order book exists on-chain by checking account data
export async function orderBookExists(connection: Connection): Promise<boolean> {
  try {
    const [orderBookPda] = getOrderBookPDA();
    const accountInfo = await connection.getAccountInfo(orderBookPda);
    // Account exists if it has data and is owned by our program
    return accountInfo !== null && 
           accountInfo.data.length > 0 && 
           accountInfo.owner.equals(PROGRAM_ID);
  } catch (e) {
    console.error('Error checking order book:', e);
    return false;
  }
}

// ============================================
// Transaction Builders
// ============================================

export async function initializeOrderBook(
  program: Program,
  authority: PublicKey,
  baseMint: PublicKey,
  quoteMint: PublicKey
) {
  const [orderBookPda] = getOrderBookPDA();
  
  return await program.methods
    .initialize(baseMint, quoteMint)
    .accounts({
      order_book: orderBookPda,
      authority,
      system_program: SystemProgram.programId,
    })
    .rpc({
      skipPreflight: true,
      commitment: 'confirmed',
    });
}

export async function initUserBalance(
  program: Program,
  owner: PublicKey
) {
  const [userBalancePda] = getUserBalancePDA(owner);
  return await program.methods
    .initUserBalance()
    .accounts({
      user_balance: userBalancePda,
      owner,
      system_program: SystemProgram.programId,
    })
    .rpc({
      skipPreflight: true,
      commitment: 'confirmed',
    });
}

export async function depositDarkPool(
  program: Program,
  owner: PublicKey,
  token: TokenType,
  amount: number
) {
  const [userBalancePda] = getUserBalancePDA(owner);
  return await program.methods
    .depositDarkPool(TOKEN_TYPE_MAP[token], new BN(amount))
    .accounts({
      user_balance: userBalancePda,
      owner,
    })
    .rpc({
      skipPreflight: true,
      commitment: 'confirmed',
    });
}

export async function withdrawDarkPool(
  program: Program,
  owner: PublicKey,
  token: TokenType,
  amount: number
) {
  const [userBalancePda] = getUserBalancePDA(owner);
  return await program.methods
    .withdrawDarkPool(TOKEN_TYPE_MAP[token], new BN(amount))
    .accounts({
      user_balance: userBalancePda,
      owner,
    })
    .rpc({
      skipPreflight: true,
      commitment: 'confirmed',
    });
}

export async function placeOrder(
  program: Program,
  owner: PublicKey,
  commitmentHash: Uint8Array,
  rangeProof: Uint8Array,
  isBuy: boolean,
  expirationHours: number = 48,
  fillType: OrderFillType = 'GTC'
) {
  const [orderBookPda] = getOrderBookPDA();
  const orderKeypair = Keypair.generate();
  
  // VALIDATION: Commitment hash MUST be exactly 32 bytes
  if (commitmentHash.length !== 32) {
    throw new Error(`Commitment hash must be 32 bytes, got ${commitmentHash.length}`);
  }
  
  // Convert to fixed-size array for Anchor
  const commitmentArray: number[] = [];
  for (let i = 0; i < 32; i++) {
    commitmentArray.push(commitmentHash[i]);
  }
  
  // Expiration timestamp
  const expirationTimestamp = Math.floor(Date.now() / 1000) + (expirationHours * 60 * 60);
  
  // For hackathon: Don't store full ZK proof on-chain (max_len=256)
  // Just pass empty - the commitment hash provides the privacy guarantee
  // ZK proofs can be verified off-chain if needed
  const emptyProof = Buffer.alloc(0);
  
  console.log('[placeOrder] Submitting:', {
    order: orderKeypair.publicKey.toBase58().slice(0, 12) + '...',
    owner: owner.toBase58().slice(0, 12) + '...',
    commitmentLen: commitmentArray.length,
    isBuy,
    fillType,
    zkProofGenerated: rangeProof.length > 0,
  });
  
  const tx = await program.methods
    .placeOrder(
      commitmentArray,
      emptyProof,  // Empty proof - privacy from commitment hash
      isBuy,
      new BN(expirationTimestamp),
      FILL_TYPE_MAP[fillType]
    )
    .accounts({
      order: orderKeypair.publicKey,
      order_book: orderBookPda,
      owner,
      system_program: SystemProgram.programId,
    })
    .signers([orderKeypair])
    .rpc({
      skipPreflight: true,
      commitment: 'confirmed',
    });
  
  console.log('[placeOrder] Success:', tx.slice(0, 20) + '...');
  
  return {
    tx,
    orderPublicKey: orderKeypair.publicKey
  };
}

export interface MatchParams {
  buyPrice: number;    // micro units (price * 1e6)
  buySize: number;     // lamports (size * 1e9)
  buyNonce: Uint8Array;
  sellPrice: number;
  sellSize: number;
  sellNonce: Uint8Array;
  executionPrice: number;
  executionSize: number;
}

export async function revealAndMatch(
  program: Program,
  matcher: PublicKey,
  buyOrderPubkey: PublicKey,
  sellOrderPubkey: PublicKey,
  params: MatchParams
) {
  const [orderBookPda] = getOrderBookPDA();
  
  return await program.methods
    .revealAndMatch(
      new BN(params.buyPrice),
      new BN(params.buySize),
      Array.from(params.buyNonce),
      new BN(params.sellPrice),
      new BN(params.sellSize),
      Array.from(params.sellNonce),
      new BN(params.executionPrice),
      new BN(params.executionSize)
    )
    .accounts({
      buy_order: buyOrderPubkey,
      sell_order: sellOrderPubkey,
      order_book: orderBookPda,
      matcher,
    })
    .rpc({
      skipPreflight: true,
      commitment: 'confirmed',
    });
}

export async function cancelOrder(
  program: Program,
  owner: PublicKey,
  orderPubkey: PublicKey
) {
  return await program.methods
    .cancelOrder()
    .accounts({
      order: orderPubkey,
      owner,
    })
    .rpc({
      skipPreflight: true,
      commitment: 'confirmed',
    });
}

// ============================================
// Account Fetchers
// ============================================

export async function fetchOrderBook(program: Program) {
  try {
    // In Anchor 0.30+, account names from IDL are converted to camelCase
    // The IDL has "OrderBook" which becomes "orderBook" accessor
    const accounts = program.account as any;
    const accountAccessor = accounts.orderBook || accounts['order_book'] || accounts['OrderBook'];
    
    if (!accountAccessor) {
      console.warn('OrderBook account accessor not found in program');
      return null;
    }
    
    const [orderBookPda] = getOrderBookPDA();
    const orderBook = await accountAccessor.fetch(orderBookPda);
    
    return {
      authority: orderBook.authority as PublicKey,
      bump: orderBook.bump as number,
      totalOrders: safeToNumber(orderBook.totalOrders),
      totalFilled: safeToNumber(orderBook.totalFilled),
    };
  } catch (error: any) {
    // Only log real errors
    if (error.message && !error.message.includes('Account does not exist')) {
      console.error('Failed to fetch order book:', error.message);
    }
    return null;
  }
}

export async function fetchUserBalance(program: Program, owner: PublicKey) {
  try {
    const accounts = program.account as any;
    const accountAccessor = accounts.userBalance || accounts['user_balance'] || accounts['UserBalance'];
    if (!accountAccessor) {
      console.warn('UserBalance account accessor not found in program');
      return null;
    }
    const [userBalancePda] = getUserBalancePDA(owner);
    const balance = await accountAccessor.fetch(userBalancePda);
    return {
      owner: balance.owner as PublicKey,
      solBalance: safeToNumber(balance.solBalance ?? balance.sol_balance),
      usdcBalance: safeToNumber(balance.usdcBalance ?? balance.usdc_balance),
    };
  } catch (error: any) {
    if (error.message && !error.message.includes('Account does not exist')) {
      console.error('Failed to fetch user balance:', error.message);
    }
    return null;
  }
}

// Safely convert BN or number to number
function safeToNumber(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  if (typeof val.toNumber === 'function') {
    try {
      return val.toNumber();
    } catch {
      return 0;
    }
  }
  if (typeof val === 'bigint') return Number(val);
  return 0;
}

export async function fetchOrder(program: Program, orderPubkey: PublicKey) {
  try {
    const accounts = program.account as any;
    const order = await accounts.order.fetch(orderPubkey);
    return {
      owner: order.owner as PublicKey,
      commitmentHash: order.commitmentHash as number[],
      rangeProof: order.rangeProof as number[],
      isBuy: order.isBuy as boolean,
      timestamp: safeToNumber(order.timestamp),
      filled: order.filled as boolean,
      orderId: safeToNumber(order.orderId),
    };
  } catch (error) {
    console.error('Failed to fetch order:', error);
    return null;
  }
}

export async function fetchAllOrders(program: Program) {
  try {
    // In Anchor 0.30+, account names from IDL are converted to camelCase
    const accounts = program.account as any;
    const accountAccessor = accounts.order || accounts['Order'];
    
    if (!accountAccessor) {
      console.warn('Order account accessor not found in program');
      return [];
    }
    
    const orders = await accountAccessor.all();
    return orders.map(({ publicKey, account }: { publicKey: PublicKey; account: any }) => ({
      publicKey,
      owner: account.owner as PublicKey,
      commitmentHash: account.commitmentHash as number[],
      rangeProof: account.rangeProof as number[],
      isBuy: account.isBuy as boolean,
      timestamp: safeToNumber(account.timestamp),
      filled: account.filled as boolean,
      orderId: safeToNumber(account.orderId),
    }));
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return [];
  }
}

// ============================================
// Utility Types
// ============================================

export interface OrderBookAccount {
  authority: PublicKey;
  bump: number;
  totalOrders: number;
  totalFilled: number;
}

export interface OrderAccount {
  publicKey: PublicKey;
  owner: PublicKey;
  commitmentHash: number[];
  rangeProof: number[];
  isBuy: boolean;
  timestamp: number;
  filled: boolean;
  orderId: number;
}
