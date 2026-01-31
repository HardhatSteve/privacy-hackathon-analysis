'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { TOKENS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { 
  ArrowDown, 
  Loader2, 
  Shield, 
  X, 
  AlertCircle, 
  RefreshCw,
  Wallet,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnchorProvider } from '@coral-xyz/anchor';
import { VAULT_ADDRESS } from '@/lib/darkpool';
import { getProgram, initUserBalance, depositDarkPool, fetchUserBalance } from '@/lib/program';
import { shieldedDeposit, isLightReady, initLightProtocol } from '@/lib/light-compression';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { SolanaLogo, UsdcLogo } from './TokenLogos';

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TokenType = 'SOL' | 'USDC';
type DepositMode = 'shielded' | 'standard';

export function DepositModal({ open, onOpenChange }: DepositModalProps) {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  
  const [selectedToken, setSelectedToken] = useState<TokenType>('SOL');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Shielded deposit mode
  const [depositMode, setDepositMode] = useState<DepositMode>('shielded');
  const [lightReady, setLightReady] = useState(false);
  
  // Wallet balances
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  
  // Initialize Light Protocol
  useEffect(() => {
    const init = async () => {
      await initLightProtocol();
      setLightReady(isLightReady());
    };
    if (open) init();
  }, [open]);

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    if (!publicKey || !connection) return;
    
    setLoadingBalances(true);
    try {
      // Fetch SOL balance
      const solBal = await connection.getBalance(publicKey);
      setSolBalance(solBal / LAMPORTS_PER_SOL);
      
      // Fetch USDC balance
      try {
        const usdcMint = TOKENS.USDC.mint;
        if (usdcMint) {
          const ata = await getAssociatedTokenAddress(usdcMint, publicKey);
          const account = await getAccount(connection, ata);
          setUsdcBalance(Number(account.amount) / Math.pow(10, TOKENS.USDC.decimals));
        }
      } catch {
        // Token account doesn't exist - user has 0 USDC
        setUsdcBalance(0);
      }
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    } finally {
      setLoadingBalances(false);
    }
  }, [publicKey, connection]);

  // Fetch balances when modal opens
  useEffect(() => {
    if (open && publicKey) {
      fetchBalances();
    }
  }, [open, publicKey, fetchBalances]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setAmount('');
      setError(null);
      setSuccess(null);
    }
  }, [open]);

  const currentBalance = selectedToken === 'SOL' ? solBalance : usdcBalance;
  const tokenDecimals = selectedToken === 'SOL' ? TOKENS.SOL.decimals : TOKENS.USDC.decimals;

  const handleDeposit = async () => {
    if (!publicKey || !signTransaction || !connection) {
      setError('Please connect your wallet first');
      return;
    }
    
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (currentBalance !== null && depositAmount > currentBalance) {
      setError(`Insufficient ${selectedToken} balance`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const lamports = Math.floor(depositAmount * LAMPORTS_PER_SOL);
      const tokenAmount = Math.floor(depositAmount * Math.pow(10, TOKENS.USDC.decimals));
      const amountInSmallestUnits = selectedToken === 'SOL' ? lamports : tokenAmount;
      
      let signature: string;
      let isCompressed = false;
      
      // SHIELDED MODE: Use shieldedDeposit which handles the transfer
      if (depositMode === 'shielded') {
        console.log('[Deposit] Using shielded deposit mode');
        const shieldResult = await shieldedDeposit(
          publicKey,
          amountInSmallestUnits,
          signTransaction
        );
        
        if (!shieldResult.success) {
          throw new Error(shieldResult.error || 'Shielded deposit failed');
        }
        
        signature = shieldResult.txSignature!;
        isCompressed = shieldResult.compressed;
        
        console.log(`[Deposit] Shielded deposit complete (compressed: ${isCompressed})`);
        console.log('[Deposit] Commitment:', shieldResult.commitment?.slice(0, 16) + '...');
        
        // Store shielded deposit info
        const depositData = {
          commitment: shieldResult.commitment,
          amount: depositAmount,
          token: selectedToken,
          timestamp: Date.now(),
          isShielded: true,
          isCompressed,
          owner: publicKey.toBase58(),
          txSignature: signature,
        };
        const deposits = JSON.parse(localStorage.getItem('aurora_shielded_deposits') || '[]');
        deposits.push(depositData);
        localStorage.setItem('aurora_shielded_deposits', JSON.stringify(deposits));
        
      } else {
        // STANDARD MODE: Do visible transfer to vault
        console.log('[Deposit] Using standard deposit mode');
        const transaction = new Transaction();
        
        if (selectedToken === 'SOL') {
          // SOL transfer
          transaction.add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: VAULT_ADDRESS,
              lamports,
            })
          );
        } else {
          // USDC transfer
          const usdcMint = TOKENS.USDC.mint;
          if (!usdcMint) {
            throw new Error('USDC mint not configured');
          }
          
          const fromAta = await getAssociatedTokenAddress(usdcMint, publicKey);
          const toAta = await getAssociatedTokenAddress(usdcMint, VAULT_ADDRESS);
          
          // Check if vault's ATA exists, create if not
          try {
            await getAccount(connection, toAta);
          } catch {
            // Create ATA for vault
            transaction.add(
              createAssociatedTokenAccountInstruction(
                publicKey, // payer
                toAta,
                VAULT_ADDRESS,
                usdcMint
              )
            );
          }
          
          transaction.add(
            createTransferInstruction(
              fromAta,
              toAta,
              publicKey,
              tokenAmount,
              [],
              TOKEN_PROGRAM_ID
            )
          );
        }

        // Get latest blockhash
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        // Sign and send
        const signed = await signTransaction(transaction);
        
        try {
          signature = await connection.sendRawTransaction(signed.serialize(), {
            skipPreflight: true,
            preflightCommitment: 'confirmed',
          });
        } catch (sendErr: any) {
          if (sendErr.message?.includes('already been processed')) {
            setError('Transaction may have already been processed. Please check your wallet and refresh.');
            await fetchBalances();
            return;
          }
          throw sendErr;
        }
        
        // Wait for confirmation
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        }, 'confirmed');
        
        if (confirmation.value.err) {
          throw new Error('Transaction failed on-chain');
        }
      }
      
      // Update on-chain dark pool ledger AFTER successful transfer
      const wallet = {
        publicKey,
        signTransaction,
        signAllTransactions: signAllTransactions || (async (txs: any[]) => txs),
      };
      const provider = new AnchorProvider(connection, wallet as any, {
        commitment: 'confirmed',
      });
      const program = getProgram(provider);
      const existing = await fetchUserBalance(program, publicKey);
      if (!existing) {
        try {
          await initUserBalance(program, publicKey);
        } catch (initErr: any) {
          if (!initErr.message?.includes('already in use')) {
            throw initErr;
          }
        }
      }
      await depositDarkPool(program, publicKey, selectedToken, amountInSmallestUnits);
      
      setSuccess(signature);
      setAmount('');
      
      // Refresh balances
      await fetchBalances();
      window.dispatchEvent(new CustomEvent('aurorazk_balance_update'));
      
    } catch (err: any) {
      console.error('Deposit failed:', err);
      
      const errorMsg = err.message || err.toString();
      
      if (errorMsg.includes('User rejected')) {
        setError('Transaction cancelled by user');
      } else if (errorMsg.includes('insufficient') || errorMsg.includes('0x1')) {
        setError('Insufficient funds for transaction');
      } else if (errorMsg.includes('already been processed')) {
        setError('This transaction was already processed. Refresh and try again.');
      } else if (errorMsg.includes('blockhash not found')) {
        setError('Transaction expired. Please try again.');
      } else {
        setError(errorMsg.length > 100 ? errorMsg.substring(0, 100) + '...' : errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const setMaxAmount = () => {
    if (currentBalance !== null) {
      // Leave some SOL for fees
      const max = selectedToken === 'SOL' 
        ? Math.max(0, currentBalance - 0.01) 
        : currentBalance;
      setAmount(max.toFixed(selectedToken === 'SOL' ? 4 : 2));
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 p-6">
            {/* Header - Brutalist */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
              <Dialog.Title className="text-lg font-bold text-white flex items-center gap-3 uppercase tracking-wide">
                <Shield className="w-5 h-5 text-emerald-400" />
                Deposit
              </Dialog.Title>
              <Dialog.Close className="text-zinc-600 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>

            {/* Wallet Balance Card - Brutalist */}
            <div className="bg-zinc-900 border border-zinc-800 p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Wallet Balance</p>
                <button
                  onClick={fetchBalances}
                  disabled={loadingBalances}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", loadingBalances && "animate-spin")} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950 border border-zinc-800 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <SolanaLogo className="w-5 h-4" />
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">SOL</span>
                  </div>
                  <p className="text-xl font-mono font-bold text-white">
                    {loadingBalances ? '...' : solBalance?.toFixed(4) ?? '0.0000'}
                  </p>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <UsdcLogo className="w-5 h-5" />
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">USDC</span>
                  </div>
                  <p className="text-xl font-mono font-bold text-white">
                    {loadingBalances ? '...' : usdcBalance?.toFixed(2) ?? '0.00'}
                  </p>
                </div>
              </div>
            </div>

            {/* Deposit Mode Toggle - Brutalist */}
            <div className="mb-4">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">Privacy Mode</p>
              <div className="grid grid-cols-2 gap-px bg-zinc-800">
                <button
                  onClick={() => setDepositMode('shielded')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 transition-all",
                    depositMode === 'shielded'
                      ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500"
                      : "bg-zinc-900 text-zinc-500 hover:text-white border-l-2 border-transparent"
                  )}
                >
                  <Shield className="w-5 h-5" />
                  <span className="text-xs font-medium uppercase tracking-wider">Shielded</span>
                  <span className="text-[10px] opacity-70">
                    {lightReady ? 'ZK Compressed' : 'Loading...'}
                  </span>
                </button>
                <button
                  onClick={() => setDepositMode('standard')}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 transition-all",
                    depositMode === 'standard'
                      ? "bg-zinc-800 text-zinc-300 border-l-2 border-zinc-500"
                      : "bg-zinc-900 text-zinc-500 hover:text-white border-l-2 border-transparent"
                  )}
                >
                  <Eye className="w-5 h-5" />
                  <span className="text-xs font-medium uppercase tracking-wider">Standard</span>
                  <span className="text-[10px] opacity-70">Visible on-chain</span>
                </button>
              </div>
            </div>
            
            {/* Privacy Notice - Brutalist */}
            {depositMode === 'shielded' ? (
              <div className="mb-4 p-3 bg-emerald-500/5 border-l-2 border-emerald-500">
                <div className="flex items-start gap-3">
                  <Lock className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-emerald-400 font-medium text-xs uppercase tracking-wider">ZK Shielded</p>
                    <p className="text-zinc-500 text-xs mt-1">
                      Amount hidden via Light Protocol. Withdraw to any address without linking.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-amber-500/5 border-l-2 border-amber-500">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-amber-400 font-medium text-xs uppercase tracking-wider">Public</p>
                    <p className="text-zinc-500 text-xs mt-1">
                      Amount and wallet address visible on-chain to all observers.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Token Selector - Brutalist */}
            <div className="grid grid-cols-2 gap-px bg-zinc-800 mb-4">
              <button
                onClick={() => {
                  setSelectedToken('SOL');
                  setAmount('');
                  setError(null);
                }}
                className={cn(
                  "flex items-center justify-center gap-3 py-3 font-medium transition-all",
                  selectedToken === 'SOL'
                    ? "bg-violet-500/20 text-white border-b-2 border-violet-500" 
                    : "bg-zinc-900 text-zinc-500 hover:text-white border-b-2 border-transparent"
                )}
              >
                <SolanaLogo className="w-5 h-4" />
                <span className="text-sm uppercase tracking-wider">SOL</span>
              </button>
              <button
                onClick={() => {
                  setSelectedToken('USDC');
                  setAmount('');
                  setError(null);
                }}
                className={cn(
                  "flex items-center justify-center gap-3 py-3 font-medium transition-all",
                  selectedToken === 'USDC'
                    ? "bg-[#2775CA]/20 text-white border-b-2 border-[#2775CA]" 
                    : "bg-zinc-900 text-zinc-500 hover:text-white border-b-2 border-transparent"
                )}
              >
                <UsdcLogo className="w-5 h-5" />
                <span className="text-sm uppercase tracking-wider">USDC</span>
              </button>
            </div>

            {/* Amount Input - Brutalist */}
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError(null);
                  }}
                  placeholder="0.00"
                  className={cn(
                    "w-full bg-zinc-900 border border-zinc-800 px-4 py-4 pr-28",
                    "text-2xl font-mono text-white placeholder:text-zinc-600",
                    "focus:outline-none focus:border-emerald-500/50",
                    "transition-all"
                  )}
                  disabled={loading}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
                  <button
                    onClick={setMaxAmount}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium uppercase tracking-wider"
                    disabled={loading}
                  >
                    MAX
                  </button>
                  <span className="text-zinc-500 text-sm uppercase tracking-wider">{selectedToken}</span>
                </div>
              </div>

              {/* Quick Amount Buttons - Brutalist */}
              <div className="grid grid-cols-4 gap-px bg-zinc-800">
                {(selectedToken === 'SOL' ? [0.1, 0.5, 1, 2] : [10, 50, 100, 500]).map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmount(val.toString())}
                    className="py-2.5 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-white transition-colors uppercase tracking-wider"
                    disabled={loading}
                  >
                    {val} {selectedToken}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message - Brutalist */}
            {error && (
              <div className="mt-4 p-3 bg-red-500/5 border-l-2 border-red-500 flex items-center gap-3 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Success Message - Brutalist */}
            {success && (
              <div className="mt-4 p-3 bg-emerald-500/5 border-l-2 border-emerald-500">
                <div className="flex items-center gap-2 text-emerald-400 text-xs uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4" />
                  {depositMode === 'shielded' ? 'Shielded deposit complete' : 'Deposit complete'}
                </div>
                {depositMode === 'shielded' && (
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Compressed via Light Protocol. Withdraw to any address.
                  </p>
                )}
                <a
                  href={`https://solscan.io/tx/${success}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-emerald-500 hover:text-emerald-400 mt-2 uppercase tracking-wider"
                >
                  View on Solscan
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Action Button - Brutalist */}
            <button
              onClick={handleDeposit}
              disabled={loading || !publicKey || !amount || parseFloat(amount) <= 0}
              className={cn(
                "w-full mt-6 py-4 px-6 font-medium text-sm uppercase tracking-widest",
                "bg-emerald-500 text-zinc-950",
                "hover:bg-emerald-400",
                "disabled:bg-zinc-800 disabled:text-zinc-600",
                "transition-all duration-200",
                "flex items-center justify-center gap-3"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : !publicKey ? (
                'Connect Wallet'
              ) : (
                <>
                  <ArrowDown className="w-4 h-4" />
                  Deposit {selectedToken}
                </>
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
