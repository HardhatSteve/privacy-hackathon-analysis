'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { formatAddress, formatRelativeTime, getScoreColor } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus, CheckCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Program {
  rank: number;
  rankChange: number;
  name: string;
  address: string;
  category: string;
  score: number;
  isVerified: boolean;
  lastAnalyzed: string;
}

interface LeaderboardTableProps {
  programs: Program[];
}

const categoryColors: Record<string, string> = {
  DEFI: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  NFT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  GAMING: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  DAO: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  WALLET: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  INFRASTRUCTURE: 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400',
};

export function LeaderboardTable({ programs }: LeaderboardTableProps) {
  const getRankIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-400 text-yellow-900';
    if (rank === 2) return 'bg-gray-300 text-gray-800';
    if (rank === 3) return 'bg-amber-600 text-amber-100';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-left text-sm text-muted-foreground">
            <th className="p-4 font-medium">Rank</th>
            <th className="p-4 font-medium">Program</th>
            <th className="p-4 font-medium">Category</th>
            <th className="p-4 font-medium">Score</th>
            <th className="p-4 font-medium">Last Analyzed</th>
            <th className="p-4 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {programs.map((program) => (
            <tr key={program.address} className="border-b last:border-0 hover:bg-muted/50">
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                      getRankBadge(program.rank)
                    )}
                  >
                    {program.rank}
                  </span>
                  {getRankIcon(program.rankChange)}
                </div>
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{program.name}</span>
                      {program.isVerified && (
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatAddress(program.address)}
                    </span>
                  </div>
                </div>
              </td>
              <td className="p-4">
                <Badge
                  variant="secondary"
                  className={cn(categoryColors[program.category])}
                >
                  {program.category}
                </Badge>
              </td>
              <td className="p-4">
                <span className={cn('text-lg font-bold', getScoreColor(program.score))}>
                  {program.score}
                </span>
              </td>
              <td className="p-4 text-sm text-muted-foreground">
                {formatRelativeTime(program.lastAnalyzed)}
              </td>
              <td className="p-4">
                <a
                  href={`https://explorer.solana.com/address/${program.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
