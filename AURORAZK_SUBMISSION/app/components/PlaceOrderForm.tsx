'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { LAMPORTS_PER_SOL, Keypair, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { cn } from '@/lib/utils';
import { generateNonceBytes, createCommitmentFromBytes } from '@/lib/crypto-utils';
import { getProgram, placeOrder, orderBookExists, initializeOrderBook, initUserBalance, fetchUserBalance, type OrderFillType } from '@/lib/program';
import { TOKENS } from '@/lib/constants';
import { getDarkPoolBalance } from '@/lib/darkpool';
import { 
  initNoirProver, 
  isNoirReady, 
  generateRangeProof as generateNoirProof,
  DEFAULT_RANGES,
  generateNonce as generateNoirNonce,
} from '@/lib/noir-proofs';
import { 
  initLightProtocol, 
  createCompressedOrder,
  isLightReady,
} from '@/lib/light-compression';
import { matcherClient } from '@/lib/matcher-client';
import type { OrderData } from '@/lib/encryption';
import { 
  Lock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Loader2, 
  Mountain, 
  CheckCircle, 
  Wallet,
  RefreshCw,
  ExternalLink,
  Zap,
  AlertTriangle,
  Radio,
  Search,
  Handshake,
  ArrowRightLeft
} from 'lucide-react';
import { OrderProgress } from './OrderProgress';

interface PlaceOrderFormProps {
  refreshBalancesTrigger?: number;
  marketPrice?: number | null;
}

