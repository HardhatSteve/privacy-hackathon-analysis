'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Score {
  overall: number;
  encryption: number;
  accessControl: number;
  dataPrivacy: number;
  sideChannel: number;
  piiHandling: number;
  confidence: number;
  percentile: number;
}

interface ScoreSummaryProps {
  score: Score;
}

const categoryLabels: Record<string, string> = {
  encryption: 'Encryption',
  accessControl: 'Access Control',
  dataPrivacy: 'Data Privacy',
  sideChannel: 'Side-Channel',
  piiHandling: 'PII Handling',
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-green-400';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function ScoreSummary({ score }: ScoreSummaryProps) {
  const categories = [
    { key: 'encryption', value: score.encryption },
    { key: 'accessControl', value: score.accessControl },
    { key: 'dataPrivacy', value: score.dataPrivacy },
    { key: 'sideChannel', value: score.sideChannel },
    { key: 'piiHandling', value: score.piiHandling },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Score Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category) => (
          <div key={category.key}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {categoryLabels[category.key]}
              </span>
              <span className="font-medium">{category.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn('h-full transition-all', getScoreColor(category.value))}
                style={{ width: `${category.value}%` }}
              />
            </div>
          </div>
        ))}

        <div className="mt-6 border-t pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Confidence Level</span>
            <span className="font-medium">{Math.round(score.confidence * 100)}%</span>
          </div>
          {score.percentile && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Percentile Rank</span>
              <span className="font-medium">Top {100 - score.percentile}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
