'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatAddress, formatRelativeTime, getScoreColor } from '@/lib/utils';
import { ArrowUp, ArrowDown, Minus, MoreHorizontal, RefreshCw, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Program {
  id: string;
  name: string;
  address: string;
  score: number;
  lastAnalyzed: string;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  trend: 'up' | 'down' | 'stable';
}

interface ProgramsTableProps {
  programs: Program[];
}

export function ProgramsTable({ programs }: ProgramsTableProps) {
  const TrendIcon = {
    up: ArrowUp,
    down: ArrowDown,
    stable: Minus,
  };

  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    stable: 'text-muted-foreground',
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b text-left text-sm text-muted-foreground">
            <th className="pb-3 font-medium">Program</th>
            <th className="pb-3 font-medium">Score</th>
            <th className="pb-3 font-medium">Vulnerabilities</th>
            <th className="pb-3 font-medium">Last Analyzed</th>
            <th className="pb-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {programs.map((program) => {
            const Icon = TrendIcon[program.trend];
            const total =
              program.vulnerabilities.critical +
              program.vulnerabilities.high +
              program.vulnerabilities.medium +
              program.vulnerabilities.low;

            return (
              <tr key={program.id} className="border-b last:border-0">
                <td className="py-4">
                  <div>
                    <Link
                      href={`/reports/${program.id}`}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {program.name}
                    </Link>
                    <p className="font-mono text-xs text-muted-foreground">
                      {formatAddress(program.address)}
                    </p>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <span className={cn('text-lg font-bold', getScoreColor(program.score))}>
                      {program.score}
                    </span>
                    <Icon className={cn('h-4 w-4', trendColors[program.trend])} />
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-1.5">
                    {program.vulnerabilities.critical > 0 && (
                      <Badge variant="critical" className="text-xs">
                        {program.vulnerabilities.critical}
                      </Badge>
                    )}
                    {program.vulnerabilities.high > 0 && (
                      <Badge variant="high" className="text-xs">
                        {program.vulnerabilities.high}
                      </Badge>
                    )}
                    {program.vulnerabilities.medium > 0 && (
                      <Badge variant="medium" className="text-xs">
                        {program.vulnerabilities.medium}
                      </Badge>
                    )}
                    {program.vulnerabilities.low > 0 && (
                      <Badge variant="low" className="text-xs">
                        {program.vulnerabilities.low}
                      </Badge>
                    )}
                    {total === 0 && (
                      <span className="text-sm text-green-600">No issues</span>
                    )}
                  </div>
                </td>
                <td className="py-4 text-sm text-muted-foreground">
                  {formatRelativeTime(program.lastAnalyzed)}
                </td>
                <td className="py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Re-analyze
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View on Explorer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
