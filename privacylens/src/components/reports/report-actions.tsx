'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  Share2,
  RefreshCw,
  FileText,
  Code,
  FileJson,
  Link2,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

interface ReportActionsProps {
  analysisId: string;
}

export function ReportActions({ analysisId }: ReportActionsProps) {
  const handleExport = (format: string) => {
    toast.success(`Exporting report as ${format.toUpperCase()}...`);
    // In production, this would trigger an actual export
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/reports/${analysisId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard');
  };

  const handleReanalyze = () => {
    toast.info('Re-analyzing program...');
    // In production, this would trigger a new analysis
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" className="w-full justify-start" onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Share Report
        </Button>

        <div className="space-y-2">
          <p className="text-sm font-medium">Export As</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="justify-start"
              onClick={() => handleExport('pdf')}
            >
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start"
              onClick={() => handleExport('json')}
            >
              <FileJson className="mr-2 h-4 w-4" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start"
              onClick={() => handleExport('markdown')}
            >
              <Code className="mr-2 h-4 w-4" />
              Markdown
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start"
              onClick={() => handleExport('sarif')}
            >
              <Code className="mr-2 h-4 w-4" />
              SARIF
            </Button>
          </div>
        </div>

        <div className="border-t pt-3">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleReanalyze}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Re-analyze Program
          </Button>
        </div>

        <div className="rounded-lg bg-muted/50 p-3">
          <p className="mb-2 text-xs font-medium">Embed Badge</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded bg-background px-2 py-1 text-xs">
              ![Privacy Score](https://privacylens.io/badge/{analysisId})
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(
                  `![Privacy Score](https://privacylens.io/badge/${analysisId})`
                );
                toast.success('Badge code copied');
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
