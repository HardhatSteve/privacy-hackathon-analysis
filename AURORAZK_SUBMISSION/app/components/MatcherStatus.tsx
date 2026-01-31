'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { multiMatcher, MatcherNode } from '@/lib/multi-matcher';
import { matcherClient } from '@/lib/matcher-client';
import { Wifi, WifiOff } from 'lucide-react';

interface MatcherStatusProps {
  showDetails?: boolean;
}

export function MatcherStatus({ showDetails = false }: MatcherStatusProps) {
  const [stats, setStats] = useState({
    totalMatchers: 0,
    activeMatchers: 0,
    pendingProposals: 0,
    slashingEvents: 0,
    avgReputation: 0,
  });
  const [matchers, setMatchers] = useState<MatcherNode[]>([]);

  useEffect(() => {
    const updateStats = () => {
      setStats(multiMatcher.getStats());
      setMatchers(multiMatcher.getActiveMatchers());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-sm font-medium text-white">Multi-Matcher Network</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded ${
            stats.activeMatchers >= 3 ? 'bg-green-500/20 text-green-400' :
            stats.activeMatchers >= 1 ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {stats.activeMatchers >= 3 ? 'Consensus Ready' :
             stats.activeMatchers >= 1 ? 'Limited' :
             'Offline'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs mb-4">
        <div className="bg-slate-900/50 rounded p-3">
          <div className="text-slate-400 mb-1">Active Matchers</div>
          <div className="text-2xl font-bold text-white">
            {stats.activeMatchers}
            <span className="text-slate-500 text-sm font-normal">/{stats.totalMatchers}</span>
          </div>
        </div>
        <div className="bg-slate-900/50 rounded p-3">
          <div className="text-slate-400 mb-1">Pending Proposals</div>
          <div className="text-2xl font-bold text-cyan-400">{stats.pendingProposals}</div>
        </div>
        <div className="bg-slate-900/50 rounded p-3">
          <div className="text-slate-400 mb-1">Avg Reputation</div>
          <div className="text-2xl font-bold text-white">{stats.avgReputation.toFixed(0)}%</div>
        </div>
        <div className="bg-slate-900/50 rounded p-3">
          <div className="text-slate-400 mb-1">Slashing Events</div>
          <div className={`text-2xl font-bold ${stats.slashingEvents > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {stats.slashingEvents}
          </div>
        </div>
      </div>

      {/* Consensus Threshold Indicator */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">Consensus Threshold</span>
          <span className="text-white">67%</span>
        </div>
        <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (stats.activeMatchers / 3) * 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {stats.activeMatchers >= 3 
            ? '✓ Minimum 3 matchers for consensus' 
            : `Need ${3 - stats.activeMatchers} more matcher(s)`}
        </div>
      </div>

      {/* Matcher List */}
      {showDetails && matchers.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-slate-400 mb-2">Active Matchers</div>
          {matchers.map((matcher, index) => (
            <motion.div
              key={matcher.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between bg-slate-900/50 rounded p-2"
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${matcher.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs font-mono text-white">{matcher.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-slate-400">
                  Rep: <span className={matcher.reputation >= 80 ? 'text-green-400' : matcher.reputation >= 50 ? 'text-yellow-400' : 'text-red-400'}>{matcher.reputation}%</span>
                </div>
                <div className="text-xs text-slate-400">
                  Weight: <span className="text-white">{matcher.weight}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
        <div className="text-xs text-slate-400">
          <span className="text-cyan-400 font-medium">Multi-Matcher MPC</span> ensures decentralized matching:
        </div>
        <ul className="text-xs text-slate-500 mt-2 space-y-1">
          <li>• Multiple matchers verify each match proposal</li>
          <li>• 2/3 consensus required for execution</li>
          <li>• Malicious matchers get slashed</li>
          <li>• No single point of failure</li>
        </ul>
      </div>
    </div>
  );
}

// Compact inline status - shows actual matcher service status
export function MatcherStatusBadge() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const available = await matcherClient.isAvailable();
        setIsOnline(available);
      } catch {
        setIsOnline(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  if (isOnline === null) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800 text-zinc-400 text-xs">
        <div className="w-2 h-2 bg-zinc-500 animate-pulse" />
        <span className="uppercase tracking-wider">Checking...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 text-xs uppercase tracking-wider ${
      isOnline 
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
    }`}>
      {isOnline ? (
        <>
          <Wifi className="w-3 h-3" />
          <span>Matcher Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          <span>Matcher Offline</span>
        </>
      )}
    </div>
  );
}
