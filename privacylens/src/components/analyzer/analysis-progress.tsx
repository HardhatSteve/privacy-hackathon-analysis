'use client';

import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Loader2 } from 'lucide-react';

interface AnalysisProgressProps {
  progress: number;
  step: string;
}

export function AnalysisProgress({ progress, step }: AnalysisProgressProps) {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          {progress < 100 ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <Shield className="h-8 w-8 text-primary" />
          )}
        </div>
        <CardTitle>
          {progress < 100 ? 'Analyzing Program' : 'Analysis Complete'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{step}</span>
          <span className="font-medium">{progress}%</span>
        </div>

        {progress < 100 && (
          <div className="mt-6 rounded-lg bg-muted/50 p-4">
            <h4 className="mb-2 text-sm font-medium">What we're checking</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className={progress >= 30 ? 'text-foreground' : ''}>
                - PII exposure vulnerabilities
              </li>
              <li className={progress >= 40 ? 'text-foreground' : ''}>
                - Timing attack patterns
              </li>
              <li className={progress >= 50 ? 'text-foreground' : ''}>
                - Cryptographic issues
              </li>
              <li className={progress >= 60 ? 'text-foreground' : ''}>
                - Access control gaps
              </li>
              <li className={progress >= 70 ? 'text-foreground' : ''}>
                - State leakage risks
              </li>
              <li className={progress >= 80 ? 'text-foreground' : ''}>
                - Side-channel vulnerabilities
              </li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
