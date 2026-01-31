'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { getProgram, fetchAllOrders, fetchOrderBook, orderBookExists } from '@/lib/program';
import { cn } from '@/lib/utils';
import { 
  EyeOff, 
  Clock, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Mountain,
  RefreshCw,
  Loader2,
  Lock,
  BarChart3,
  Users
} from 'lucide-react';

interface DarkOrder {
  id: string;
  commitmentPreview: string;
  isBuy: boolean;
  timestamp: number;
  filled: boolean;
  isOwn: boolean;
}

interface OrderBookStats {
  totalOrders: number;
  totalFilled: number;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() / 1000) - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Price tier component - shows interest without revealing prices
function PriceTier({ 
  label, 
  orderCount, 
  maxOrders, 
  isBuy 
}: { 
  label: string; 
  orderCount: number; 
  maxOrders: number;
  isBuy: boolean;
}) {
  const percentage = maxOrders > 0 ? (orderCount / maxOrders) * 100 : 0;
  
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-[10px] text-zinc-500 w-16 text-right font-mono uppercase">{label}</span>
      <div className="flex-1 h-5 bg-zinc-800/50 relative overflow-hidden">
        <div 
          className={cn(
            "absolute inset-y-0 transition-all duration-500",
            isBuy 
              ? "left-0 bg-gradient-to-r from-emerald-500/40 to-emerald-500/10" 
              : "right-0 bg-gradient-to-l from-rose-500/40 to-rose-500/10"
          )}
          style={{ width: `${Math.max(percentage, 5)}%` }}
        />
        {orderCount > 0 && (
          <div className={cn(
            "absolute inset-y-0 flex items-center px-2",
            isBuy ? "left-0" : "right-0"
          )}>
            <span className={cn(
              "text-[10px] font-medium",
              isBuy ? "text-emerald-400" : "text-rose-400"
            )}>
              {orderCount} hidden
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function DarkOrderBook() {
  const { publicKey, wallet } = useWallet();
  const { connection } = useConnection();
  const [orders, setOrders] = useState<DarkOrder[]>([]);
  const [stats, setStats] = useState<OrderBookStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'depth' | 'cards'>('depth');
  const [orderBookReady, setOrderBookReady] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!connection) {
      setLoading(false);
      return;
    }

    try {
      const exists = await orderBookExists(connection);
      setOrderBookReady(exists);

      if (!exists) {
        setOrders([]);
        setStats(null);
        setLoading(false);
        return;
      }

      const readonlyWallet = wallet?.adapter ?? {
        publicKey: new PublicKey('11111111111111111111111111111111'),
        signTransaction: async (tx: any) => tx,
        signAllTransactions: async (txs: any[]) => txs,
      };
      const provider = new AnchorProvider(
        connection,
        readonlyWallet as any,
        { commitment: 'confirmed' }
      );
      const program = getProgram(provider);

      // Fetch stats (may return null if accessor not found)
      try {
        const orderBookData = await fetchOrderBook(program);
        if (orderBookData) {
          setStats({
            totalOrders: orderBookData.totalOrders,
            totalFilled: orderBookData.totalFilled,
          });
        }
      } catch (statsErr) {
        console.warn('Could not fetch order book stats:', statsErr);
      }

      // Fetch all orders
      const allOrders = await fetchAllOrders(program);

      const darkOrders: DarkOrder[] = allOrders.map((order: any) => ({
        id: order.publicKey.toBase58(),
        commitmentPreview: Buffer.from(order.commitmentHash).toString('hex').slice(0, 8),
        isBuy: order.isBuy,
        timestamp: order.timestamp,
        filled: order.filled,
        isOwn: publicKey ? order.owner.equals(publicKey) : false,
      }));

      // Sort by timestamp, newest first
      darkOrders.sort((a, b) => b.timestamp - a.timestamp);

      setOrders(darkOrders);
      
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [connection, wallet?.adapter, publicKey]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Listen for trade completions and order updates to refresh order book
  useEffect(() => {
    const handleUpdate = () => {
      fetchOrders();
    };
    
    window.addEventListener('aurorazk_balance_update', handleUpdate);
    window.addEventListener('aurorazk_order_update', handleUpdate);
    return () => {
      window.removeEventListener('aurorazk_balance_update', handleUpdate);
      window.removeEventListener('aurorazk_order_update', handleUpdate);
    };
  }, [fetchOrders]);

  const buyOrders = orders.filter(o => o.isBuy && !o.filled);
  const sellOrders = orders.filter(o => !o.isBuy && !o.filled);
  const filledOrders = orders.filter(o => o.filled);
  const maxOrders = Math.max(buyOrders.length, sellOrders.length, 1);

  // Simulate price tiers (in a real implementation, this would be based on 
  // time buckets or other privacy-preserving categorizations)
  const buyTiers = [
    { label: '< 1 min', count: buyOrders.filter(o => (Date.now()/1000 - o.timestamp) < 60).length },
    { label: '1-5 min', count: buyOrders.filter(o => { const age = Date.now()/1000 - o.timestamp; return age >= 60 && age < 300; }).length },
    { label: '5-30 min', count: buyOrders.filter(o => { const age = Date.now()/1000 - o.timestamp; return age >= 300 && age < 1800; }).length },
    { label: '> 30 min', count: buyOrders.filter(o => (Date.now()/1000 - o.timestamp) >= 1800).length },
  ];
  
  const sellTiers = [
    { label: '< 1 min', count: sellOrders.filter(o => (Date.now()/1000 - o.timestamp) < 60).length },
    { label: '1-5 min', count: sellOrders.filter(o => { const age = Date.now()/1000 - o.timestamp; return age >= 60 && age < 300; }).length },
    { label: '5-30 min', count: sellOrders.filter(o => { const age = Date.now()/1000 - o.timestamp; return age >= 300 && age < 1800; }).length },
    { label: '> 30 min', count: sellOrders.filter(o => (Date.now()/1000 - o.timestamp) >= 1800).length },
  ];

  const maxTierCount = Math.max(
    ...buyTiers.map(t => t.count),
    ...sellTiers.map(t => t.count),
    1
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-sky-400" />
            <span className="text-sm uppercase tracking-widest text-zinc-100">Dark Order Book</span>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex bg-zinc-800 p-0.5">
            <button
              onClick={() => setViewMode('depth')}
              className={cn(
                "px-3 py-1 text-[10px] uppercase tracking-wider font-medium transition-colors",
                viewMode === 'depth' 
                  ? "bg-sky-500 text-white" 
                  : "text-zinc-400 hover:text-white"
              )}
            >
              Depth
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                "px-3 py-1 text-[10px] uppercase tracking-wider font-medium transition-colors",
                viewMode === 'cards' 
                  ? "bg-sky-500 text-white" 
                  : "text-zinc-400 hover:text-white"
              )}
            >
              Orders
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {stats && (
            <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
              {stats.totalOrders} placed • {stats.totalFilled} filled
            </div>
          )}
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-zinc-800"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Order Book Not Initialized */}
      {!orderBookReady && !loading && (
        <div className="p-8 text-center">
          <Mountain className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm uppercase tracking-wider">Order Book Not Initialized</p>
          <p className="text-zinc-500 text-xs mt-1">Place the first order to initialize</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
        </div>
      )}

      {/* Main Content */}
      {orderBookReady && !loading && (
        <>
          {viewMode === 'depth' ? (
            /* Depth View - Interest Bars by Time */
            <div className="p-4">
              {/* Activity Summary */}
              <div className="border border-zinc-800 mb-4">
                <div className="grid grid-cols-2 divide-x divide-zinc-800">
                  <div className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-emerald-400 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-bold text-xl font-mono">{buyOrders.length}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Buy Orders</p>
                  </div>
                  <div className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-rose-400 mb-1">
                      <TrendingDown className="w-4 h-4" />
                      <span className="font-bold text-xl font-mono">{sellOrders.length}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Sell Orders</p>
                  </div>
                </div>
              </div>

              {/* Depth Chart */}
              <div className="grid grid-cols-2 gap-6">
                {/* Buy Side */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider">Buy Interest</span>
                  </div>
                  <div className="space-y-0.5">
                    {buyTiers.map((tier, i) => (
                      <PriceTier 
                        key={i}
                        label={tier.label}
                        orderCount={tier.count}
                        maxOrders={maxTierCount}
                        isBuy={true}
                      />
                    ))}
                  </div>
                </div>

                {/* Sell Side */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider">Sell Interest</span>
                  </div>
                  <div className="space-y-0.5">
                    {sellTiers.map((tier, i) => (
                      <PriceTier 
                        key={i}
                        label={tier.label}
                        orderCount={tier.count}
                        maxOrders={maxTierCount}
                        isBuy={false}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* No Orders */}
              {orders.filter(o => !o.filled).length === 0 && (
                <div className="text-center py-8 mt-4 border-t border-zinc-800">
                  <Activity className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-zinc-500 text-sm">No active orders</p>
                </div>
              )}
            </div>
          ) : (
            /* Cards View - Individual Order Cards */
            <div className="p-4">
              {orders.filter(o => !o.filled).length === 0 ? (
                <div className="text-center py-12">
                  <Mountain className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400 text-sm uppercase tracking-wider">No orders yet</p>
                  <p className="text-zinc-500 text-xs mt-1">Be the first to place a dark order</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h4 className="text-xs font-medium text-zinc-400 flex items-center gap-2 uppercase tracking-wider">
                    <Activity className="w-3.5 h-3.5" />
                    Active Orders ({buyOrders.length + sellOrders.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {[...buyOrders, ...sellOrders]
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .slice(0, 16)
                      .map(order => (
                        <div
                          key={order.id}
                          className={cn(
                            "p-3 border transition-all",
                            order.isOwn 
                              ? "bg-sky-500/10 border-sky-500/30" 
                              : "bg-zinc-800/50 border-zinc-700",
                            "hover:border-zinc-600"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider",
                              order.isBuy 
                                ? "bg-emerald-500/20 text-emerald-400" 
                                : "bg-rose-500/20 text-rose-400"
                            )}>
                              {order.isBuy ? 'BUY' : 'SELL'}
                            </span>
                            {order.isOwn && (
                              <span className="text-[10px] text-sky-400 font-medium">YOU</span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 mb-2">
                            <Lock className="w-3 h-3 text-zinc-500" />
                            <code className="text-xs text-zinc-400 font-mono">
                              {order.commitmentPreview}...
                            </code>
                          </div>
                          
                          <div className="flex items-center gap-1 text-zinc-500">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px]">{timeAgo(order.timestamp)}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                  
                  {buyOrders.length + sellOrders.length > 16 && (
                    <p className="text-center text-[10px] text-zinc-500 mt-3 uppercase tracking-wider">
                      +{buyOrders.length + sellOrders.length - 16} more hidden orders
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Filled Orders */}
          {filledOrders.length > 0 && (
            <div className="p-4 border-t border-zinc-800">
              <h4 className="text-xs font-medium text-zinc-300 mb-3 flex items-center gap-2 uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Recently Matched ({filledOrders.length})
              </h4>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {filledOrders.slice(0, 5).map(order => (
                  <div
                    key={order.id}
                    className={cn(
                      "flex-shrink-0 px-3 py-2 border",
                      order.isBuy 
                        ? "bg-emerald-500/10 border-emerald-500/20" 
                        : "bg-rose-500/10 border-rose-500/20"
                    )}
                  >
                    <span className={cn(
                      "text-[10px] uppercase tracking-wider",
                      order.isBuy ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {order.isBuy ? 'Buy' : 'Sell'} • {timeAgo(order.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Privacy Footer */}
      <div className="p-3 bg-zinc-800/30 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-500 text-center flex items-center justify-center gap-1.5 uppercase tracking-wider">
          <Lock className="w-3 h-3 text-sky-400" />
          <span>Zero-Knowledge Protected</span>
          <span className="text-zinc-600">•</span>
          <span>Order details never exposed, not even to the matcher</span>
        </p>
      </div>
    </div>
  );
}
