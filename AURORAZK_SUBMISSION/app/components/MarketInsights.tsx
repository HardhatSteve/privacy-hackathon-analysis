'use client';

import { useState, useEffect, useCallback } from 'react';
import { ImbalanceGauge } from './ImbalanceGauge';
import { MomentumIndicator } from './MomentumIndicator';
import { 
  calculateImbalance, 
  calculateMomentum, 
  ImbalanceMetric, 
  MomentumMetric,
  OrderActivity 
} from '@/lib/market-metrics';
import { matcherClient } from '@/lib/matcher-client';
import { Loader2, Activity, Lock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketInsightsProps {
  className?: string;
  compact?: boolean;
}

export function MarketInsights({ className, compact = false }: MarketInsightsProps) {
  const [imbalance, setImbalance] = useState<ImbalanceMetric | null>(null);
  const [momentum, setMomentum] = useState<MomentumMetric | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch metrics from matcher
  const fetchMetrics = useCallback(async () => {
    try {
      // Get stats from matcher
      const stats = await matcherClient.getStats();
      
      if (stats) {
        // Calculate imbalance from order counts
        const imbalanceData = calculateImbalance(stats.buyOrders, stats.sellOrders);
        setImbalance(imbalanceData);
        
        // Calculate momentum from activity log if available
        // For now, we'll use a simulated activity based on current state
        const activityLog: OrderActivity[] = [];
        
        // Generate simulated activity based on order counts (this would come from matcher in production)
        const now = Date.now();
        for (let i = 0; i < stats.buyOrders; i++) {
          activityLog.push({
            timestamp: now - Math.random() * 15 * 60 * 1000, // Within last 15 min
            side: 'buy',
            action: 'placed'
          });
        }
        for (let i = 0; i < stats.sellOrders; i++) {
          activityLog.push({
            timestamp: now - Math.random() * 15 * 60 * 1000,
            side: 'sell',
            action: 'placed'
          });
        }
        
        // Add completed matches
        for (let i = 0; i < stats.completedMatches; i++) {
          activityLog.push({
            timestamp: now - Math.random() * 15 * 60 * 1000,
            side: Math.random() > 0.5 ? 'buy' : 'sell',
            action: 'filled'
          });
        }
        
        const momentumData = calculateMomentum(activityLog, 15);
        setMomentum(momentumData);
        
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch market metrics:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMetrics();
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchMetrics();
    
    // Poll every 5 seconds
    const interval = setInterval(fetchMetrics, 5000);
    
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  if (loading) {
    return (
      <div className={cn("bg-zinc-900 border border-zinc-800", compact ? "p-3" : "p-4", className)}>
        <div className="flex items-center justify-center gap-2 text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs uppercase tracking-wider">Loading metrics...</span>
        </div>
      </div>
    );
  }

  // Compact layout - single row
  if (compact) {
    return (
      <div className={cn("bg-zinc-900 p-3 border border-zinc-800", className)}>
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-medium text-zinc-100 uppercase tracking-wider">Insights</span>
            <span className="text-[9px] text-sky-400 uppercase tracking-wider px-1.5 py-0.5 bg-sky-500/10 border border-sky-500/20">
              Private
            </span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            <RefreshCw className={cn("w-3 h-3 text-zinc-400", isRefreshing && "animate-spin")} />
          </button>
        </div>
        
        {/* Compact Metrics - Side by Side */}
        <div className="grid grid-cols-2 gap-px bg-zinc-800">
          {imbalance && <ImbalanceGauge imbalance={imbalance} compact />}
          {momentum && <MomentumIndicator momentum={momentum} compact />}
        </div>
      </div>
    );
  }

  // Full layout
  return (
    <div className={cn("bg-zinc-900 border border-zinc-800", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-medium text-zinc-100 uppercase tracking-wider">Market Insights</h2>
          <span className="text-[9px] text-sky-400 uppercase tracking-wider px-1.5 py-0.5 bg-sky-500/10 border border-sky-500/20">
            Private
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          <RefreshCw className={cn("w-3.5 h-3.5 text-zinc-400", isRefreshing && "animate-spin")} />
        </button>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-zinc-800">
        {imbalance && <ImbalanceGauge imbalance={imbalance} />}
        {momentum && <MomentumIndicator momentum={momentum} />}
      </div>
    </div>
  );
}
