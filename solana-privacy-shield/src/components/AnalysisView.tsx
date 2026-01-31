import { ScoreGauge } from "./ScoreGauge";
import { MetricCard } from "./MetricCard";
import { ReportSection } from "./ReportSection";
import { AnchorReport } from "./AnchorReport";
import { 
  Users, 
  Fingerprint, 
  Clock, 
  MessageSquare, 
  Wallet, 
  GitBranch,
  ArrowLeft,
  Copy,
  ExternalLink
} from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import type { AnalysisResult } from "@/lib/api";

interface AnalysisViewProps {
  data: AnalysisResult;
  onBack: () => void;
}

const getRiskLevel = (value: number, thresholds: [number, number, number]) => {
  if (value <= thresholds[0]) return "low";
  if (value <= thresholds[1]) return "medium";
  if (value <= thresholds[2]) return "high";
  return "critical";
};

export const AnalysisView = ({ data, onBack }: AnalysisViewProps) => {
  const { wallet, score, metrics, report, meta } = data;

  const copyWallet = () => {
    navigator.clipboard.writeText(wallet);
    toast.success("Wallet address copied");
  };

  const openExplorer = () => {
    window.open(`https://solscan.io/account/${wallet}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                New Analysis
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-muted-foreground">
                  {wallet.slice(0, 4)}...{wallet.slice(-4)}
                </code>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyWallet}>
                  <Copy className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={openExplorer}>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              {meta?.transactionCount || 0} transactions analyzed
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Score Section */}
        <div className="flex flex-col lg:flex-row items-center gap-8 mb-12">
          <div className="animate-fade-in-up">
            <ScoreGauge score={score} size={220} />
          </div>
          <div className="flex-1 text-center lg:text-left animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h1 className="text-3xl font-bold text-foreground mb-3">Privacy Analysis Complete</h1>
            <p className="text-muted-foreground text-lg max-w-xl">
              Your wallet has been analyzed across 6 privacy dimensions. 
              Review the detailed metrics and AI-generated recommendations below.
            </p>
            {meta && (
              <div className="flex flex-wrap gap-4 mt-4 justify-center lg:justify-start">
                <div className="px-3 py-1.5 rounded-lg bg-secondary text-sm">
                  <span className="text-muted-foreground">Fee Payers:</span>{" "}
                  <span className="font-mono text-foreground">{meta.uniqueFeePayers}</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-secondary text-sm">
                  <span className="text-muted-foreground">Programs:</span>{" "}
                  <span className="font-mono text-foreground">{meta.uniquePrograms}</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-secondary text-sm">
                  <span className="text-muted-foreground">Signers:</span>{" "}
                  <span className="font-mono text-foreground">{meta.uniqueSigners}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-foreground mb-6">Privacy Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <MetricCard
                title="Fee Payer Reuse"
                value={`${(metrics.feePayerReuseRatio * 100).toFixed(0)}%`}
                description="Ratio of dominant fee payer to total transactions. High reuse enables clustering attacks."
                risk={getRiskLevel(metrics.feePayerReuseRatio, [0.3, 0.6, 0.8])}
                icon={<Wallet className="w-5 h-5" />}
                detail={meta ? `${meta.uniqueFeePayers} unique fee payers detected` : undefined}
              />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
              <MetricCard
                title="Signer Concentration"
                value={`${(metrics.signerConcentration * 100).toFixed(0)}%`}
                description="Measures how concentrated signing authority is. High concentration reveals org structure."
                risk={getRiskLevel(metrics.signerConcentration, [0.3, 0.5, 0.7])}
                icon={<Users className="w-5 h-5" />}
                detail={meta ? `${meta.uniqueSigners} unique signers detected` : undefined}
              />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <MetricCard
                title="Program Fingerprint"
                value={metrics.programEntropy.toFixed(2)}
                description="Behavioral uniqueness based on program interactions. Low entropy = unique fingerprint."
                risk={getRiskLevel(1 - metrics.programEntropy, [0.3, 0.5, 0.7])}
                icon={<Fingerprint className="w-5 h-5" />}
                detail={meta ? `Top: ${meta.topPrograms.slice(0, 2).map(p => p.name).join(", ")}` : undefined}
              />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
              <MetricCard
                title="Counterparty Exposure"
                value={`${(metrics.counterpartyConcentration * 100).toFixed(0)}%`}
                description="Measures interaction concentration with specific addresses. High = easier attribution."
                risk={getRiskLevel(metrics.counterpartyConcentration, [0.3, 0.5, 0.7])}
                icon={<GitBranch className="w-5 h-5" />}
                detail="Concentration in top counterparties"
              />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
              <MetricCard
                title="Memo Leakage"
                value={metrics.memoDetected ? "Detected" : "None"}
                description="Scans for sensitive data in memo fields. Memos are permanently on-chain."
                risk={metrics.memoDetected ? "critical" : "low"}
                icon={<MessageSquare className="w-5 h-5" />}
                detail={metrics.memoDetected ? "Memo program usage detected" : "No memo data detected"}
              />
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: "0.45s" }}>
              <MetricCard
                title="Temporal Pattern"
                value={metrics.temporalEntropy.toFixed(2)}
                description="Activity timing predictability. Low entropy reveals business hours and workflows."
                risk={getRiskLevel(1 - metrics.temporalEntropy, [0.3, 0.5, 0.7])}
                icon={<Clock className="w-5 h-5" />}
                detail="Timing entropy score (0-1)"
              />
            </div>
          </div>
        </div>

        {/* AI Report */}
        <div className="animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          <h2 className="text-xl font-semibold text-foreground mb-6">AI Privacy Report</h2>
          <ReportSection report={report} />
        </div>

        {/* Devnet Anchoring */}
        <div className="mt-12 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
          <h2 className="text-xl font-semibold text-foreground mb-6">Integrity Proof</h2>
          <AnchorReport data={data} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            Solana Privacy Copilot v1.0 • Built for Solana Privacy Hackathon 2026
          </p>
        </div>
      </footer>
    </div>
  );
};
