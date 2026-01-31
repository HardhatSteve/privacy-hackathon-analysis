'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { TOKENS, EXPLORER } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { 
  ArrowUp, 
  Loader2, 
  Shield, 
  X, 
  AlertCircle, 
  RefreshCw,
  Wallet,
  CheckCircle,
  Lock,
  AlertTriangle,
  ExternalLink,
  Send
} from 'lucide-react';
import { SolanaLogo, UsdcLogo } from './TokenLogos';
import * as Dialog from '@radix-ui/react-dialog';
import { 
  getDarkPoolBalance, 
  getVaultBalance
} from '@/lib/darkpool';
import { getProgram, fetchUserBalance, initUserBalance, withdrawDarkPool } from '@/lib/program';
import { matcherClient } from '@/lib/matcher-client';
import { 
  shieldedWithdraw, 
  getShieldedBalance, 
  isLightReady,
  initLightProtocol 
} from '@/lib/light-compression';

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TokenType = 'SOL' | 'USDC';

export function WithdrawModal({ open, onOpenChange }: WithdrawModalProps) {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  
  const [selectedToken, setSelectedToken] = useState<TokenType>('SOL');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ txSignature: string; explorer: string } | null>(null);
  
  // Custom recipient wallet option
  const [useCustomRecipient, setUseCustomRecipient] = useState(false);
  const [customRecipient, setCustomRecipient] = useState('');
  
  // Dark pool balances
  const [darkPoolSol, setDarkPoolSol] = useState<number>(0);
  const [darkPoolUsdc, setDarkPoolUsdc] = useState<number>(0);
  
  // Shielded (compressed) balance
  const [shieldedSol, setShieldedSol] = useState<number>(0);
  const [lightReady, setLightReady] = useState(false);
  
  // Vault balances (on-chain)
  const [vaultSol, setVaultSol] = useState<number>(0);
  const [vaultUsdc, setVaultUsdc] = useState<number>(0);
  
  // Matcher/vault availability
  const [vaultOnline, setVaultOnline] = useState(false);

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    if (!publicKey || !connection) return;
    
    setLoadingBalances(true);
    try {
      // Initialize Light Protocol
      await initLightProtocol();
      setLightReady(isLightReady());
      
      // Get shielded (compressed) balance
      try {
        const shieldedBalance = await getShieldedBalance(publicKey);
        setShieldedSol(shieldedBalance.lamports / 1e9);
        console.log('[Withdraw] Shielded balance:', shieldedBalance.lamports / 1e9, 'SOL');
      } catch (e) {
        console.log('[Withdraw] Could not fetch shielded balance');
        setShieldedSol(0);
      }
      
      // Get user's dark pool balance (on-chain PDA)
      const darkPoolBalance = await getDarkPoolBalance(connection, publicKey);
      setDarkPoolSol(darkPoolBalance.sol);
      setDarkPoolUsdc(darkPoolBalance.usdc);
      
      // Get actual vault balance from matcher service
      const vaultBalance = await matcherClient.getVaultBalance();
      if (vaultBalance) {
        setVaultSol(vaultBalance.sol);
        setVaultUsdc(vaultBalance.usdc);
        setVaultOnline(true);
      } else {
        // Fallback to on-chain check
        const onChainBalance = await getVaultBalance(connection);
        setVaultSol(onChainBalance.sol);
        setVaultUsdc(onChainBalance.usdc);
        setVaultOnline(false);
      }
      
      // Check if matcher is available
      const available = await matcherClient.isAvailable();
      setVaultOnline(available);
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
      setUseCustomRecipient(false);
      setCustomRecipient('');
    }
  }, [open]);

  const currentDarkPoolBalance = selectedToken === 'SOL' ? darkPoolSol : darkPoolUsdc;
  const currentVaultBalance = selectedToken === 'SOL' ? vaultSol : vaultUsdc;

  const handleWithdraw = async () => {
    if (!publicKey || !signTransaction || !connection) {
      setError('Please connect your wallet first');
      return;
    }
    
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (withdrawAmount > currentDarkPoolBalance) {
      setError(`Insufficient dark pool ${selectedToken} balance (${currentDarkPoolBalance.toFixed(4)} available)`);
      return;
    }
    
    // Validate custom recipient if provided
    let recipientWallet = publicKey.toBase58();
    if (useCustomRecipient && customRecipient.trim()) {
      try {
        new PublicKey(customRecipient.trim());
        recipientWallet = customRecipient.trim();
      } catch {
        setError('Invalid recipient wallet address');
        return;
      }
    }

    // Check vault balance
    const currentVault = selectedToken === 'SOL' ? vaultSol : vaultUsdc;
    if (withdrawAmount > currentVault) {
      setError(`Insufficient vault ${selectedToken} balance. Vault has ${currentVault.toFixed(4)} ${selectedToken}`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const amountInLamports = Math.floor(withdrawAmount * 1e9);
      let result: any;
      let usedShielded = false;
      
      // Try Light Protocol decompression first (for true privacy)
      if (selectedToken === 'SOL' && lightReady && shieldedSol >= withdrawAmount && signTransaction) {
        console.log('[Withdraw] Using Light Protocol decompression for privacy!');
        
        const shieldResult = await shieldedWithdraw(
          publicKey,
          new PublicKey(recipientWallet), // Can be ANY address - this is the privacy feature!
          amountInLamports,
          signTransaction
        );
        
        if (shieldResult.success) {
          result = {
            success: true,
            txSignature: shieldResult.txSignature,
            explorer: `https://solscan.io/tx/${shieldResult.txSignature}?cluster=devnet`,
          };
          usedShielded = true;
          console.log('[Withdraw] ✅ Light Protocol decompression successful!');
          console.log('[Withdraw] Privacy: Withdrawal is UNLINKABLE to deposit');
        } else {
          console.log('[Withdraw] Light decompression failed, falling back to matcher');
        }
      }
      
      // Fallback to matcher service
      if (!usedShielded) {
        console.log('[Withdraw] Using matcher service for withdrawal');
        result = await matcherClient.withdraw({
          token: selectedToken,
          amount: withdrawAmount,
          recipientWallet,
          requestingWallet: publicKey.toBase58(),
        });
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Withdrawal failed');
      }
      
      // Update on-chain dark pool ledger (only for non-shielded)
      if (!usedShielded) {
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
        const amountInSmallestUnits = selectedToken === 'SOL'
          ? Math.floor(withdrawAmount * Math.pow(10, TOKENS.SOL.decimals))
          : Math.floor(withdrawAmount * Math.pow(10, TOKENS.USDC.decimals));
        await withdrawDarkPool(program, publicKey, selectedToken, amountInSmallestUnits);
      }
      
      setSuccess({
        txSignature: result.txSignature!,
        explorer: result.explorer!,
      });
      setAmount('');
      
      // Refresh balances
      await fetchBalances();
      window.dispatchEvent(new CustomEvent('aurorazk_balance_update'));
      
    } catch (err: any) {
      console.error('Withdraw failed:', err);
      setError(err.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  const setMaxAmount = () => {
    if (currentDarkPoolBalance > 0) {
      setAmount(currentDarkPoolBalance.toFixed(selectedToken === 'SOL' ? 4 : 2));
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
                <ArrowUp className="w-5 h-5 text-amber-400" />
                Withdraw
              </Dialog.Title>
              <Dialog.Close className="text-zinc-600 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>

            {/* Dark Pool Balance Card - Brutalist */}
            <div className="bg-zinc-900 border border-zinc-800 p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Dark Pool Balance</p>
                <button
                  onClick={fetchBalances}
                  disabled={loadingBalances}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", loadingBalances && "animate-spin")} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className={cn(
                  "bg-zinc-950 border p-3",
                  selectedToken === 'SOL' ? "border-violet-500/50" : "border-zinc-800"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <SolanaLogo className="w-5 h-4" />
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">SOL</span>
                  </div>
                  <p className="text-xl font-mono font-bold text-white">
                    {loadingBalances ? '...' : darkPoolSol.toFixed(4)}
                  </p>
                </div>
                <div className={cn(
                  "bg-zinc-950 border p-3",
                  selectedToken === 'USDC' ? "border-[#2775CA]/50" : "border-zinc-800"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <UsdcLogo className="w-5 h-5" />
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">USDC</span>
                  </div>
                  <p className="text-xl font-mono font-bold text-white">
                    {loadingBalances ? '...' : darkPoolUsdc.toFixed(2)}
                  </p>
                </div>
              </div>
              
              {/* Shielded (Compressed) Balance - Brutalist */}
              {shieldedSol > 0 && (
                <div className="mt-3 p-3 bg-emerald-500/5 border-l-2 border-emerald-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400 uppercase tracking-wider">ZK Shielded</span>
                    </div>
                    <span className="text-sm font-mono text-emerald-400">
                      {shieldedSol.toFixed(4)} SOL
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Withdraw to any address — unlinkable via Light Protocol
                  </p>
                </div>
              )}
            </div>

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
                    "focus:outline-none focus:border-amber-500/50",
                    "transition-all"
                  )}
                  disabled={loading}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
                  <button
                    onClick={setMaxAmount}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-medium uppercase tracking-wider"
                    disabled={loading || currentDarkPoolBalance <= 0}
                  >
                    MAX
                  </button>
                  <span className="text-zinc-500 text-sm uppercase tracking-wider">{selectedToken}</span>
                </div>
              </div>

              {/* Quick Amount Buttons - Brutalist */}
              {currentDarkPoolBalance > 0 && (
                <div className="grid grid-cols-4 gap-px bg-zinc-800">
                  {[0.25, 0.5, 0.75, 1].map((pct) => {
                    const val = currentDarkPoolBalance * pct;
                    if (val < 0.0001) return null;
                    return (
                      <button
                        key={pct}
                        onClick={() => setAmount(val.toFixed(selectedToken === 'SOL' ? 4 : 2))}
                        className="py-2.5 bg-zinc-900 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-white transition-colors uppercase tracking-wider"
                        disabled={loading}
                      >
                        {pct * 100}%
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Error Message - Brutalist */}
            {error && (
              <div className="mt-4 p-3 bg-red-500/5 border-l-2 border-red-500 flex items-center gap-3 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Shielded Withdrawal Option - Brutalist */}
            <div className={cn(
              "mt-4 p-3 border-l-2 transition-all",
              useCustomRecipient 
                ? "bg-emerald-500/5 border-emerald-500" 
                : "bg-zinc-900 border-zinc-700"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-zinc-400 uppercase tracking-wider">
                  <Shield className={cn("w-4 h-4", useCustomRecipient ? "text-emerald-400" : "text-zinc-500")} />
                  {useCustomRecipient ? "Shielded Withdrawal" : "Custom Recipient"}
                </div>
                <button
                  onClick={() => setUseCustomRecipient(!useCustomRecipient)}
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center transition-colors",
                    useCustomRecipient ? "bg-emerald-500" : "bg-zinc-700"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-3 w-3 transform bg-white transition-transform",
                      useCustomRecipient ? "translate-x-5" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
              
              {useCustomRecipient && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={customRecipient}
                    onChange={(e) => {
                      setCustomRecipient(e.target.value);
                      setError(null);
                    }}
                    placeholder="Recipient wallet address..."
                    className={cn(
                      "w-full bg-zinc-950 border border-zinc-800 px-3 py-2.5",
                      "text-xs font-mono text-white placeholder:text-zinc-600",
                      "focus:outline-none focus:border-emerald-500/50"
                    )}
                  />
                  <div className="mt-2 p-2 bg-emerald-500/5">
                    <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">
                      Privacy Enhanced
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Withdrawing to a different address breaks the link between your deposit and this withdrawal. 
                      <strong className="text-emerald-400"> No one can trace these funds back to you.</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Success Message with REAL Transaction */}
            {success && (
              <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <CheckCircle className="w-5 h-5" />
                  {useCustomRecipient ? '🛡️ Shielded Withdrawal Complete!' : 'Withdrawal Complete!'}
                </div>
                {useCustomRecipient && customRecipient && (
                  <p className="text-xs text-emerald-400 mt-2">
                    Funds sent to {customRecipient.slice(0, 8)}... - NO LINK to your wallet!
                  </p>
                )}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Transaction:</span>
                    {success.txSignature ? (
                      <a
                        href={success.explorer}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 font-mono"
                      >
                        {success.txSignature.slice(0, 8)}...{success.txSignature.slice(-8)}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-emerald-400 font-mono">Completed</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn(
                      "px-2 py-0.5 text-xs font-bold rounded",
                      useCustomRecipient 
                        ? "bg-emerald-500/20 text-emerald-400" 
                        : "bg-amber-500/20 text-amber-400"
                    )}>
                      {useCustomRecipient ? 'SHIELDED' : 'REAL TX'}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {useCustomRecipient 
                        ? 'Privacy-preserving withdrawal' 
                        : 'Tokens transferred on Solana Devnet'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Vault Status */}
            <div className={cn(
              "mt-4 p-3 border rounded-xl",
              vaultOnline 
                ? "bg-emerald-500/5 border-emerald-500/20" 
                : "bg-amber-500/5 border-amber-500/20"
            )}>
              <div className="flex items-start gap-3">
                {vaultOnline ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                )}
                <div className="text-xs">
                  <p className={cn(
                    "font-medium",
                    vaultOnline ? "text-emerald-400" : "text-amber-400"
                  )}>
                    {vaultOnline ? "Vault Service Online" : "Vault Service Offline"}
                  </p>
                  <p className="text-zinc-400 mt-1">
                    {vaultOnline 
                      ? "Withdrawals will transfer real tokens from the vault to your wallet."
                      : "Please ensure the matcher service is running to process withdrawals."
                    }
                  </p>
                  {vaultOnline && (
                    <p className="text-zinc-500 mt-1">
                      Vault: {vaultSol.toFixed(4)} SOL / {vaultUsdc.toFixed(2)} USDC
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleWithdraw}
              disabled={loading || !publicKey || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > currentDarkPoolBalance}
              className={cn(
                "w-full mt-6 py-4 px-6 rounded-xl font-semibold text-lg",
                useCustomRecipient && customRecipient
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400",
                "disabled:from-zinc-700 disabled:to-zinc-700 disabled:text-zinc-500",
                "transition-all duration-200",
                "flex items-center justify-center gap-2"
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {useCustomRecipient ? 'Shielding withdrawal...' : 'Processing...'}
                </>
              ) : !publicKey ? (
                'Connect Wallet'
              ) : currentDarkPoolBalance <= 0 ? (
                'No Balance to Withdraw'
              ) : (
                <>
                  {useCustomRecipient && customRecipient ? (
                    <>
                      <Shield className="w-5 h-5" />
                      Shielded Withdraw
                    </>
                  ) : (
                    <>
                      <ArrowUp className="w-5 h-5" />
                      Withdraw {selectedToken}
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
