'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  effort: string;
  impact: string;
}

interface RecommendationsListProps {
  recommendations: Recommendation[];
}

const priorityColors: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

const effortIcons: Record<string, { icon: typeof Zap; color: string }> = {
  EASY: { icon: Zap, color: 'text-green-500' },
  MEDIUM: { icon: Clock, color: 'text-yellow-500' },
  HARD: { icon: Clock, color: 'text-red-500' },
};

const categoryLabels: Record<string, string> = {
  TIMING_PROTECTION: 'Timing Protection',
  ACCESS_CONTROL: 'Access Control',
  KEY_MANAGEMENT: 'Key Management',
  ENCRYPTION: 'Encryption',
  STATE_MANAGEMENT: 'State Management',
  BEST_PRACTICE: 'Best Practice',
};

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/50 p-4">
        <h3 className="mb-2 font-medium">Quick Summary</h3>
        <p className="text-sm text-muted-foreground">
          Implementing these {recommendations.length} recommendations could significantly
          improve your privacy score. Focus on high-priority items first for the best impact.
        </p>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec, index) => {
          const EffortIcon = effortIcons[rec.effort]?.icon || Clock;
          const effortColor = effortIcons[rec.effort]?.color || 'text-muted-foreground';

          return (
            <Card key={rec.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    {index + 1}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium">{rec.title}</h4>
                      <Badge
                        className={cn('shrink-0', priorityColors[rec.priority])}
                        variant="secondary"
                      >
                        {rec.priority}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">{rec.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Category:</span>
                        <span>{categoryLabels[rec.category] || rec.category}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <EffortIcon className={cn('h-4 w-4', effortColor)} />
                        <span className="text-muted-foreground">Effort:</span>
                        <span>{rec.effort.toLowerCase()}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <CheckCircle2
                          className={cn(
                            'h-4 w-4',
                            rec.impact === 'HIGH'
                              ? 'text-green-500'
                              : rec.impact === 'MEDIUM'
                              ? 'text-yellow-500'
                              : 'text-blue-500'
                          )}
                        />
                        <span className="text-muted-foreground">Impact:</span>
                        <span>{rec.impact.toLowerCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {recommendations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="mb-4 h-12 w-12 text-green-500" />
            <p className="text-center text-muted-foreground">
              No recommendations needed. Your program follows all detected best practices.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
