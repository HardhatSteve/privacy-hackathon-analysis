'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider } from '@coral-xyz/anchor';
import { cn, truncatePubkey } from '@/lib/utils';
import { getProgram, fetchAllOrders, fetchOrderBook, OrderAccount } from '@/lib/program';
import { Lock, ArrowUpRight, ArrowDownRight, Eye, EyeOff, RefreshCw, Loader2 } from 'lucide-react';

interface DisplayOrder {
  id: string;
  side: 'buy' | 'sell';
  priceHidden: boolean;
  sizeHidden: boolean;
  displayPrice?: number;
  displaySize?: number;
  timestamp: number;
  owner: string;
  filled: boolean;
}

// Convert on-chain orders to display format
function convertToDisplayOrders(orders: OrderAccount[]): DisplayOrder[] {
  return orders.map((order, i) => ({
    id: order.publicKey.toBase58(),
    side: order.isBuy ? 'buy' : 'sell',
    priceHidden: true, // All orders have hidden prices until reveal
    sizeHidden: true,
    timestamp: order.timestamp * 1000,
    owner: truncatePubkey(order.owner.toBase58()),
    filled: order.filled,
  }));
}

// Generate mock orders for demo when no real orders exist
function generateMockOrders(count: number): DisplayOrder[] {
  const orders: DisplayOrder[] = [];
  const basePrice = 100;
  
  for (let i = 0; i < count; i++) {
    const isBuy = Math.random() > 0.5;
    orders.push({
      id: `mock-order-${i}`,
      side: isBuy ? 'buy' : 'sell',
      priceHidden: Math.random() > 0.3,
      sizeHidden: Math.random() > 0.3,
      displayPrice: Math.random() > 0.7 ? basePrice + (Math.random() - 0.5) * 10 : undefined,
      displaySize: Math.random() > 0.7 ? Math.random() * 100 : undefined,
      timestamp: Date.now() - Math.random() * 3600000,
      owner: `${Math.random().toString(36).substring(7)}...${Math.random().toString(36).substring(7)}`,
      filled: false,
    });
  }
  
  return orders;
}

