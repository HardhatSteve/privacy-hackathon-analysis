'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { getProgram, fetchAllOrders, cancelOrder } from '@/lib/program';
import { matcherClient, type MatchEvent } from '@/lib/matcher-client';
import { EXPLORER, FEE_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { 
  RefreshCw, 
  Loader2, 
  ShoppingCart, 
  Tag,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Play,
  Zap,
  Radio,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Hash,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface FillRecord {
  size: number;
  price: number;
  txSignature: string;
  timestamp: number;
}

interface LocalOrderData {
  orderId: string;
  price: number;
  size: number;
  nonce: number[];
  side: 'buy' | 'sell';
  orderType?: 'limit' | 'market';
  timestamp: number;
  filled?: boolean;
  filledAt?: number;
  placementTx?: string;
  matchTx?: string;
  settlementTx?: string;
  isSimulatedMatch?: boolean;
  executedPrice?: number;
  executedSize?: number;
  slippage?: number;
  counterparty?: string;
  tradingPair?: string;
  fee?: number;
  fillCount?: number;
  fillHistory?: FillRecord[];
}

interface OnChainOrder {
  publicKey: PublicKey;
  owner: PublicKey;
  commitmentHash: number[];
  rangeProof: number[];
  isBuy: boolean;
  timestamp: number;
  filled: boolean;
  orderId: number;
}

// Compact Order Card Component
function OrderCard({ 
  order, 
  showHiddenData,
  isExpanded,
  onToggleExpand,
  onCancel,
  onRequestMatch,
  isMatching,
  matchProgress,
  isCancelling,
}: {
  order: OnChainOrder & { localData?: LocalOrderData };
  showHiddenData: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCancel: () => void;
  onRequestMatch: () => void;
  isMatching: boolean;
  matchProgress: string;
  isCancelling: boolean;
}) {
  const isBuy = order.isBuy;
  const local = order.localData;
  
  // Calculate values
  const price = local?.executedPrice || local?.price || 0;
  const orderSize = local?.size || 0;
  const executedSize = local?.executedSize || 0;
  const effectiveSize = order.filled ? (executedSize || orderSize) : orderSize;
  const totalValue = price * effectiveSize;
  const slippage = local?.slippage || 0;
  const orderType = local?.orderType || 'limit';
  const feeRate = FEE_CONFIG.getFeePercent();
  const fee = local?.fee || FEE_CONFIG.calculateFee();
  
  console.log('[TRACE-9] Order from storage:', order);
  console.log('[TRACE-10] Displayed size:', orderSize);
  
  return (
    <div className={cn(
      "bg-zinc-900 border overflow-hidden transition-all",
      isBuy ? "border-emerald-500/20 hover:border-emerald-500/40" : "border-rose-500/20 hover:border-rose-500/40"
    )}>
      {/* Compact Header - Always Visible */}
      <div 
        className="p-4 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          {/* Left: Side + Status */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 flex items-center justify-center",
              isBuy ? "bg-emerald-500/10" : "bg-rose-500/10"
            )}>
              {isBuy ? (
                <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
              ) : (
                <ArrowUpRight className="w-5 h-5 text-rose-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-bold text-sm",
                  isBuy ? "text-emerald-400" : "text-rose-400"
                )}>
                  {isBuy ? 'BUY' : 'SELL'}
                </span>
                <span className="text-zinc-500 text-xs">
                  {local?.tradingPair || 'SOL/USDC'}
                </span>
                {order.filled ? (
                  // Check if partially filled (executed less than ordered)
                  local?.executedSize && local.executedSize < (local.size * 0.99) ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full text-[10px]">
                      <CheckCircle className="w-3 h-3" />
                      Partial ({((local.executedSize / local.size) * 100).toFixed(0)}%)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px]">
                      <CheckCircle className="w-3 h-3" />
                      Filled
                    </span>
                  )
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full text-[10px]">
                    <Clock className="w-3 h-3" />
                    Open
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                #{order.orderId} • {new Date(order.timestamp * 1000).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Center: Key Metrics */}
          <div className="hidden md:flex items-center gap-6">
            {showHiddenData && local ? (
              <>
                <div className="text-right">
                  <p className="text-[10px] text-zinc-500">Price</p>
                  <p className="text-sm font-mono text-white">${price.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-zinc-500">Size</p>
                  <p className="text-sm font-mono text-white">{orderSize.toFixed(4)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-zinc-500">Value</p>
                  <p className="text-sm font-mono text-emerald-400">${totalValue.toFixed(2)}</p>
                </div>
                {order.filled && slippage !== 0 && (
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-500">Slippage</p>
                    <p className={cn(
                      "text-sm font-mono",
                      slippage > 0 ? "text-rose-400" : "text-emerald-400"
                    )}>
                      {slippage > 0 ? '+' : ''}{slippage.toFixed(2)}%
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-zinc-500 text-xs">
                <Lock className="w-3 h-3" />
                <span>Details hidden</span>
              </div>
            )}
          </div>

          {/* Right: Actions + Expand */}
          <div className="flex items-center gap-2">
            {/* Quick TX Link */}
            {local?.placementTx && (
              <a
                href={EXPLORER.tx(local.placementTx)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 text-zinc-400 hover:text-emerald-400 transition-colors"
                title="View on Solscan"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            
            {/* Expand/Collapse */}
            <button className="p-2 text-zinc-400 hover:text-white transition-colors">
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile: Key Metrics */}
        {showHiddenData && local && (
          <div className="md:hidden flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800">
            <div>
              <p className="text-[10px] text-zinc-500">Price</p>
              <p className="text-sm font-mono text-white">${price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500">Size</p>
              <p className="text-sm font-mono text-white">{orderSize.toFixed(4)}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500">Value</p>
              <p className="text-sm font-mono text-emerald-400">${totalValue.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-zinc-800 p-4 space-y-4 bg-zinc-950/50">
          {/* Execution Details (if filled) */}
          {order.filled && local && (
            <div className="space-y-3">
              {/* Partial Fill Warning */}
              {local.executedSize && local.executedSize < (local.size * 0.99) && (
                <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-amber-400">
                    Partial fill: {(local.executedSize).toFixed(4)} of {local.size.toFixed(4)} SOL filled ({((local.executedSize / local.size) * 100).toFixed(0)}%)
                    • Remaining {(local.size - local.executedSize).toFixed(4)} SOL still in order book
                  </span>
                </div>
              )}
              {/* Summary Row */}
              <div className={cn(
                "grid grid-cols-2 md:grid-cols-5 gap-3 p-3",
                local.executedSize && local.executedSize < (local.size * 0.99)
                  ? "bg-amber-500/5 border border-amber-500/20"
                  : "bg-emerald-500/5 border border-emerald-500/20"
              )}>
                <div>
                  <p className={cn(
                    "text-[10px] mb-0.5",
                    local.executedSize && local.executedSize < (local.size * 0.99) ? "text-amber-500/70" : "text-emerald-500/70"
                  )}>Executed Price</p>
                  <p className={cn(
                    "text-sm font-mono",
                    local.executedSize && local.executedSize < (local.size * 0.99) ? "text-amber-400" : "text-emerald-400"
                  )}>
                    ${(local.executedPrice || local.price).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className={cn(
                    "text-[10px] mb-0.5",
                    local.executedSize && local.executedSize < (local.size * 0.99) ? "text-amber-500/70" : "text-emerald-500/70"
                  )}>Filled Size</p>
                  <p className={cn(
                    "text-sm font-mono",
                    local.executedSize && local.executedSize < (local.size * 0.99) ? "text-amber-400" : "text-emerald-400"
                  )}>
                    {(local.executedSize || local.size).toFixed(4)} SOL
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-500/70 mb-0.5">Slippage</p>
                  <p className={cn(
                    "text-sm font-mono",
                    slippage > 0 ? "text-rose-400" : slippage < 0 ? "text-emerald-400" : "text-zinc-400"
                  )}>
                    {slippage > 0 ? '+' : ''}{slippage.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-500/70 mb-0.5">
                    Fee ({feeRate}%)
                  </p>
                  <p className="text-sm font-mono text-zinc-400">${fee.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-500/70 mb-0.5">
                    {isBuy ? 'Net Cost' : 'Net Received'}
                  </p>
                  <p className="text-sm font-mono text-white">
                    ${isBuy ? (totalValue + fee).toFixed(2) : (totalValue - fee).toFixed(2)}
                  </p>
                </div>
              </div>
              
              {/* Fill History (for multi-order sweeps) */}
              {local.fillHistory && local.fillHistory.length > 1 && (
                <div className="p-3 bg-zinc-800/30">
                  <p className="text-[10px] text-zinc-400 mb-2 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Filled via {local.fillHistory.length} orders (sweep)
                  </p>
                  <div className="space-y-1.5">
                    {local.fillHistory.map((fill: FillRecord, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[9px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-zinc-300">
                            {fill.size.toFixed(4)} SOL @ ${fill.price.toFixed(2)}
                          </span>
                        </div>
                        <a
                          href={EXPLORER.tx(fill.txSignature)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <span className="font-mono">{fill.txSignature.slice(0, 8)}...</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transaction History */}
          <div>
            <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
              <Hash className="w-3 h-3" />
              Transactions
            </p>
            <div className="space-y-2">
              {/* Placement TX */}
              <div className="flex items-center justify-between p-2 bg-zinc-800/30 ">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-[10px] font-bold">1</div>
                  <span className="text-xs text-zinc-300">Order Placed</span>
                </div>
                {local?.placementTx ? (
                  <a
                    href={EXPLORER.tx(local.placementTx)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-[10px] hover:bg-emerald-500/20 transition-all"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {local.placementTx.slice(0, 8)}...
                  </a>
                ) : (
                  <span className="text-[10px] text-zinc-500">Pending</span>
                )}
              </div>

              {/* Order Account */}
              <div className="flex items-center justify-between p-2 bg-zinc-800/30 ">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 text-[10px] font-bold">2</div>
                  <span className="text-xs text-zinc-300">Order Account</span>
                </div>
                <a
                  href={EXPLORER.address(order.publicKey.toBase58())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2 py-1 bg-sky-500/10 text-sky-400 rounded text-[10px] hover:bg-sky-500/20 transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  {order.publicKey.toBase58().slice(0, 8)}...
                </a>
              </div>

              {/* Match TX (if filled) */}
              {order.filled && (
                <div className="flex items-center justify-between p-2 bg-zinc-800/30 ">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                      local?.matchTx ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                    )}>3</div>
                    <span className="text-xs text-zinc-300">Order Matched</span>
                  </div>
                  {local?.matchTx ? (
                    <a
                      href={EXPLORER.tx(local.matchTx)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-[10px] hover:bg-emerald-500/20 transition-all"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {local.matchTx.slice(0, 8)}...
                    </a>
                  ) : (
                    <span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded text-[10px]">
                      DEMO
                    </span>
                  )}
                </div>
              )}

              {/* Settlement (if filled) */}
              {order.filled && (
                <div className="flex items-center justify-between p-2 bg-zinc-800/30 ">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                      local?.settlementTx ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                    )}>4</div>
                    <span className="text-xs text-zinc-300">Settlement</span>
                  </div>
                  {local?.settlementTx ? (
                    <a
                      href={EXPLORER.tx(local.settlementTx)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-[10px] hover:bg-emerald-500/20 transition-all"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {local.settlementTx.slice(0, 8)}...
                    </a>
                  ) : (
                    <span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded text-[10px]">
                      {local?.isSimulatedMatch ? 'DEMO' : 'Pending'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Technical Details */}
          <div>
            <p className="text-xs text-zinc-500 mb-2">Technical Details</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-zinc-800/30  p-2">
                <p className="text-[10px] text-zinc-500 mb-0.5">ZK Commitment</p>
                <p className="text-[10px] font-mono text-zinc-400 truncate">
                  {Array.from(order.commitmentHash.slice(0, 10)).map(b => b.toString(16).padStart(2, '0')).join('')}...
                </p>
              </div>
              <div className="bg-zinc-800/30  p-2">
                <p className="text-[10px] text-zinc-500 mb-0.5">Order Type</p>
                <p className={cn(
                  "text-[10px] font-medium",
                  local?.orderType === 'market' ? "text-amber-400" : "text-sky-400"
                )}>
                  {local?.orderType === 'market' ? 'MARKET' : 'LIMIT'}
                </p>
              </div>
              {order.filled && local?.counterparty && (
                <div className="bg-zinc-800/30  p-2">
                  <p className="text-[10px] text-zinc-500 mb-0.5">Counterparty</p>
                  <p className="text-[10px] font-mono text-zinc-400">
                    {local.counterparty}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {!order.filled && (
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <button
                onClick={onRequestMatch}
                disabled={isMatching}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-500/10 text-sky-400 border border-sky-500/30  hover:bg-sky-500/20 transition-all text-sm"
              >
                {isMatching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {matchProgress === 'matching' && 'Finding match...'}
                    {matchProgress === 'revealing' && 'Verifying...'}
                    {matchProgress === 'settling' && 'Settling...'}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Request Match
                  </>
                )}
              </button>
              <button
                onClick={onCancel}
                disabled={isCancelling}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 text-rose-400 border border-rose-500/30  hover:bg-rose-500/20 transition-all text-sm"
              >
                {isCancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Cancel
              </button>
            </div>
          )}

          {/* Filled Badge */}
          {order.filled && (
            <div className={cn(
              "p-3  text-center",
              local?.isSimulatedMatch 
                ? "bg-amber-500/5 border border-amber-500/20"
                : local?.executedSize && local.executedSize < (local.size * 0.99)
                  ? "bg-amber-500/5 border border-amber-500/20"
                  : "bg-emerald-500/5 border border-emerald-500/20"
            )}>
              <div className={cn(
                "flex items-center justify-center gap-2",
                local?.isSimulatedMatch 
                  ? "text-amber-400" 
                  : local?.executedSize && local.executedSize < (local.size * 0.99)
                    ? "text-amber-400"
                    : "text-emerald-400"
              )}>
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {local?.isSimulatedMatch 
                    ? 'Demo Match Complete' 
                    : local?.executedSize && local.executedSize < (local.size * 0.99)
                      ? `Partially Filled (${((local.executedSize / local.size) * 100).toFixed(0)}%) - ${(local.size - local.executedSize).toFixed(4)} SOL remaining`
                      : 'Order Filled Successfully'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MyOrders() {
  const { publicKey, wallet } = useWallet();
  const { connection } = useConnection();
  const [orders, setOrders] = useState<(OnChainOrder & { localData?: LocalOrderData })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showHiddenData, setShowHiddenData] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [matchingOrders, setMatchingOrders] = useState<Set<string>>(new Set());
  const [matchProgress, setMatchProgress] = useState<Record<string, string>>({});
  const [recentMatches, setRecentMatches] = useState<MatchEvent[]>([]);
  const [matcherOnline, setMatcherOnline] = useState(false);

  const toggleExpanded = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // Get local order data from localStorage
  const getLocalOrders = useCallback((): LocalOrderData[] => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('aurorazk_orders') || '[]');
    } catch {
      return [];
    }
  }, []);

  // Fetch orders from chain and merge with local data
  const fetchOrders = useCallback(async () => {
    if (!publicKey || !wallet?.adapter || !connection) {
      setLoading(false);
      return;
    }

    try {
      const provider = new AnchorProvider(
        connection,
        wallet.adapter as any,
        { commitment: 'confirmed' }
      );
      const program = getProgram(provider);

      const allOrders = await fetchAllOrders(program);
      // Filter to only MY orders that are NOT cancelled
      const myOrders = allOrders.filter(
        (order: any) => order.owner.toBase58() === publicKey.toBase58() && !order.cancelled
      );

      const localOrders = getLocalOrders();

      const mergedOrders = myOrders.map((onChainOrder: any) => {
        const localData = localOrders.find(
          (local: any) => local.orderId === onChainOrder.publicKey.toBase58()
        );
        const isLocallyFilled = localData?.filled || false;
        
        return {
          ...onChainOrder,
          filled: onChainOrder.filled || isLocallyFilled,
          localData
        };
      });

      mergedOrders.sort((a: any, b: any) => b.timestamp - a.timestamp);
      setOrders(mergedOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [publicKey, wallet, connection, getLocalOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Subscribe to matcher events
  // Queue for atomic processing of match events (prevents race conditions)
  const matchQueueRef = useRef<MatchEvent[]>([]);
  const processingRef = useRef(false);
  const processTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Process all queued matches atomically
  const processMatchQueue = useCallback(() => {
    if (processingRef.current || matchQueueRef.current.length === 0) return;
    processingRef.current = true;
    
    const matchesToProcess = [...matchQueueRef.current];
    matchQueueRef.current = [];
    
    console.log(`🔄 Processing ${matchesToProcess.length} match event(s) atomically`);
    
    // Read localStorage ONCE at the start
    const existingOrders: LocalOrderData[] = JSON.parse(localStorage.getItem('aurorazk_orders') || '[]');
    
    // Accumulate all fills per order
    const fillsByOrder = new Map<string, { 
      totalSize: number; 
      matches: MatchEvent[];
      lastPrice: number;
      slippage: number;
    }>();
    
    matchesToProcess.forEach(match => {
      [match.buyOrderId, match.sellOrderId].forEach(orderId => {
        // Look up order from localStorage (more reliable than React state)
        const localOrder = existingOrders.find(o => o.orderId === orderId);
        if (localOrder) {
          const existing = fillsByOrder.get(orderId) || { 
            totalSize: 0, matches: [], lastPrice: match.price, slippage: 0
          };
          existing.totalSize += match.size;
          existing.matches.push(match);
          existing.lastPrice = match.price;
          existing.slippage = ((match.price - localOrder.price) / localOrder.price) * 100;
          fillsByOrder.set(orderId, existing);
        }
      });
    });
    
    // Update orders with accumulated fills
    const updatedOrders = existingOrders.map((o: LocalOrderData) => {
      const fills = fillsByOrder.get(o.orderId);
      if (!fills) return o;
      
      const previousFilledSize = o.executedSize || 0;
      const newFilledSize = previousFilledSize + fills.totalSize;
      const isFullyFilled = newFilledSize >= (o.size * 0.999); // 0.1% tolerance
      const fillCount = (o.fillCount || 0) + fills.matches.length;
      
      console.log(`   📦 ${o.orderId?.slice(0, 8) || 'unknown'}...: ${previousFilledSize.toFixed(4)} + ${fills.totalSize.toFixed(4)} = ${newFilledSize.toFixed(4)} SOL (${fillCount} fills)`);
      
      // Build fill history for display
      const fillHistory = [...(o.fillHistory || [])];
      fills.matches.forEach(m => fillHistory.push({
        size: m.size, price: m.price, txSignature: m.txSignature, timestamp: m.timestamp
      }));
      
      return { 
        ...o, 
        filled: isFullyFilled,
        matchTx: fills.matches[fills.matches.length - 1].txSignature,
        isSimulatedMatch: false, 
        filledAt: fills.matches[fills.matches.length - 1].timestamp,
        executedPrice: fills.lastPrice,
        executedSize: newFilledSize,
        slippage: fills.slippage,
        fee: FEE_CONFIG.calculateFee(),
        fillCount,
        fillHistory,
      };
    });
    
    // Write localStorage ONCE at the end
    localStorage.setItem('aurorazk_orders', JSON.stringify(updatedOrders));
    
    // Update UI state
    setRecentMatches(prev => [...matchesToProcess, ...prev].slice(0, 5));
    fillsByOrder.forEach((fills, orderId) => {
      setMatchProgress(prev => ({ ...prev, [orderId]: 'filled' }));
    });
    
    setTimeout(() => {
      fetchOrders();
      window.dispatchEvent(new CustomEvent('aurorazk_balance_update'));
    }, 500);
    
    processingRef.current = false;
  }, [fetchOrders, publicKey]); // Removed `orders` - using localStorage directly now

  useEffect(() => {
    const checkMatcher = async () => {
      const available = await matcherClient.isAvailable();
      setMatcherOnline(available);
      if (available) {
        matcherClient.connect();
      }
    };
    
    checkMatcher();
    
    const unsubMatch = matcherClient.onMatch((match: MatchEvent) => {
      console.log('🎯 Match event received:', match);
      
      const involvedOrderIds = [match.buyOrderId, match.sellOrderId];
      
      // Check BOTH React state AND localStorage for our orders
      // (localStorage is updated immediately when order is placed,
      //  but React state may be stale until fetchOrders runs)
      const localOrders: LocalOrderData[] = JSON.parse(localStorage.getItem('aurorazk_orders') || '[]');
      const myOrderIds = localOrders.map(o => o.orderId);
      
      const isMyOrder = involvedOrderIds.some(id => myOrderIds.includes(id));
      
      if (isMyOrder) {
        console.log('🎯 Match involves our order(s)!');
        // Queue for atomic processing (prevents race conditions with rapid events)
        matchQueueRef.current.push(match);
        
        // Debounce: wait 300ms for more events before processing
        if (processTimeoutRef.current) clearTimeout(processTimeoutRef.current);
        processTimeoutRef.current = setTimeout(() => processMatchQueue(), 300);
      }
    });
    
    return () => {
      unsubMatch();
      if (processTimeoutRef.current) clearTimeout(processTimeoutRef.current);
    };
  }, [orders, processMatchQueue]);

  const handleRequestMatch = async (orderId: string) => {
    const order = orders.find(o => o.publicKey.toBase58() === orderId);
    if (!order || !order.localData || !publicKey) return;

    setMatchingOrders(prev => new Set(prev).add(orderId));
    setMatchProgress(prev => ({ ...prev, [orderId]: 'matching' }));

    try {
      // FIRST: Ensure order is in matcher using DIRECT endpoint (no encryption)
      // This bypasses potential encryption issues
      console.log('📤 Ensuring order is in matcher:', orderId.slice(0, 16));
      const { price, size, side, orderType } = order.localData;
      
      const orderData = {
        price,
        size,
        side,
        orderType: orderType || 'limit',
        orderId,
        owner: publicKey.toBase58(),
        timestamp: Date.now(),
      };
      
      // Use DIRECT endpoint (bypasses encryption)
      const directResponse = await fetch('http://localhost:3001/direct-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      const submitResult = await directResponse.json();
      
      if (!submitResult.success) {
        console.warn('Failed to ensure order in matcher:', submitResult.error);
      } else {
        console.log('✅ Order confirmed in matcher', submitResult.alreadyExists ? '(already existed)' : '(newly added)');
      }
      
      // THEN: Trigger the match - include orderData as fallback
      const response = await fetch('http://localhost:3001/trigger-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderId,
          orderData: {
            price,
            size,
            side,
            orderType: orderType || 'limit',
            owner: publicKey.toBase58(),
            nonce: order.localData.nonce || [],
          }
        }),
      });
      
      const result = await response.json();
      
      if (result.success && result.txSignature) {
        // Real match succeeded!
        setMatchProgress(prev => ({ ...prev, [orderId]: 'revealing' }));
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMatchProgress(prev => ({ ...prev, [orderId]: 'settling' }));
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { price, size, side } = order.localData;
        
        const existingOrders = JSON.parse(localStorage.getItem('aurorazk_orders') || '[]');
        const updatedOrders = existingOrders.map((o: LocalOrderData) => {
          if (o.orderId === orderId) {
            return { 
              ...o, 
              filled: true, 
              isSimulatedMatch: false, // REAL match!
              filledAt: Date.now(),
              matchTx: result.txSignature,
              settlementTx: result.txSignature,
              executedPrice: result.executionPrice || price,
              executedSize: result.executedSize || size,
              slippage: 0,
              fee: FEE_CONFIG.calculateFee(),
            };
          }
          return o;
        });
        localStorage.setItem('aurorazk_orders', JSON.stringify(updatedOrders));
        
        setMatchProgress(prev => ({ ...prev, [orderId]: 'filled' }));
        setMatchingOrders(prev => {
          const newSet = new Set(prev);
          newSet.delete(orderId);
          return newSet;
        });
        fetchOrders();
        return;
      } else {
        // Match failed - show error and fallback info
        console.warn('Match failed:', result.error);
        console.log('Details:', result);
        
        // Show user-friendly error
        alert(`Match not possible: ${result.error}\n\n${result.hint || ''}\n\nYour order: $${order.localData.price}\nBest counter: $${result.bestCounterPrice || 'N/A'}\nSpread: $${result.spread || 'N/A'}`);
        
        setMatchingOrders(prev => {
          const newSet = new Set(prev);
          newSet.delete(orderId);
          return newSet;
        });
        setMatchProgress(prev => ({ ...prev, [orderId]: 'placed' }));
        return;
      }
    } catch (error) {
      console.error('Match request failed:', error);
      // Fallback to demo if matcher is unavailable
    }
    
    // FALLBACK: Demo match (only if matcher is offline)
    console.warn('Falling back to demo match (matcher unavailable)');
    
    const matchTime = 3000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, matchTime));
    setMatchProgress(prev => ({ ...prev, [orderId]: 'revealing' }));
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setMatchProgress(prev => ({ ...prev, [orderId]: 'settling' }));
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { price, size, side } = order.localData;
    
    const existingOrders = JSON.parse(localStorage.getItem('aurorazk_orders') || '[]');
    const updatedOrders = existingOrders.map((o: LocalOrderData) => {
      if (o.orderId === orderId) {
        return { 
          ...o, 
          filled: true, 
          isSimulatedMatch: true, // Demo match
          filledAt: Date.now(),
          executedPrice: price,
          executedSize: size,
          slippage: 0,
          fee: FEE_CONFIG.calculateFee(),
          counterparty: 'DEMO...DEMO',
        };
      }
      return o;
    });
    localStorage.setItem('aurorazk_orders', JSON.stringify(updatedOrders));
    
    setMatchProgress(prev => ({ ...prev, [orderId]: 'filled' }));
    
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'aurorazk_deposits',
      newValue: Date.now().toString()
    }));
    
    setTimeout(() => {
      setMatchingOrders(prev => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      fetchOrders();
    }, 2000);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleCancel = async (orderPubkey: PublicKey) => {
    if (!publicKey || !wallet?.adapter) return;

    setCancellingId(orderPubkey.toBase58());
    try {
      const provider = new AnchorProvider(
        connection,
        wallet.adapter as any,
        { commitment: 'confirmed' }
      );
      const program = getProgram(provider);
      await cancelOrder(program, publicKey, orderPubkey);
      await fetchOrders();
    } catch (error) {
      console.error('Failed to cancel order:', error);
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
      </div>
    );
  }

  if (!publicKey) {
    return (
      <div className="text-center py-20">
        <Lock className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <p className="text-zinc-400">Connect your wallet to view orders</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white">My Orders</h2>
          <div className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px]",
            matcherOnline 
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-amber-500/10 text-amber-400"
          )}>
            <Radio className={cn("w-3 h-3", matcherOnline && "animate-pulse")} />
            {matcherOnline ? 'Live' : 'Offline'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHiddenData(!showHiddenData)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5  text-xs transition-all",
              showHiddenData 
                ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                : "bg-zinc-800 text-zinc-400 border border-zinc-700"
            )}
          >
            {showHiddenData ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {showHiddenData ? 'Visible' : 'Hidden'}
          </button>
          <button
            onClick={() => {
              if (confirm('Clear all local order history? This cannot be undone.')) {
                localStorage.removeItem('aurorazk_orders');
                setOrders([]);
              }
            }}
            className="p-2 bg-zinc-800 text-zinc-400 border border-zinc-700  hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all"
            title="Clear local order history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-zinc-800 text-zinc-300 border border-zinc-700  hover:bg-zinc-700 transition-all"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Recent Matches Banner */}
      {recentMatches.length > 0 && (
        <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 ">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-medium">Recent Match</span>
            <a
              href={EXPLORER.tx(recentMatches[0].txSignature)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
            >
              <ExternalLink className="w-3 h-3" />
              View
            </a>
          </div>
          <p className="text-sm text-white mt-1">
            {recentMatches[0].size.toFixed(4)} SOL @ ${recentMatches[0].price.toFixed(2)}
          </p>
        </div>
      )}

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800 ">
          <ShoppingCart className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">No orders yet</p>
          <p className="text-zinc-500 text-xs mt-1">Place your first private order</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard
              key={order.publicKey.toBase58()}
              order={order}
              showHiddenData={showHiddenData}
              isExpanded={expandedOrders.has(order.publicKey.toBase58())}
              onToggleExpand={() => toggleExpanded(order.publicKey.toBase58())}
              onCancel={() => handleCancel(order.publicKey)}
              onRequestMatch={() => handleRequestMatch(order.publicKey.toBase58())}
              isMatching={matchingOrders.has(order.publicKey.toBase58())}
              matchProgress={matchProgress[order.publicKey.toBase58()] || 'placed'}
              isCancelling={cancellingId === order.publicKey.toBase58()}
            />
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {orders.length > 0 && (
        <div className="grid grid-cols-3 gap-3 p-3 bg-zinc-900/50 border border-zinc-800  text-center">
          <div>
            <p className="text-lg font-bold text-white">{orders.length}</p>
            <p className="text-[10px] text-zinc-500">Total</p>
          </div>
          <div>
            <p className="text-lg font-bold text-emerald-400">
              {orders.filter(o => o.filled).length}
            </p>
            <p className="text-[10px] text-zinc-500">Filled</p>
          </div>
          <div>
            <p className="text-lg font-bold text-amber-400">
              {orders.filter(o => !o.filled).length}
            </p>
            <p className="text-[10px] text-zinc-500">Open</p>
          </div>
        </div>
      )}
    </div>
  );
}
