'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { DarkOrderBook } from '@/components/DarkOrderBook';
import { PlaceOrderForm } from '@/components/PlaceOrderForm';
import { DepositModal } from '@/components/DepositModal';
import { WithdrawModal } from '@/components/WithdrawModal';
import { TradingPairSelector } from '@/components/TradingPairSelector';
import { MarketStats } from '@/components/MarketStats';
import { ClientWalletButton } from '@/components/ClientWalletButton';
import { MyOrders } from '@/components/MyOrders';
import { PriceOracle } from '@/components/PriceOracle';
import { MatcherStatus, MatcherStatusBadge } from '@/components/MatcherStatus';
import { MarketInsights } from '@/components/MarketInsights';
import { IntegrationStatus } from '@/components/IntegrationStatus';
import { CompressionStatus } from '@/components/CompressionStatus';
import { priceOracle } from '@/lib/price-oracle';
import { cn } from '@/lib/utils';
import { 
  Mountain, 
  ArrowDownToLine, 
  ArrowUpFromLine,
  Lock,
  Zap,
  Eye,
  Github,
  ExternalLink,
  Activity
} from 'lucide-react';

export default function Home() {
  const { publicKey, connected } = useWallet();
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'trade' | 'orders' | 'network'>('trade');
  const [selectedPair, setSelectedPair] = useState('SOL/USDC');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [marketPrice, setMarketPrice] = useState<number | null>(null);

  // Subscribe to price oracle updates automatically
  useEffect(() => {
    const unsubscribe = priceOracle.subscribe(() => {
      const price = priceOracle.getSolUsdcPrice();
      if (price && !price.isStale) {
        setMarketPrice(price.price);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 relative">
      {/* Subtle Aurora Glow Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-sky-500/3 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-sky-400 flex items-center justify-center">
              <Mountain className="w-5 h-5 text-zinc-950" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">AURORAZK</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Dark Order Book</p>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={connected ? () => setDepositModalOpen(true) : undefined}
              disabled={!connected}
              className={cn(
                "flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 transition-colors text-xs uppercase tracking-widest",
                connected ? "hover:bg-emerald-500/20" : "opacity-50 cursor-not-allowed"
              )}
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              Deposit
            </button>
            <button
              onClick={connected ? () => setWithdrawModalOpen(true) : undefined}
              disabled={!connected}
              className={cn(
                "flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 transition-colors text-xs uppercase tracking-widest",
                connected ? "hover:bg-amber-500/20" : "opacity-50 cursor-not-allowed"
              )}
            >
              <ArrowUpFromLine className="w-3.5 h-3.5" />
              Withdraw
            </button>
            <ClientWalletButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Trading Interface */}
        <div className="space-y-6">
            {/* Trading Pair Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <TradingPairSelector 
                selectedPairId={selectedPair} 
                onSelect={setSelectedPair}
                pythPrice={marketPrice}
              />
            </div>
            
            {/* Market Stats */}
            <MarketStats pairId={selectedPair} />
            
            {/* Tab Navigation */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-px">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('trade')}
                  className={cn(
                    "px-4 py-2 text-xs uppercase tracking-widest transition-colors",
                    activeTab === 'trade' 
                      ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  Trade
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={cn(
                    "px-4 py-2 text-xs uppercase tracking-widest transition-colors",
                    activeTab === 'orders' 
                      ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  My Orders
                </button>
                <button
                  onClick={() => setActiveTab('network')}
                  className={cn(
                    "px-4 py-2 text-xs uppercase tracking-widest transition-colors flex items-center gap-2",
                    activeTab === 'network' 
                      ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Network
                </button>
              </div>
              
              {/* Quick Stats */}
              <div className="flex items-center gap-4">
                <MatcherStatusBadge />
              </div>
            </div>

            {/* Content */}
            {activeTab === 'trade' && (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Order Book + Market Insights - 2 columns */}
                <div className="lg:col-span-2 space-y-4">
                  <DarkOrderBook />
                  {/* Market Insights - Privacy-preserving aggregate data */}
                  <MarketInsights compact />
                </div>
                
                {/* Place Order Form - 1 column */}
                <div className="space-y-6">
                  <PlaceOrderForm 
                    refreshBalancesTrigger={refreshTrigger}
                    marketPrice={marketPrice}
                  />
                </div>
              </div>
            )}
            
            {activeTab === 'orders' && <MyOrders />}
            
            {activeTab === 'network' && (
              <div className="space-y-6">
                {/* Integration Status Panels */}
                <div className="grid md:grid-cols-2 gap-6">
                  <IntegrationStatus />
                  <CompressionStatus />
                </div>
                
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Price Oracle */}
                  <div>
                    <h3 className="text-xs font-bold text-zinc-300 mb-4 uppercase tracking-widest">Price Oracle (Pyth Network)</h3>
                    <PriceOracle onPriceUpdate={(price) => setMarketPrice(price)} />
                  </div>
                  
                  {/* Matcher Status */}
                  <div>
                    <h3 className="text-xs font-bold text-zinc-300 mb-4 uppercase tracking-widest">Matcher Network</h3>
                    <MatcherStatus showDetails />
                  </div>
                </div>
              </div>
            )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase tracking-widest">
              <Mountain className="w-3.5 h-3.5" />
              <span>AuroraZK © 2026</span>
            </div>
            <div className="flex items-center gap-4">
              {/* Program Link */}
              <a
                href="https://solscan.io/account/4sF9KPj241iRwnyGdYkyTvfDQGKE8zmWBWVidfhfc7Yi?cluster=devnet"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-zinc-500 hover:text-emerald-400 transition-colors text-[10px] uppercase tracking-widest"
              >
                <span className="w-1.5 h-1.5 bg-emerald-500 animate-pulse-dot" />
                Program on Devnet
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-zinc-700">|</span>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[10px] uppercase tracking-widest"
              >
                <Github className="w-3.5 h-3.5" />
                <span>Source</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Deposit Modal */}
      <DepositModal 
        open={depositModalOpen} 
        onOpenChange={setDepositModalOpen}
      />

      {/* Withdraw Modal */}
      <WithdrawModal 
        open={withdrawModalOpen} 
        onOpenChange={setWithdrawModalOpen}
      />
    </div>
  );
}
