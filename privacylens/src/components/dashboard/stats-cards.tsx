'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Shield, AlertTriangle, FileCode, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Stats {
  totalPrograms: number;
  averageScore: number;
  totalVulnerabilities: number;
  criticalIssues: number;
  scoreChange: number;
  analyzedThisMonth: number;
}

interface StatsCardsProps {
  stats: Stats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Programs',
      value: stats.totalPrograms,
      icon: FileCode,
      description: `${stats.analyzedThisMonth} analyzed this month`,
    },
    {
      title: 'Average Score',
      value: stats.averageScore,
      icon: BarChart3,
      change: stats.scoreChange,
      description: 'Across all programs',
    },
    {
      title: 'Vulnerabilities',
      value: stats.totalVulnerabilities,
      icon: Shield,
      description: 'Total detected issues',
    },
    {
      title: 'Critical Issues',
      value: stats.criticalIssues,
      icon: AlertTriangle,
      description: 'Require immediate attention',
      highlight: stats.criticalIssues > 0,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className={cn(card.highlight && 'border-red-500/50')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{card.title}</span>
              <card.icon
                className={cn(
                  'h-5 w-5',
                  card.highlight ? 'text-red-500' : 'text-muted-foreground'
                )}
              />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold">{card.value}</span>
              {card.change !== undefined && (
                <span
                  className={cn(
                    'flex items-center text-sm font-medium',
                    card.change >= 0 ? 'text-green-500' : 'text-red-500'
                  )}
                >
                  {card.change >= 0 ? (
                    <TrendingUp className="mr-1 h-4 w-4" />
                  ) : (
                    <TrendingDown className="mr-1 h-4 w-4" />
                  )}
                  {Math.abs(card.change)}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
