'use client';

import { ScoreGauge } from '@/components/charts/score-gauge';
import { Badge } from '@/components/ui/badge';
import { formatAddress, formatDateTime, getScoreGrade } from '@/lib/utils';
import { Clock, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ReportHeaderProps {
  programName: string;
  programAddress: string;
  analyzedAt: string;
  score: number;
}

export function ReportHeader({
  programName,
  programAddress,
  analyzedAt,
  score,
}: ReportHeaderProps) {
  const copyAddress = () => {
    navigator.clipboard.writeText(programAddress);
    toast.success('Address copied to clipboard');
  };

  const grade = getScoreGrade(score);
  const gradeBadgeVariant = score >= 70 ? 'success' : score >= 40 ? 'medium' : 'critical';

  return (
    <div className="flex flex-col gap-6 rounded-lg border bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{programName}</h1>
          <Badge variant={gradeBadgeVariant as any}>Grade: {grade}</Badge>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
            {formatAddress(programAddress, 8)}
          </code>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyAddress}>
            <Copy className="h-3 w-3" />
          </Button>
          <a
            href={`https://explorer.solana.com/address/${programAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" />
            Explorer
          </a>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Analyzed {formatDateTime(analyzedAt)}
        </div>
      </div>

      <ScoreGauge score={score} size="lg" showGrade showLabel />
    </div>
  );
}