export function OrderBook() {
  const { publicKey, wallet } = useWallet();
  const { connection } = useConnection();
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [useMock, setUseMock] = useState(true);
  
  // Fetch orders from program
  const fetchOrders = async () => {
    if (!wallet?.adapter || !publicKey || !connection) {
      // Use mock data when no wallet connected
      setOrders(generateMockOrders(20));
      setUseMock(true);
      return;
    }
    
    setLoading(true);
    try {
      const provider = new AnchorProvider(
        connection,
        wallet.adapter as any,
        { commitment: 'confirmed' }
      );
      const program = getProgram(provider);
      
      // Try to fetch real orders
      const [onChainOrders, orderBook] = await Promise.all([
        fetchAllOrders(program),
        fetchOrderBook(program)
      ]);
      
      if (onChainOrders.length > 0) {
        setOrders(convertToDisplayOrders(onChainOrders));
        setUseMock(false);
      } else {
        // Fall back to mock if no orders
        setOrders(generateMockOrders(20));
        setUseMock(true);
      }
      
      if (orderBook) {
        setTotalOrders(orderBook.totalOrders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      // Fall back to mock data
      setOrders(generateMockOrders(20));
      setUseMock(true);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchOrders();
  }, [publicKey, connection]);
  
  const buyOrders = orders.filter(o => o.side === 'buy' && !o.filled).slice(0, 10);
  const sellOrders = orders.filter(o => o.side === 'sell' && !o.filled).slice(0, 10);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Lock className="w-6 h-6 text-violet-400" />
            Dark Order Book
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            {useMock ? 'Demo mode - connect wallet to see real orders' : 'Live orders from devnet'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-all"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setShowHidden(!showHidden)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
              "border border-zinc-700 text-sm",
              showHidden ? "bg-violet-500/20 text-violet-400 border-violet-500/50" : "bg-zinc-800 text-zinc-400"
            )}
          >
            {showHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {showHidden ? 'Showing All' : 'Hidden Mode'}
          </button>
        </div>
      </div>
      
      {/* Order Book Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Buy Orders */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-emerald-500/10 border-b border-emerald-500/20">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <ArrowUpRight className="w-4 h-4" />
              Buy Orders ({buyOrders.length})
            </div>
          </div>
          
          <div className="p-2">
            {/* Column Headers */}
            <div className="grid grid-cols-3 gap-2 px-3 py-2 text-xs text-zinc-500 uppercase tracking-wide">
              <span>Price</span>
              <span className="text-center">Size</span>
              <span className="text-right">Time</span>
            </div>
            
            {/* Order Rows */}
            <div className="space-y-1">
              {buyOrders.length > 0 ? (
                buyOrders.map((order) => (
                  <OrderRow 
                    key={order.id} 
                    order={order} 
                    showHidden={showHidden}
                    accentColor="emerald"
                  />
                ))
              ) : (
                <div className="px-3 py-6 text-center text-zinc-500 text-sm">
                  No buy orders yet
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Sell Orders */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-rose-500/10 border-b border-rose-500/20">
            <div className="flex items-center gap-2 text-rose-400 font-semibold">
              <ArrowDownRight className="w-4 h-4" />
              Sell Orders ({sellOrders.length})
            </div>
          </div>
          
          <div className="p-2">
            {/* Column Headers */}
            <div className="grid grid-cols-3 gap-2 px-3 py-2 text-xs text-zinc-500 uppercase tracking-wide">
              <span>Price</span>
              <span className="text-center">Size</span>
              <span className="text-right">Time</span>
            </div>
            
            {/* Order Rows */}
            <div className="space-y-1">
              {sellOrders.length > 0 ? (
                sellOrders.map((order) => (
                  <OrderRow 
                    key={order.id} 
                    order={order} 
                    showHidden={showHidden}
                    accentColor="rose"
                  />
                ))
              ) : (
                <div className="px-3 py-6 text-center text-zinc-500 text-sm">
                  No sell orders yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Bar */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: useMock ? orders.length.toString() : totalOrders.toString() },
          { label: 'Hidden Orders', value: orders.filter(o => o.priceHidden).length.toString() },
          { label: 'Buy Volume', value: '◼◼◼ Hidden' },
          { label: 'Sell Volume', value: '◼◼◼ Hidden' },
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
            <div className="text-xs text-zinc-500 uppercase tracking-wide">{stat.label}</div>
            <div className="text-lg font-mono text-white mt-1">{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface OrderRowProps {
  order: DisplayOrder;
  showHidden: boolean;
  accentColor: 'emerald' | 'rose';
}

function OrderRow({ order, showHidden, accentColor }: OrderRowProps) {
  const colorClasses = accentColor === 'emerald' 
    ? 'text-emerald-400 bg-emerald-500/5'
    : 'text-rose-400 bg-rose-500/5';
  
  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };
  
  return (
    <div className={cn(
      "grid grid-cols-3 gap-2 px-3 py-2 rounded-lg",
      "hover:bg-zinc-800/50 transition-colors cursor-pointer",
      colorClasses
    )}>
      {/* Price */}
      <div className="font-mono text-sm">
        {order.priceHidden && !showHidden ? (
          <span className="flex items-center gap-1 text-zinc-500">
            <Lock className="w-3 h-3" />
            ●●●.●●
          </span>
        ) : (
          <span>${(order.displayPrice || 100).toFixed(2)}</span>
        )}
      </div>
      
      {/* Size */}
      <div className="font-mono text-sm text-center">
        {order.sizeHidden && !showHidden ? (
          <span className="text-zinc-500">●●●</span>
        ) : (
          <span>{(order.displaySize || 0).toFixed(2)}</span>
        )}
      </div>
      
      {/* Time */}
      <div className="text-xs text-zinc-500 text-right">
        {formatTime(order.timestamp)}
      </div>
    </div>
  );
}
