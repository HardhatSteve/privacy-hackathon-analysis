import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Globe,
  Ghost,
  RefreshCw,
  Search,
  Target,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Share2,
  Check,
  AlertTriangle,
  Lock,
  Sparkles,
  Zap,
  BookOpen,
  Clock,
  Download,
  Play,
  Info
} from 'lucide-react';
import { useWalletScan } from '../hooks/useWalletScan';
import { truncateAddress, cn } from '../lib/utils';
import ExposureGauge from './ExposureGauge';
import RiskSection from './RiskSection';
import PrivacySolution from './PrivacySolution';
import Tooltip from './Tooltip';
import EducationModal from './EducationModal';
import TimelineView from './TimelineView';
import ShareableCard from './ShareableCard';
import DeanonymizationSimulator from './DeanonymizationSimulator';
import BeforeAfterDemo from './BeforeAfterDemo';

const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse bg-secondary/50 rounded-[1.5rem]", className)} />
);

const Dashboard: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showEducation, setShowEducation] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'simulator' | 'share' | 'demo'>('analysis');

  const { data: scanData, isLoading, error, refetch, isRefetching } = useWalletScan(address || '');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [address]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-12 animate-in fade-in duration-500 max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between gap-10 border-b border-border pb-12">
          <div className="space-y-6">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-20 w-full md:w-[600px] rounded-3xl" />
            <Skeleton className="h-10 w-64 rounded-xl" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-16 w-32 rounded-2xl" />
            <Skeleton className="h-16 w-32 rounded-2xl" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Skeleton className="h-[450px] rounded-[3rem]" />
          <Skeleton className="h-[450px] rounded-[3rem]" />
        </div>

        <div className="text-center py-24 space-y-10">
          <div className="relative mx-auto w-32 h-32">
            <div className="absolute inset-0 border-4 border-solana-purple/10 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-solana-purple rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-12 h-12 text-solana-purple animate-pulse" />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-4xl font-black tracking-tighter uppercase solana-text-gradient">Decrypting Dossier</h3>
            <p className="text-muted-foreground text-lg max-w-sm mx-auto font-medium">Analyzing historical footprints and clustering probability nodes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !scanData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 max-w-xl mx-auto text-center px-4 animate-in zoom-in duration-500">
        <div className="p-12 md:p-16 rounded-[4rem] bg-secondary/10 border border-destructive/20 shadow-2xl shadow-destructive/5">
          <div className="w-24 h-24 bg-destructive/10 rounded-[2rem] flex items-center justify-center mx-auto mb-10 rotate-12 group-hover:rotate-0 transition-transform">
            <ShieldX className="w-12 h-12 text-destructive" />
          </div>
          <h3 className="text-4xl font-black tracking-tighter mb-6 uppercase">Node Sync Error</h3>
          <p className="text-muted-foreground text-lg mb-12 leading-relaxed font-semibold">
            The analyzer node could not parse this wallet. This usually happens if the address is not on Mainnet or if the AI engine is overloaded.
          </p>
          <div className="flex flex-col gap-5">
            <button
              onClick={() => refetch()}
              className="w-full flex items-center justify-center gap-3 px-10 py-5 bg-solana-purple text-white rounded-3xl font-black text-xl hover:bg-solana-purple/90 transition-all shadow-xl shadow-solana-purple/20"
            >
              <RefreshCw className={cn("w-6 h-6", isRefetching && "animate-spin")} />
              Retry Analysis
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-10 py-5 bg-secondary/80 text-foreground rounded-3xl font-black text-xl hover:bg-secondary transition-all border border-border"
            >
              Back to Safety
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getRiskStatus = () => {
    if (scanData.exposureScore > 70) return { label: 'CRITICAL', color: 'text-red-500', icon: ShieldX };
    if (scanData.exposureScore > 40) return { label: 'MEDIUM', color: 'text-yellow-500', icon: ShieldAlert };
    return { label: 'LOW', color: 'text-solana-green', icon: ShieldCheck };
  };

  const status = getRiskStatus();

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-32 px-1 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 border-b border-border pb-16">
        <div className="space-y-8 w-full lg:w-auto">
          <div className="flex items-center justify-between lg:justify-start gap-6">
            <button
              onClick={() => navigate('/')}
              className="group flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-all"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              New Scan
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-3 px-6 py-3 bg-secondary/50 rounded-2xl border border-border hover:bg-accent transition-all text-[11px] font-black uppercase tracking-[0.3em]"
            >
              {copied ? <Check className="w-4 h-4 text-solana-green" /> : <Share2 className="w-4 h-4" />}
              {copied ? 'Copied' : 'Share Audit'}
            </button>
          </div>
          <div className="space-y-6">
            <div className="flex items-start md:items-center gap-6">
              <status.icon className={cn("w-16 h-16 md:w-24 md:h-24 shrink-0 drop-shadow-2xl", status.color)} />
              <div>
                <h2 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.8]">
                  <span className={status.color}>{scanData.exposureScore}% EXPOSED</span>
                </h2>
                <div className="flex items-center gap-3 mt-4">
                  <div className={cn("px-4 py-1.5 rounded-xl text-[11px] font-black border uppercase tracking-[0.3em]", status.color, "bg-current/10 border-current/20 shadow-xl shadow-current/5")}>
                    {status.label} RISK LEVEL
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground bg-white/5 px-4 py-1.5 rounded-xl border border-white/5">
                    <Sparkles className="w-3.5 h-3.5" /> AI Audited
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-secondary/30 px-5 py-3 rounded-[1.5rem] border border-border w-fit font-mono text-xs md:text-lg text-muted-foreground/90 backdrop-blur-md">
              <Lock className="w-4 h-4 md:w-5 md:h-5 text-solana-purple" />
              <span className="truncate max-w-[200px] md:max-w-none">{address}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 md:gap-5">
          {[
            { label: 'Solscan', url: scanData.links.solscan, icon: Globe },
            { label: 'Arkham', url: scanData.links.arkham, icon: Target },
            { label: 'X Search', url: scanData.links.xSearch, icon: Search }
          ].map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-5 bg-secondary/50 rounded-[2rem] border border-border hover:bg-accent hover:border-solana-purple/50 transition-all text-xs font-black uppercase tracking-[0.2em] shadow-lg group active:scale-95"
            >
              <link.icon className="w-5 h-5 text-solana-purple group-hover:rotate-12 transition-transform" />
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* Learn More Button */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowEducation(true)}
          className="group flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-solana-purple to-solana-green rounded-[2rem] font-black text-xl text-white hover:shadow-2xl hover:shadow-solana-purple/30 transition-all active:scale-95"
        >
          <BookOpen className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          Learn How You're Being Watched
        </button>
      </div>

      {/* Analysis UI */}
      <div className="space-y-24">
        <ExposureGauge score={scanData.exposureScore} breakdown={scanData.scoreBreakdown} />

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {[
            {
              label: 'Unique Addresses',
              value: scanData.clustering.interactedCount,
              icon: '🔗',
              description: 'Addresses you\'ve interacted with',
              color: 'from-purple-500/20 to-purple-500/5'
            },
            {
              label: 'Net Worth',
              value: `$${scanData.netWorthUsd.toLocaleString()}`,
              icon: '💰',
              description: 'Estimated portfolio value',
              color: 'from-green-500/20 to-green-500/5'
            },
            {
              label: 'Total Trades',
              value: scanData.tradeCount,
              icon: '📊',
              description: 'DeFi & DEX transactions',
              color: 'from-blue-500/20 to-blue-500/5'
            },
            {
              label: 'Transactions',
              value: scanData.recentTxSummary.length,
              icon: '⚡',
              description: 'Recent activity analyzed',
              color: 'from-yellow-500/20 to-yellow-500/5'
            }
          ].map((metric, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl bg-gradient-to-br ${metric.color} border border-white/5 hover:border-white/10 transition-all group`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl group-hover:scale-110 transition-transform">{metric.icon}</span>
                <Tooltip content={metric.description}>
                  <Info className="w-4 h-4 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity" />
                </Tooltip>
              </div>
              <div className="space-y-1">
                <p className="text-2xl lg:text-3xl font-black tracking-tight">{metric.value}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{metric.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-6">
            <div className="space-y-2">
              <h3 className="text-3xl font-black uppercase tracking-tighter">
                Leak Attribution
              </h3>
              <p className="text-sm text-muted-foreground font-black uppercase tracking-[0.3em]">Advanced Pattern Analysis</p>
            </div>
            <div className="hidden md:block h-px flex-grow mx-8 bg-gradient-to-r from-border to-transparent" />
            <Tooltip content="Analysis based on on-chain transaction patterns, clustering heuristics, and known CEX addresses.">
              <div className="flex items-center gap-3 text-[11px] font-black text-solana-purple bg-solana-purple/10 px-6 py-3 rounded-full uppercase tracking-[0.3em] border border-solana-purple/20 shadow-2xl shadow-solana-purple/10">
                <Sparkles className="w-4 h-4" /> Advanced Analysis
              </div>
            </Tooltip>
          </div>
          <RiskSection data={scanData} />
        </div>

        {/* Timeline Section */}
        <div className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-6">
            <div className="space-y-2">
              <h3 className="text-3xl font-black uppercase tracking-tighter">
                Surveillance History
              </h3>
              <p className="text-sm text-muted-foreground font-black uppercase tracking-[0.3em]">What Everyone Can See</p>
            </div>
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className="flex items-center gap-3 px-6 py-3 bg-secondary/50 rounded-2xl border border-border hover:bg-accent transition-all text-sm font-black uppercase tracking-[0.2em]"
            >
              <Clock className="w-5 h-5" />
              {showTimeline ? 'Hide' : 'View'} Timeline
            </button>
          </div>
          {showTimeline && (
            <TimelineView
              transactions={scanData.recentTxSummary}
              cexConnections={scanData.clustering?.topAddresses || []}
            />
          )}
        </div>
      </div>

      {/* Competition Features Section */}
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h3 className="text-3xl font-black tracking-tighter uppercase">
            Interactive <span className="solana-text-gradient">Tools</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Explore how surveillance works and how to protect yourself
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { id: 'simulator' as const, icon: Play, label: 'Deanon Simulator' },
            { id: 'share' as const, icon: Download, label: 'Share Report' },
            { id: 'demo' as const, icon: Lock, label: 'Privacy Demo' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-wider transition-all",
                activeTab === tab.id
                  ? "bg-solana-purple text-white shadow-lg shadow-solana-purple/30"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground border border-border"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-8 rounded-[3rem] bg-secondary/5 border border-white/5">
          {activeTab === 'simulator' && (
            <DeanonymizationSimulator walletAddress={address || ''} data={scanData} />
          )}
          {activeTab === 'share' && (
            <ShareableCard walletAddress={address || ''} data={scanData} />
          )}
          {activeTab === 'demo' && (
            <BeforeAfterDemo />
          )}
        </div>
      </div>

      {/* Promoted Section */}
      <PrivacySolution />

      {/* Audit Note */}
      <div className="max-w-4xl mx-auto p-12 rounded-[3.5rem] bg-secondary/5 border border-white/5 space-y-6 text-center backdrop-blur-3xl shadow-2xl">
        <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6 text-yellow-500/50" />
        </div>
        <p className="text-sm font-bold text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          <span className="text-foreground">Disclaimer:</span> This audit is for educational purposes only. Exposure scores are probabilistic estimates based on observable public data.
          Privacy in Web3 requires proactive decoupling.
        </p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-[11px] font-black uppercase tracking-[0.6em] text-solana-purple hover:text-solana-green transition-all"
        >
          Back to Summary
        </button>
      </div>

      {/* Education Modal */}
      <EducationModal isOpen={showEducation} onClose={() => setShowEducation(false)} />
    </div>
  );
};

export default Dashboard;