import React from 'react';
import { ScoreBreakdown as IScoreBreakdown } from '../types/api';
import { cn } from '../lib/utils';
import { Info } from 'lucide-react';

interface ScoreBreakdownProps {
  breakdown: IScoreBreakdown;
}

const CATEGORY_METADATA: Record<keyof IScoreBreakdown, { label: string; description: string }> = {
  identity: {
    label: 'Identity Leakage',
    description: 'Risk from social media links, SNS names (.sol), and on-chain profile metadata.'
  },
  kycLinks: {
    label: 'KYC Footprint',
    description: 'Exposure level based on direct or indirect links to centralized exchange deposit addresses.'
  },
  financial: {
    label: 'Financial Exposure',
    description: 'Visibility of net worth, high-value assets, and large volume transaction history.'
  },
  clustering: {
    label: 'Entity Clustering',
    description: 'Probability of your wallet being grouped with other known addresses in automated clusters.'
  },
  activity: {
    label: 'Behavioral Pulse',
    description: 'Frequency, timing, and pattern of transactions that create a unique signature.'
  }
};

const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ breakdown }) => {
  return (
    <div className="space-y-6">
      {Object.entries(CATEGORY_METADATA).map(([key, meta]) => {
        const value = breakdown[key as keyof IScoreBreakdown];
        const colorClass = value > 70 ? 'bg-red-500' : value > 40 ? 'bg-yellow-500' : 'bg-solana-green';
        
        return (
          <div key={key} className="group relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground/80">{meta.label}</span>
                <div className="relative cursor-help text-muted-foreground hover:text-foreground transition-colors">
                  <Info className="w-3.5 h-3.5" />
                  <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-secondary border border-border rounded-lg text-[10px] leading-tight opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                    {meta.description}
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono font-black">{value}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-white/5">
              <div 
                className={cn("h-full transition-all duration-1000 ease-out rounded-full", colorClass)}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ScoreBreakdown;