'use client';

import { Activity, TrendingUp, BarChart3, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketStatsProps {
  pairId: string;
}

export function MarketStats({ pairId }: MarketStatsProps) {
  // Mock stats - in production would come from on-chain data
  const stats = {
    darkOrders: 12,
    totalVolume: '$1.2M',
    avgHiddenSize: '45 SOL',
    avgMatchTime: '< 2 min',
  };

  const statItems = [
    {
      label: 'Dark Orders',
      value: stats.darkOrders.toString(),
      icon: Activity,
      accent: 'sky',
    },
    {
      label: '24h Volume',
      value: stats.totalVolume,
      icon: BarChart3,
      accent: 'emerald',
    },
    {
      label: 'Avg Hidden Size',
      value: stats.avgHiddenSize,
      icon: TrendingUp,
      accent: 'sky',
    },
    {
      label: 'Avg Match Time',
      value: stats.avgMatchTime,
      icon: Clock,
      accent: 'zinc',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-800">
      {statItems.map((stat, i) => (
        <div
          key={i}
          className="bg-zinc-900 p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={cn(
              "w-8 h-8 flex items-center justify-center",
              stat.accent === 'sky' && "bg-sky-500/10 text-sky-400",
              stat.accent === 'emerald' && "bg-emerald-500/10 text-emerald-400",
              stat.accent === 'zinc' && "bg-zinc-700 text-zinc-400"
            )}>
              <stat.icon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-zinc-100 font-mono mb-1">{stat.value}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