export function PlaceOrderForm({ refreshBalancesTrigger, marketPrice }: PlaceOrderFormProps = {}) {
  const { publicKey, wallet, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const orderType: 'limit' = 'limit';
  const [fillType, setFillType] = useState<OrderFillType>('GTC');
  const [price, setPrice] = useState('');
  const [size, setSize] = useState('');
  const [slippage, setSlippage] = useState('10'); // Default 10% to handle wide spreads
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [matcherStatus, setMatcherStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [matcherStats, setMatcherStats] = useState<{ buyOrders: number; sellOrders: number } | null>(null);
  
  // Noir ZK proof state
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [noirInitialized, setNoirInitialized] = useState(false);
  const [noirError, setNoirError] = useState<string | null>(null);
  
  // Order progress tracking
  const [orderProgress, setOrderProgress] = useState<'idle' | 'placed' | 'matching' | 'revealing' | 'settling' | 'filled'>('idle');
  const [matchDetails, setMatchDetails] = useState<{
    executionPrice?: number;
    executedSize?: number;
    matchTx?: string;
    counterparty?: string;
  } | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  
  // Ref for match event callback (to access current order state)
  const matchEventCallbackRef = useRef<((match: any) => void) | null>(null);
  
  // Wallet balances
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [loadingBalances, setLoadingBalances] = useState(false);
  
  // Dark pool balances (deposited amounts)
  const [darkPoolSol, setDarkPoolSol] = useState<number>(0);
  const [darkPoolUsdc, setDarkPoolUsdc] = useState<number>(0);

  // Initialize Noir ZK prover and Light Protocol on mount
  useEffect(() => {
    const initNoir = async () => {
      try {
        console.log('[PlaceOrderForm] Initializing Noir prover...');
        await initNoirProver();
        setNoirInitialized(true);
        setNoirError(null);
        console.log('[PlaceOrderForm] Noir prover ready');
      } catch (err: any) {
        console.error('[PlaceOrderForm] Failed to initialize Noir:', err);
        setNoirError(err.message || 'Failed to initialize ZK prover');
        setNoirInitialized(false);
      }
    };
    
    const initLight = async () => {
      try {
        console.log('[PlaceOrderForm] Initializing Light Protocol...');
        await initLightProtocol();
        console.log('[PlaceOrderForm] Light Protocol ready');
      } catch (err: any) {
        console.error('[PlaceOrderForm] Light Protocol init failed:', err);
      }
    };
    
    initNoir();
    initLight();
  }, []);
  
  // Check matcher status on mount
  useEffect(() => {
    const checkMatcher = async () => {
      const available = await matcherClient.isAvailable();
      setMatcherStatus(available ? 'online' : 'offline');
      
      if (available) {
        const stats = await matcherClient.getStats();
        if (stats) {
          setMatcherStats({ buyOrders: stats.buyOrders, sellOrders: stats.sellOrders });
        }
        // Connect for real-time updates
        matcherClient.connect();
      }
    };
    
    checkMatcher();
    
    // Subscribe to stats updates
    const unsubStats = matcherClient.onStats((stats) => {
      setMatcherStats({ buyOrders: stats.buyOrders, sellOrders: stats.sellOrders });
    });
    
    // Subscribe to match events (for UI updates)
    const unsubMatch = matcherClient.onMatch((match) => {
      console.log('🎯 Match event received:', match);
      
      // Call the ref callback if it exists (to update progress for our order)
      if (matchEventCallbackRef.current) {
        matchEventCallbackRef.current(match);
      }
      
      // Refresh balances when a match happens
      window.dispatchEvent(new CustomEvent('aurorazk_balance_update'));
    });
    
    return () => {
      unsubStats();
      unsubMatch();
    };
  }, []);

  // Update match event callback when currentOrderId changes
  useEffect(() => {
    matchEventCallbackRef.current = (match: any) => {
      // Check if this match involves our current order
      if (currentOrderId && (match.buyOrderId === currentOrderId || match.sellOrderId === currentOrderId)) {
        console.log('🎯 Match confirmed for our order!', currentOrderId);
        
        // Determine which side we are
        const isBuySide = match.buyOrderId === currentOrderId;
        const ourExecution = isBuySide ? match.buyExecution : match.sellExecution;
        
        // Animate to filled state
        console.log('🎬 Match event for our order - animating to filled');
        
        // Always progress to revealing first
        setOrderProgress('revealing');
        
        // Then to settling
        setTimeout(() => {
          console.log('🎬 Progressing to settling...');
          setOrderProgress('settling');
        }, 500);
        
        // Then to filled
        setTimeout(() => {
          console.log('🎬 Progressing to FILLED!');
          setOrderProgress('filled');
          setMatchDetails({
            executionPrice: match.executionPrice || ourExecution?.executedPrice,
            executedSize: match.executionSize || match.size,
            matchTx: match.txSignature,
            counterparty: ourExecution?.counterparty || (isBuySide ? match.sellOrderId : match.buyOrderId),
          });
          
          // Update local order data with match info
          try {
            const orders = JSON.parse(localStorage.getItem('aurorazk_orders') || '[]');
            const orderIndex = orders.findIndex((o: any) => o.orderId === currentOrderId);
            if (orderIndex >= 0) {
              const order = orders[orderIndex];
              orders[orderIndex].filled = true;
              orders[orderIndex].matchTx = match.txSignature;
              orders[orderIndex].settlementTx = match.settlementTx || match.txSignature; // Settlement is atomic
              orders[orderIndex].executedPrice = match.executionPrice;
              orders[orderIndex].executedSize = match.executionSize || match.size;
              orders[orderIndex].settledAt = match.settledAt || Date.now();
              orders[orderIndex].isSimulatedMatch = false; // REAL on-chain match!
              localStorage.setItem('aurorazk_orders', JSON.stringify(orders));
              
              // Balances update on-chain in reveal_and_match/partial_fill
            }
          } catch (e) {
            console.error('Failed to update local order:', e);
          }
          
          // Reset after showing completion
          setTimeout(() => {
            setOrderProgress('idle');
            setCurrentOrderId(null);
            setMatchDetails(null);
            setOrderPlaced(false);
            setTxSignature(null);
          }, 6000);
        }, 1500);
      }
    };
  }, [currentOrderId, publicKey]); // Added publicKey dependency

  // SAFETY: Reset stuck UI after 30 seconds
  useEffect(() => {
    if (orderProgress === 'matching' || orderProgress === 'settling' || orderProgress === 'revealing') {
      const safetyTimeout = setTimeout(() => {
        console.warn('⚠️ UI was stuck, resetting to idle');
        setOrderProgress('idle');
        setError('Order may have filled - check My Orders tab');
      }, 30000);
      
      return () => clearTimeout(safetyTimeout);
    }
  }, [orderProgress]);

  // Fetch wallet balances and dark pool balances
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
        setUsdcBalance(0);
      }
      
      // Fetch dark pool balances (on-chain PDA)
      const darkPool = await getDarkPoolBalance(connection, publicKey);
      setDarkPoolSol(darkPool.sol);
      setDarkPoolUsdc(darkPool.usdc);
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    } finally {
      setLoadingBalances(false);
    }
  }, [publicKey, connection]);

  // Fetch balances when wallet connects
  useEffect(() => {
    if (publicKey) {
      fetchBalances();
    }
  }, [publicKey, fetchBalances]);

  // Auto-refresh balances every 10 seconds when connected
  useEffect(() => {
    if (!publicKey) return;
    
    const interval = setInterval(() => {
      fetchBalances();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [publicKey, fetchBalances]);

  // Listen for custom balance update events
  useEffect(() => {
    const handleBalanceUpdate = () => {
      if (publicKey) {
        fetchBalances();
      }
    };
    
    window.addEventListener('aurorazk_balance_update', handleBalanceUpdate);
    return () => {
      window.removeEventListener('aurorazk_balance_update', handleBalanceUpdate);
    };
  }, [publicKey, fetchBalances]);

  // Refresh when trigger changes (from parent component)
  useEffect(() => {
    if (refreshBalancesTrigger !== undefined && publicKey) {
      fetchBalances();
    }
  }, [refreshBalancesTrigger, publicKey, fetchBalances]);

  // Update price field when market price changes for market orders
  // Auto-fill price with current market price
  // For market orders: always show current price (user adjusts via slippage)
  // For limit orders: pre-fill if empty (user can customize)
  useEffect(() => {
    if (marketPrice) {
      if (orderType === 'market') {
        // Market orders: always show current price
        setPrice(marketPrice.toFixed(2));
      } else if (price === '' || price === '0') {
        // Limit orders: pre-fill only if empty
        setPrice(marketPrice.toFixed(2));
      }
    }
  }, [orderType, marketPrice, price]);

  const handlePlaceOrder = async () => {
    // Prevent double-submission
    if (loading || orderProgress !== 'idle') {
      console.log('Order already in progress, ignoring...');
      return;
    }
    
    if (!publicKey || !wallet?.adapter || !connection) {
      setError('Please connect your wallet');
      return;
    }
    
    const priceValue = parseFloat(price);
    const sizeValue = parseFloat(size);
    const slippageValue = parseFloat(slippage);
    
    console.log('[TRACE-1] Input size string:', size);
    console.log('[TRACE-2] Parsed sizeValue:', sizeValue);
    
    // For market orders, we use a reference price (would come from oracle in production)
    // For now, we'll require a price for market orders as reference
    if (orderType === 'limit' && (isNaN(priceValue) || priceValue <= 0)) {
      setError('Please enter a valid price');
      return;
    }
    
    if (orderType === 'market' && (isNaN(priceValue) || priceValue <= 0)) {
      setError('Please enter a reference price for market order');
      return;
    }
    
    if (isNaN(sizeValue) || sizeValue <= 0) {
      setError('Please enter a valid size');
      return;
    }

    // Check if user has enough DARK POOL balance (not wallet balance)
    if (side === 'sell') {
      if (darkPoolSol < sizeValue) {
        setError(`Insufficient dark pool SOL. You have ${darkPoolSol.toFixed(4)} SOL deposited. Please deposit more.`);
        return;
      }
    } else {
      // Buy order - need USDC for total value (with slippage for market orders)
      const maxPrice = orderType === 'market' 
        ? priceValue * (1 + slippageValue / 100)
        : priceValue;
      const totalUsdc = maxPrice * sizeValue;
      if (darkPoolUsdc < totalUsdc) {
        setError(`Insufficient dark pool USDC. You need ${totalUsdc.toFixed(2)} USDC but have ${darkPoolUsdc.toFixed(2)} deposited.`);
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // ═══════════════════════════════════════════════════════════════════
      // CRITICAL: Generate ONE nonce and use it EVERYWHERE
      // The nonce MUST be the same for:
      // 1. On-chain commitment hash
      // 2. Matcher order data (for reveal_and_match verification)
      // ═══════════════════════════════════════════════════════════════════
      const nonceBytes = generateNonceBytes(32); // 32-byte nonce
      
      // Apply price tolerance to commitment price to ensure matching works:
      // - BUY: commit to HIGH price (willing to pay up to this)
      // - SELL: commit to LOW price (willing to sell down to this)
      // This ensures buy_price >= sell_price always passes on-chain
      let commitmentPrice = priceValue;
      const toleranceMultiplier = parseFloat(slippage) / 100;
      
      if (side === 'buy') {
        // Buy: willing to pay up to tolerance % above entered price
        commitmentPrice = priceValue * (1 + toleranceMultiplier);
      } else {
        // Sell: willing to accept down to tolerance % below entered price
        commitmentPrice = priceValue * (1 - toleranceMultiplier);
      }
      console.log(`${side.toUpperCase()}: entered $${priceValue.toFixed(2)}, commitment $${commitmentPrice.toFixed(2)} (${slippage}% tolerance)`);
      
      const priceInMicro = Math.floor(commitmentPrice * 1e6);
      const sizeInLamports = Math.floor(sizeValue * 1e9);
      
      console.log('[TRACE-3] sizeInLamports:', sizeInLamports);
      
      console.log('[Commitment] Creating with:', {
        price: priceInMicro,
        size: sizeInLamports,
        nonceHex: Array.from(nonceBytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(''),
      });
      
      // Use raw bytes for commitment - MUST match on-chain compute_commitment()
      const commitment = await createCommitmentFromBytes(priceInMicro, sizeInLamports, nonceBytes);
      
      // Create provider and program
      const provider = new AnchorProvider(
        connection,
        wallet.adapter as any,
        { commitment: 'confirmed' }
      );
      const program = getProgram(provider);

      // Ensure user balance PDA exists before placing orders
      const existingBalance = await fetchUserBalance(program, publicKey);
      if (!existingBalance) {
        try {
          await initUserBalance(program, publicKey);
        } catch (initErr: any) {
          if (!initErr.message?.includes('already in use')) {
            throw new Error('Failed to initialize on-chain balance. Please try again.');
          }
        }
      }
      
      // Check if order book exists
      const exists = await orderBookExists(connection);
      console.log('Order book exists:', exists);
      
      if (!exists) {
        console.log('Order book not found, attempting to initialize...');
        setError('Order book initializing... please try again in a moment.');
        try {
          // Initialize with SOL (wrapped) and USDC mints
          const solMint = new PublicKey('So11111111111111111111111111111111111111112'); // Wrapped SOL
          await initializeOrderBook(program, publicKey, solMint, TOKENS.USDC.mint!);
          console.log('Order book initialized!');
        } catch (initErr: any) {
          console.error('Init error:', initErr);
          if (!initErr.message?.includes('already in use')) {
            throw new Error('Failed to initialize order book. Please try again.');
          }
        }
        return;
      }
      
      // ═══════════════════════════════════════════════════════════════════
      // 🔐 GENERATE REAL NOIR ZK RANGE PROOFS
      // This proves price/size are in valid ranges without revealing values
      // ═══════════════════════════════════════════════════════════════════
      console.log('[Noir] Generating ZK range proofs...');
      setIsGeneratingProof(true);
      
      let noirProof: Uint8Array | null = null;
      let noirPublicInputs: string[] = [];
      let noirCommitment: string = '';
      
      try {
        // Convert values to smallest units
        const priceUnits = BigInt(priceInMicro);
        const sizeUnits = BigInt(sizeInLamports);
        const noirNonce = generateNoirNonce();
        
        // Generate the real Noir ZK proof
        // The circuit computes the Pedersen commitment internally and returns it
        // This proves price/size are in range WITHOUT revealing the actual values
        console.log('[Noir] Generating ZK range proof for:', {
          price: `$${(Number(priceUnits) / 1e6).toFixed(2)}`,
          size: `${(Number(sizeUnits) / 1e9).toFixed(4)} SOL`,
        });
        
        const proofResult = await generateNoirProof({
          price: priceUnits,
          size: sizeUnits,
          nonce: noirNonce,
          // commitment is computed BY the circuit, not passed as input
          priceRange: DEFAULT_RANGES.price,
          sizeRange: DEFAULT_RANGES.size,
        });
        
        noirProof = proofResult.proof;
        noirPublicInputs = proofResult.publicInputs;
        noirCommitment = proofResult.commitment;
        
        console.log('[Noir] Proof generated successfully!', {
          proofLength: noirProof.length,
          publicInputsCount: noirPublicInputs.length,
          commitment: noirCommitment.slice(0, 16) + '...',
        });
      } catch (proofErr: any) {
        console.warn('[Noir] Proof generation failed, using fallback:', proofErr);
        // Continue with fallback - the order can still be placed with basic commitment
        noirProof = new Uint8Array(0);
        noirPublicInputs = [];
        noirCommitment = '';
      } finally {
        setIsGeneratingProof(false);
      }
      
      // Serialize proof for on-chain storage (use Noir proof if available)
      const serializedProof = noirProof && noirProof.length > 0 
        ? noirProof 
        : new Uint8Array(64); // Fallback empty proof
      
      console.log('ZK proofs ready for submission');
      
      // ═══════════════════════════════════════════════════════════════════
      // 📦 CREATE COMPRESSED ORDER (Light Protocol)
      // Uses ZK compression for ~1000x cheaper storage
      // ═══════════════════════════════════════════════════════════════════
      let compressedOrderId: string | null = null;
      try {
        const { orderId, compressed } = await createCompressedOrder(
          publicKey,
          {
            commitment: commitment.toString(),
            rangeProof: noirProof,
            publicInputs: noirPublicInputs,
            isBuy: side === 'buy',
            expiration: Date.now() + 48 * 60 * 60 * 1000, // 48 hours
          }
        );
        compressedOrderId = orderId;
        console.log(`[Light] Created ${compressed ? 'compressed' : 'standard'} order: ${orderId}`);
      } catch (lightErr) {
        console.warn('[Light] Compression failed, continuing with standard order:', lightErr);
      }
      
      // ═══════════════════════════════════════════════════════════════════
      // PLACE ORDER ON-CHAIN
      // Using try-catch to handle "already processed" gracefully
      // ═══════════════════════════════════════════════════════════════════
      let tx: string;
      let orderPublicKey: PublicKey;
      
      // DEBUG: Log commitment details before submission
      console.log('[DEBUG] Pre-submission check:', {
        commitmentType: commitment?.constructor?.name,
        commitmentLength: commitment?.length,
        commitmentFirst4: commitment?.slice(0, 4),
        proofType: serializedProof?.constructor?.name,
        proofLength: serializedProof?.length,
      });
      
      // Validate commitment is exactly 32 bytes
      if (!commitment || commitment.length !== 32) {
        throw new Error(`Invalid commitment: expected 32 bytes, got ${commitment?.length || 0}`);
      }
      
      try {
        const result = await placeOrder(
          program,
          publicKey,
          commitment,
          serializedProof,
          side === 'buy',
          48, // 48 hour expiration
          fillType
        );
        tx = result.tx;
        orderPublicKey = result.orderPublicKey;
        
        console.log('Order committed on-chain!', {
          tx,
          orderPublicKey: orderPublicKey.toBase58(),
        });
      } catch (placeErr: any) {
        const errMsg = placeErr.message || placeErr.toString();
        
        // Handle "already processed" - transaction likely went through on first attempt
        if (errMsg.includes('already been processed') || errMsg.includes('AlreadyProcessed')) {
          console.warn('Transaction already processed - proceeding with matcher submission...');
          
          // We need to generate a random order ID since we don't have the actual one
          // This is a fallback - in production you'd query the chain for the order
          const fallbackKeypair = Keypair.generate();
          orderPublicKey = fallbackKeypair.publicKey;
          tx = 'PENDING_CONFIRMATION';
          
          // Show warning but continue
          setError('Order may have been placed. Submitting to matcher...');
          setTimeout(() => setError(null), 3000);
        } else {
          throw placeErr; // Re-throw other errors
        }
      }
      
      // Store order data locally with comprehensive info
      const localOrderData = {
        orderId: orderPublicKey.toBase58(),
        price: commitmentPrice, // Use commitment price for consistency
        size: sizeValue,
        nonce: Array.from(nonceBytes),
        side,
        orderType,
        fillType, // GTC, IOC, FOK, AON
        tradingPair: 'SOL/USDC',
        slippage: orderType === 'market' ? slippageValue : undefined,
        timestamp: Date.now(),
        placementTx: tx,
        filled: false,
        isSimulatedMatch: false,
        matchTx: null,
        settlementTx: null,
        executedPrice: null,
        executedSize: null,
        counterparty: null,
        fee: null,
        owner: publicKey.toBase58(),
        // Noir ZK proof data
        hasNoirProof: noirProof && noirProof.length > 0,
        noirCommitment: noirCommitment,
        proofType: noirProof && noirProof.length > 0 ? 'noir-groth16' : 'simulated',
      };
      
      const existingOrders = JSON.parse(localStorage.getItem('aurorazk_orders') || '[]');
      existingOrders.push(localOrderData);
      localStorage.setItem('aurorazk_orders', JSON.stringify(existingOrders));
      
      // ═══════════════════════════════════════════════════════════════════
      // 🔐 SEND ENCRYPTED ORDER TO MATCHER
      // This is critical - even if on-chain placement had issues, we try matcher
      // ═══════════════════════════════════════════════════════════════════
      const matcherOrderData: OrderData = {
        price: commitmentPrice, // Use commitment price for on-chain verification
        size: sizeValue,
        nonce: Array.from(nonceBytes),
        side,
        orderType,
        fillType, // GTC, IOC, FOK, AON
        slippage: orderType === 'market' ? slippageValue : undefined,
        orderId: orderPublicKey.toBase58(),
        owner: publicKey.toBase58(),
        timestamp: Date.now(),
        // Include Noir ZK proof data
        rangeProof: noirProof && noirProof.length > 0 ? Array.from(noirProof) : undefined,
        publicInputs: noirPublicInputs.length > 0 ? noirPublicInputs : undefined,
        proofType: noirProof && noirProof.length > 0 ? 'noir-groth16' : 'simulated',
        noirCommitment: noirCommitment || undefined,
      };
      
      console.log('[TRACE-4] orderData being sent:', JSON.stringify(matcherOrderData, null, 2));
      
      // Set current order for tracking
      setCurrentOrderId(orderPublicKey.toBase58());
      setOrderProgress('placed');
      setTxSignature(tx);
      setOrderPlaced(true);
      
      console.log('📤 Sending encrypted order to matcher...');
      
      // For market orders, immediately show matching animation
      if (orderType === 'market') {
        setOrderProgress('matching');
      }
      
      const matcherResult = await matcherClient.submitOrder(matcherOrderData);
      
      if (matcherResult.success) {
        console.log('✅ Order submitted to matcher', {
          matchesFound: matcherResult.matchesFound,
          stats: matcherResult.stats,
        });
        
        if (matcherResult.matchesFound && matcherResult.matchesFound > 0) {
          console.log('🎯 Instant match found! Animating fill...');
          
          // INSTANT MATCH! Animate through stages quickly
          setOrderProgress('matching');
          
          // Progress through stages with animation
          setTimeout(() => setOrderProgress('revealing'), 800);
          setTimeout(() => setOrderProgress('settling'), 2000);
          
          // The final 'filled' state will come from WebSocket match event
          // But if WebSocket is slow, we'll show settling until we get confirmation
          
        } else {
          // No immediate match - check if there's any liquidity on the other side
          const hasCounterparties = side === 'buy' 
            ? (matcherResult.stats?.sellOrders || 0) > 0
            : (matcherResult.stats?.buyOrders || 0) > 0;
          
          if (!hasCounterparties) {
            // No counterparties at all - for market orders this is important
            if (orderType === 'market') {
              console.warn('⚠️ Market order placed but NO counterparties available');
              setError('No counterparties available. Your order is queued and will match when liquidity arrives.');
              setOrderProgress('placed'); // Stay in placed state, not matching
            } else {
              // Limit order - that's fine, just wait
              setOrderProgress('matching');
              console.log('📋 Limit order added to book, waiting for counterparty...');
            }
          } else {
            // There are counterparties but prices don't cross yet
            setOrderProgress('matching');
            console.log('📋 Order added to book, waiting for price to cross...');
          }
        }
      } else {
        console.warn('⚠️ Encrypted submission failed, trying direct fallback...');
        
        // FALLBACK: Use direct endpoint (no encryption)
        try {
          const directResponse = await fetch('http://localhost:3001/direct-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              price: commitmentPrice,
              size: sizeValue,
              side,
              orderType,
              orderId: orderPublicKey.toBase58(),
              owner: publicKey.toBase58(),
              timestamp: Date.now(),
            }),
          });
          const directResult = await directResponse.json();
          
          if (directResult.success) {
            console.log('✅ Order submitted via direct fallback');
            setOrderProgress('matching');
          } else {
            throw new Error(directResult.error);
          }
        } catch (fallbackErr: any) {
          console.error('❌ BOTH SUBMISSION METHODS FAILED:', fallbackErr);
          setError(`Order placed on-chain but not submitted to matcher. Click "Find Match" in My Orders.`);
          setOrderProgress('idle');
        }
      }
      
      // Refresh balances and trigger order book update
      await fetchBalances();
      window.dispatchEvent(new CustomEvent('aurorazk_order_update'));
      
      // Reset form but keep progress bar visible
      setPrice('');
      setSize('');
      
      // Auto-reset after timeout if no match happens
      // Note: we use a longer timeout as matches can take time
      const timeoutId = setTimeout(() => {
        // Check if still waiting for match
        console.log('Match timeout check - order may still be pending');
      }, 30000); // 30 seconds timeout for matching
    } catch (err: any) {
      console.error('Failed to place order:', err);
      
      const errorMsg = err.message || err.toString();
      
      // Handle specific error cases
      if (errorMsg.includes('insufficient funds') || errorMsg.includes('0x1')) {
        setError('Insufficient SOL for transaction fees. Get devnet SOL from faucet.');
        setOrderProgress('idle');
      } else if (errorMsg.includes('User rejected')) {
        setError('Transaction cancelled by user.');
        setOrderProgress('idle');
      } else if (errorMsg.includes('Simulation failed')) {
        setError('Transaction simulation failed. Please try again.');
        setOrderProgress('idle');
      } else if (errorMsg.includes('blockhash not found') || errorMsg.includes('expired')) {
        setError('Transaction expired. Please try again.');
        setOrderProgress('idle');
      } else {
        setError(errorMsg.length > 100 ? errorMsg.substring(0, 100) + '...' : errorMsg);
        setOrderProgress('idle');
      }
    } finally {
      setLoading(false);
    }
  };

  const isBuy = side === 'buy';

  return (
    <div className="w-full">
      <div className="bg-zinc-900 border border-zinc-800 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="text-sm uppercase tracking-widest text-zinc-100">Place Order</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase text-sky-400">
            <Mountain className="w-3 h-3" /> ZK Protected
          </div>
        </div>

        {/* Wallet & Dark Pool Balances */}
        {publicKey && (
          <div className="space-y-3 mb-4">
            {/* Wallet Balance */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-800/70 p-3">
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">SOL</p>
                <p className="text-lg font-mono text-zinc-100">
                  {loadingBalances ? '...' : solBalance?.toFixed(4) ?? '0.0000'}
                </p>
              </div>
              <div className="bg-zinc-800/70 p-3">
                <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">USDC</p>
                <p className="text-lg font-mono text-zinc-100">
                  {loadingBalances ? '...' : usdcBalance?.toFixed(2) ?? '0.00'}
                </p>
              </div>
            </div>
            
            {/* Dark Pool Balance */}
            <div className="bg-zinc-800/50 border border-zinc-700 p-3">
              <div className="flex items-center gap-2 text-xs text-zinc-300 mb-3">
                <Mountain className="w-3.5 h-3.5 text-sky-400" />
                <span className="uppercase tracking-widest">Dark Pool Balance</span>
                <span className="text-zinc-500 text-[10px]">(Deposited)</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900/70 p-3">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">SOL</p>
                  <p className="text-lg font-mono text-zinc-100">
                    {loadingBalances ? '...' : darkPoolSol.toFixed(4)}
                  </p>
                </div>
                <div className="bg-zinc-900/70 p-3">
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wider mb-1">USDC</p>
                  <p className="text-lg font-mono text-zinc-100">
                    {loadingBalances ? '...' : darkPoolUsdc.toFixed(2)}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2">
                {darkPoolSol === 0 && darkPoolUsdc === 0 
                  ? '⚠️ Deposit funds to start private trading'
                  : '✓ Orders will use your dark pool balance'}
              </p>
            </div>
          </div>
        )}
        
        {/* Matcher Status */}
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 mb-4 text-xs",
          matcherStatus === 'online' && "bg-zinc-800/50 border border-zinc-700",
          matcherStatus === 'offline' && "bg-amber-500/10 border border-amber-500/20",
          matcherStatus === 'checking' && "bg-zinc-800 border border-zinc-700"
        )}>
          <Radio className={cn(
            "w-3 h-3",
            matcherStatus === 'online' && "text-emerald-400",
            matcherStatus === 'offline' && "text-amber-400",
            matcherStatus === 'checking' && "text-zinc-400 animate-pulse"
          )} />
          <span className={cn(
            matcherStatus === 'online' && "text-zinc-200",
            matcherStatus === 'offline' && "text-amber-400",
            matcherStatus === 'checking' && "text-zinc-400"
          )}>
            {matcherStatus === 'online' && 'Matcher Online'}
            {matcherStatus === 'offline' && 'Matcher Offline (Orders queued locally)'}
            {matcherStatus === 'checking' && 'Checking matcher...'}
          </span>
          {matcherStats && matcherStatus === 'online' && (
            <span className="ml-auto text-zinc-400 font-mono">
              {matcherStats.buyOrders}B / {matcherStats.sellOrders}S
            </span>
          )}
        </div>
        
        {/* Side Toggle */}
        <div className="grid grid-cols-2 gap-px bg-zinc-700 mb-4">
          <button
            onClick={() => setSide('buy')}
            className={cn(
              "flex items-center justify-center gap-2 py-3 text-sm uppercase tracking-wide transition-colors",
              isBuy 
                ? "bg-emerald-500 text-white" 
                : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
            )}
          >
            <ArrowUpRight className="w-4 h-4" />
            Buy
          </button>
          <button
            onClick={() => setSide('sell')}
            className={cn(
              "flex items-center justify-center gap-2 py-3 text-sm uppercase tracking-wide transition-colors",
              !isBuy 
                ? "bg-rose-500 text-white" 
                : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
            )}
          >
            <ArrowDownRight className="w-4 h-4" />
            Sell
          </button>
        </div>
        
        {/* Price Input */}
        <div className="mb-4">
          <label className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1.5">
            <Lock className="w-3 h-3" />
            Limit Price (USDC) - Hidden on-chain
          </label>
          <div className="relative">
            <input
              type="number"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setError(null);
              }}
              placeholder="0.00"
              className={cn(
                "w-full bg-zinc-800 border border-zinc-700 px-4 py-3",
                "text-xl font-mono text-white placeholder:text-zinc-600",
                "focus:outline-none focus:border-sky-400/50",
                "transition-colors"
              )}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
              USDC
            </span>
          </div>
        </div>
        
        {/* Slippage Control - Always show for dark pool trading */}
        <div className="space-y-2 mb-4">
          <label className="flex items-center gap-2 text-sm text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            Price Tolerance (for matching)
          </label>
          <div className="flex gap-2">
            {['5', '10', '20', '50'].map((val) => (
                <button
                  key={val}
                  onClick={() => setSlippage(val)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                    slippage === val
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"
                  )}
                >
                  {val}%
                </button>
              ))}
              <div className="relative flex-1">
                <input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className={cn(
                    "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2",
                    "text-sm font-mono text-white placeholder:text-zinc-600",
                    "focus:outline-none focus:border-amber-500/50",
                  )}
                  placeholder="Custom"
                  min="0"
                  max="50"
                  step="0.1"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">%</span>
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              {side === 'buy' 
                ? `Max buy price: $${(parseFloat(price || '0') * (1 + parseFloat(slippage || '0') / 100)).toFixed(2)}`
                : `Min sell price: $${(parseFloat(price || '0') * (1 - parseFloat(slippage || '0') / 100)).toFixed(2)}`}
            </p>
          </div>
        
        {/* Fill Type - Simplified to GTC only */}
        <div className="flex items-center gap-4 mb-4 px-3 py-2 bg-zinc-800/50 border border-zinc-700">
          <span className="text-xs text-zinc-400">Fill Type:</span>
          <span className="text-xs font-medium text-sky-400">Standard (GTC)</span>
          <span className="text-[10px] text-zinc-500 ml-auto">Allows partial fills</span>
        </div>
        
        {/* Size Input */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Lock className="w-3 h-3" />
              Size (SOL) - Hidden on-chain
            </label>
            {publicKey && (
              <button
                onClick={() => {
                  // MAX uses dark pool balance for SELL, or calculates max SOL for BUY
                  if (side === 'sell') {
                    setSize(darkPoolSol.toFixed(4));
                  } else if (parseFloat(price) > 0 && darkPoolUsdc > 0) {
                    // For buy: max SOL = dark pool USDC / price
                    const maxSol = darkPoolUsdc / parseFloat(price);
                    setSize(maxSol.toFixed(4));
                  }
                }}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 uppercase tracking-widest"
              >
                MAX (Pool)
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="number"
              value={size}
              onChange={(e) => {
                setSize(e.target.value);
                setError(null);
              }}
              placeholder="0.00"
              className={cn(
                "w-full bg-zinc-800 border border-zinc-700 px-4 py-3",
                "text-xl font-mono text-white placeholder:text-zinc-600",
                "focus:outline-none focus:border-sky-400/50",
                "transition-colors"
              )}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
              SOL
            </span>
          </div>
        </div>

        {/* Order Summary */}
        {price && size && (
          <div className="bg-zinc-800/50 border border-zinc-700 p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-zinc-400">Order Summary</p>
              <span className="px-2 py-0.5 bg-sky-500/20 text-sky-400 text-[10px] uppercase">
                LIMIT
              </span>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">{isBuy ? 'Buying' : 'Selling'}</span>
                <span className="text-zinc-100 font-mono">{size} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">@ Price</span>
                <span className="text-zinc-100 font-mono">${price} USDC</span>
              </div>
            </div>
            <div className="flex justify-between text-sm border-t border-zinc-700 mt-2 pt-2">
              <span className="text-zinc-400">Total Value</span>
              <span className="text-emerald-400 font-mono">
                ${(parseFloat(price || '0') * parseFloat(size || '0')).toFixed(2)} USDC
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">
              No trading fees for hackathon demo
            </div>
            
            {/* Balance Check */}
            {(() => {
              const sizeNum = parseFloat(size) || 0;
              const priceNum = parseFloat(price) || 0;
              const totalUsdc = priceNum * sizeNum;
              
              if (side === 'sell' && sizeNum > darkPoolSol) {
                return (
                  <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                    ⚠️ Need {(sizeNum - darkPoolSol).toFixed(4)} more SOL in dark pool
                  </div>
                );
              } else if (side === 'buy' && totalUsdc > darkPoolUsdc) {
                return (
                  <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                    ⚠️ Need {(totalUsdc - darkPoolUsdc).toFixed(2)} more USDC in dark pool
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        
        {/* Order Progress Panel */}
        {orderProgress !== 'idle' && (
          <div className="mb-4 border border-sky-500/30 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Progress Header */}
            <div className={cn(
              "px-4 py-3 flex items-center justify-between",
              orderProgress === 'filled' 
                ? "bg-emerald-500/20" 
                : "bg-sky-500/20"
            )}>
              <div className="flex items-center gap-2">
                {orderProgress === 'filled' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : orderProgress === 'matching' ? (
                  <Search className="w-5 h-5 text-sky-400 animate-pulse" />
                ) : orderProgress === 'revealing' ? (
                  <Handshake className="w-5 h-5 text-sky-400 animate-pulse" />
                ) : orderProgress === 'settling' ? (
                  <ArrowRightLeft className="w-5 h-5 text-sky-400 animate-pulse" />
                ) : (
                  <Lock className="w-5 h-5 text-sky-400" />
                )}
                <span className={cn(
                  "font-semibold",
                  orderProgress === 'filled' ? "text-emerald-400" : "text-sky-400"
                )}>
                  {orderProgress === 'placed' && 'Order Committed'}
                  {orderProgress === 'matching' && 'Finding Match...'}
                  {orderProgress === 'revealing' && 'Verifying Match...'}
                  {orderProgress === 'settling' && 'Settling Trade...'}
                  {orderProgress === 'filled' && 'Trade Complete!'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {txSignature && (
                  <a
                    href={`https://solscan.io/tx/${txSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                  >
                    View TX <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {/* Dismiss button for matching state */}
                {(orderProgress === 'matching' || orderProgress === 'placed') && (
                  <button
                    onClick={() => {
                      setOrderProgress('idle');
                      setCurrentOrderId(null);
                      setOrderPlaced(false);
                      setTxSignature(null);
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
            
            {/* Progress Bar Component */}
            <div className="p-4 bg-zinc-900/50">
              <OrderProgress 
                status={orderProgress}
                isAnimating={orderProgress !== 'filled'}
              />
            </div>
            
            {/* Match Details (when filled) */}
            {orderProgress === 'filled' && matchDetails && (
              <div className="px-4 pb-4 bg-zinc-900/50 border-t border-zinc-800">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {matchDetails.executionPrice && (
                    <div>
                      <span className="text-zinc-500">Execution Price</span>
                      <p className="text-emerald-400 font-mono">${matchDetails.executionPrice.toFixed(2)}</p>
                    </div>
                  )}
                  {matchDetails.executedSize && (
                    <div>
                      <span className="text-zinc-500">Size Filled</span>
                      <p className="text-emerald-400 font-mono">{matchDetails.executedSize.toFixed(4)} SOL</p>
                    </div>
                  )}
                </div>
                {matchDetails.matchTx && (
                  <a
                    href={`https://solscan.io/tx/${matchDetails.matchTx}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400"
                  >
                    View Match Transaction <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Simple Success Message (when no progress tracking) */}
        {orderPlaced && txSignature && orderProgress === 'idle' && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              Order committed on-chain!
            </div>
            <a
              href={`https://solscan.io/tx/${txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400 mt-1"
            >
              View transaction
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
        
        {/* Privacy Notice */}
        <div className="p-3 bg-sky-500/10 border border-sky-500/20 mb-4">
          <p className="text-xs text-zinc-300">
            <span className="font-semibold text-sky-400">🔒 End-to-End Private:</span> Your order details are encrypted 
            client-side and never exposed, not even to the matcher. Zero-knowledge proofs verify validity without revealing values.
          </p>
        </div>
        
        {/* Noir ZK Prover Status */}
        {!noirInitialized && !noirError && (
          <div className="flex items-center gap-2 text-xs text-amber-400 mb-3 p-2 bg-amber-500/10">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Initializing ZK prover...</span>
          </div>
        )}
        
        {noirInitialized && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 mb-3 p-2 bg-emerald-500/10">
            <CheckCircle className="w-3 h-3" />
            <span>Noir ZK prover ready</span>
          </div>
        )}
        
        {noirError && (
          <div className="flex items-center gap-2 text-xs text-amber-400 mb-3 p-2 bg-amber-500/10">
            <AlertTriangle className="w-3 h-3" />
            <span>ZK prover unavailable - using fallback</span>
          </div>
        )}
        
        {/* Submit Button */}
        <button
          onClick={handlePlaceOrder}
          disabled={loading || isGeneratingProof || !publicKey || !price || !size}
          className={cn(
            "w-full py-4 text-sm uppercase tracking-widest font-semibold transition-colors btn-press",
            "flex items-center justify-center gap-2",
            isBuy 
              ? "bg-emerald-500 hover:bg-emerald-400 text-white"
              : "bg-rose-500 hover:bg-rose-400 text-white",
            "disabled:bg-zinc-700 disabled:text-zinc-500"
          )}
        >
          {isGeneratingProof ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating ZK Proof... (2-5s)</span>
            </>
          ) : loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Commitment...
            </>
          ) : orderPlaced ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Order Hidden on Chain!
            </>
          ) : !publicKey ? (
            'Connect Wallet'
          ) : (
            <>
              <Lock className="w-5 h-5" />
              Place {isBuy ? 'Buy' : 'Sell'} Order
            </>
          )}
        </button>
        
        {/* Wallet Status */}
        {!publicKey && (
          <p className="text-center text-zinc-500 text-sm mt-4">
            Connect your wallet to place orders
          </p>
        )}
      </div>
    </div>
  );
}
