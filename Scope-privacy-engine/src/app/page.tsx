'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, AlertCircle, AlertTriangle, Info, ExternalLink, XCircle, Shield, TrendingDown, Activity, Wallet, Moon, Sun, ChevronDown, Network } from 'lucide-react';
import type { PrivacyReport, ScanState, Warning, Recommendation, RiskLevel } from '@/components/privacy-audit/types';
import { IdentityGraph, AssetsAtRisk, PrivacyTicker, CypherTraining } from '@/components/privacy-audit';

export default function PrivacyAuditPage() {
  const [state, setState] = useState<ScanState>({
    status: 'idle',
    report: null,
    error: null,
  });
  const [address, setAddress] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showTraining, setShowTraining] = useState(false);

  // Persist dark mode preference
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') setDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    
    setState({ status: 'loading', report: null, error: null });

    try {
      const response = await fetch('/api/privacy-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const report: PrivacyReport = await response.json();
      setState({ status: 'success', report, error: null });
    } catch (error) {
      setState({
        status: 'error',
        report: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  };

  // Theme classes - Premium glassmorphism for both modes
  const theme = {
    bg: darkMode ? 'dark-gradient-bg' : 'light-gradient-bg',
    headerBg: darkMode ? 'dark-header-gradient' : 'light-header-gradient',
    headerBorder: darkMode ? 'border-white/[0.04]' : 'border-black/[0.06]',
    cardBg: darkMode ? 'glassmorphism-dark' : 'glassmorphism-light',
    cardBorder: darkMode ? 'border-white/[0.06]' : 'border-black/[0.06]',
    inputBg: darkMode ? 'input-premium-dark' : 'input-premium-light',
    inputBorder: darkMode ? 'border-white/[0.08]' : 'border-black/[0.08]',
    inputText: darkMode ? 'text-white/90' : 'text-slate-900',
    inputPlaceholder: darkMode ? 'placeholder:text-white/30' : 'placeholder:text-slate-400',
    textPrimary: darkMode ? 'text-white/95' : 'text-slate-900',
    textSecondary: darkMode ? 'text-white/60' : 'text-slate-600',
    textMuted: darkMode ? 'text-white/40' : 'text-slate-400',
    statBg: darkMode ? 'glassmorphism-dark-subtle' : 'glassmorphism-light-subtle',
    divider: darkMode ? 'border-white/[0.06]' : 'border-black/[0.06]',
    hover: darkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-black/[0.02]',
    toolCardBorder: darkMode ? 'border-white/[0.08]' : 'border-black/[0.08]',
    toolCardHover: darkMode ? 'hover:border-white/[0.12] card-hover-lift' : 'hover:border-black/[0.12] card-hover-lift-light',
  };

  return (
    <main className={`min-h-screen ${theme.bg} transition-colors duration-300`}>
      {/* Header Section */}
      <div className={`${theme.headerBg} border-b ${theme.headerBorder} transition-colors duration-300`}>
        <div className="max-w-6xl mx-auto px-6 py-10">
          {/* Dark Mode Toggle & Training */}
          <div className="flex justify-end gap-3 mb-6">
            <button
              onClick={() => setShowTraining(true)}
              className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 border ${darkMode 
                ? 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:border-white/20' 
                : 'bg-black/5 text-black/80 border-black/10 hover:bg-black/10 hover:border-black/20'}`}
            >
              Training
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl transition-all duration-300 border ${darkMode 
                ? 'bg-gradient-to-br from-amber-400/10 to-orange-400/10 text-amber-400 border-amber-400/20 hover:border-amber-400/40 glow-amber hover:scale-105' 
                : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 border-black/[0.08] hover:border-black/[0.15] hover:scale-105 shadow-sm'}`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>

          {/* Logo & Title - Centered */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 transition-all duration-300 animate-float ${darkMode 
              ? 'bg-gradient-to-br from-white to-gray-200 shadow-lg glow-white' 
              : 'bg-gradient-to-br from-slate-900 to-black shadow-lg'}`} style={{ boxShadow: darkMode ? undefined : '0 4px 20px rgba(0, 0, 0, 0.15)' }}>
              <Shield className={`w-7 h-7 ${darkMode ? 'text-black' : 'text-white'}`} />
            </div>
            <h1 className={`text-2xl font-bold ${theme.textPrimary} tracking-tight`}>Privacy Scanner</h1>
            <p className={`text-sm ${theme.textSecondary} mt-1.5`}>Solana Wallet Analysis</p>
          </div>

          {/* Search Form - Centered */}
          <form onSubmit={handleScan} className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2">
                <Search className={`w-5 h-5 ${theme.textMuted}`} />
              </div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter Solana wallet address..."
                disabled={state.status === 'loading'}
                className={`w-full pl-14 pr-32 py-4
                           ${theme.inputBg} rounded-full
                           ${theme.inputText} font-medium text-sm
                           ${theme.inputPlaceholder}
                           border ${theme.inputBorder}
                           shadow-sm
                           focus:shadow-md focus:ring-2 focus:ring-black/5 focus:outline-none
                           disabled:opacity-50
                           transition-all duration-200`}
              />
              <button
                type="submit"
                disabled={state.status === 'loading' || !address.trim()}
                className={`absolute right-2 top-1/2 -translate-y-1/2
                           px-6 py-2.5
                           font-semibold text-sm
                           rounded-full
                           disabled:opacity-40 disabled:cursor-not-allowed
                           transition-all duration-300
                           flex items-center gap-2
                           ${darkMode 
                             ? 'btn-premium-dark' 
                             : 'btn-premium-light'}`}
              >
                {state.status === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Scanning</span>
                  </>
                ) : (
                  <span>Analyze</span>
                )}
              </button>
            </div>
          </form>

          {/* Error State */}
          {state.status === 'error' && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mt-6 max-w-2xl mx-auto">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-500 text-sm">Analysis Failed</p>
                <p className="text-red-400 text-sm">{state.error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section - Bento Grid */}
      {state.report && (
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Left Column - Score Card (Sticky) */}
            <div className="md:col-span-4">
              <div className="sticky top-8 space-y-4">
                <ScoreCard report={state.report} darkMode={darkMode} theme={theme} />
                
                {/* Assets at Risk */}
                <AssetsAtRisk 
                  exposedSol={state.report.financialExposure?.exposedSol || 0}
                  exposedUsd={state.report.financialExposure?.exposedUsd || 0}
                  darkMode={darkMode}
                />
                
                {/* Identity Graph Button */}
                <button
                  onClick={() => setShowGraph(true)}
                  className={`w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 border ${darkMode 
                    ? 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:border-white/20' 
                    : 'bg-black/5 text-black/80 border-black/10 hover:bg-black/10 hover:border-black/20'
                  }`}
                >
                  <Network className="w-4 h-4" />
                  View Identity Graph
                </button>
              </div>
            </div>

            {/* Right Column - Issues & Recommendations */}
            <div className="md:col-span-8 space-y-8">
              {state.report.warnings.length > 0 && (
                <AuditList warnings={state.report.warnings} darkMode={darkMode} theme={theme} />
              )}
              {state.report.actions.length > 0 && (
                <ToolsGrid actions={state.report.actions} darkMode={darkMode} theme={theme} />
              )}
            </div>
          </div>

          {/* Footer Meta */}
          <div className={`mt-12 pt-6 border-t ${theme.divider} flex justify-center items-center gap-4 text-xs ${theme.textMuted}`}>
            <span className={`px-3 py-1.5 rounded-full ${darkMode ? 'bg-white/[0.03]' : 'bg-slate-100'}`}>
              ⚡ {state.report.analysisMetadata.analysisTimeMs}ms
            </span>
            <span className={`px-3 py-1.5 rounded-full ${darkMode ? 'bg-white/[0.03]' : 'bg-slate-100'} ${state.report.analysisMetadata.heliusEnabled ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : ''}`}>
              {state.report.analysisMetadata.heliusEnabled ? '● Live Data' : '○ Demo Mode'}
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {state.status === 'idle' && (
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 animate-float transition-all duration-300 ${darkMode 
            ? 'glassmorphism-dark glow-white' 
            : 'glassmorphism-light'}`} style={{ boxShadow: darkMode ? undefined : '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
            <Wallet className={`w-10 h-10 ${darkMode ? 'text-white/60' : 'text-slate-400'}`} />
          </div>
          <h3 className={`text-xl font-semibold ${theme.textPrimary} mb-3 tracking-tight`}>Ready to analyze</h3>
          <p className={`${theme.textSecondary} text-sm max-w-md mx-auto leading-relaxed`}>
            Enter any Solana wallet address above to get a comprehensive privacy score and actionable recommendations.
          </p>
        </div>
      )}

      {/* Identity Graph Modal */}
      {state.report && (
        <IdentityGraph 
          report={state.report} 
          isOpen={showGraph} 
          onClose={() => setShowGraph(false)}
          darkMode={darkMode}
        />
      )}

      {/* Privacy Ticker */}
      <PrivacyTicker darkMode={darkMode} />

      {/* CypherTraining Modal */}
      <CypherTraining 
        isOpen={showTraining} 
        onClose={() => setShowTraining(false)}
        darkMode={darkMode}
      />
    </main>
  );
}


interface ThemeProps {
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  statBg: string;
  divider: string;
}

function ScoreCard({ report, darkMode, theme }: { report: PrivacyReport; darkMode: boolean; theme: ThemeProps }) {
  const riskConfig: Record<RiskLevel, { stroke: string; fill: string; text: string; label: string; glowDark: string; glowLight: string }> = {
    LOW: { stroke: '#10b981', fill: 'text-emerald-500', text: 'text-emerald-400', label: 'Low Exposure', glowDark: 'glow-emerald', glowLight: 'glow-emerald-light' },
    MEDIUM: { stroke: '#f59e0b', fill: 'text-amber-500', text: 'text-amber-400', label: 'Moderate Exposure', glowDark: 'glow-amber', glowLight: 'glow-amber-light' },
    HIGH: { stroke: '#ef4444', fill: 'text-red-500', text: 'text-red-400', label: 'High Exposure', glowDark: 'glow-red', glowLight: 'glow-red-light' },
    CRITICAL: { stroke: '#dc2626', fill: 'text-red-600', text: 'text-red-500', label: 'Critical Exposure', glowDark: 'glow-red', glowLight: 'glow-red-light' },
  };

  const config = riskConfig[report.riskLevel];
  const shortAddress = `${report.walletAddress.slice(0, 6)}...${report.walletAddress.slice(-4)}`;

  // SVG Gauge calculations
  const size = 180;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (report.score / 100) * circumference;
  const offset = circumference - progress;

  return (
    <div className={`${theme.cardBg} rounded-3xl border ${theme.cardBorder} p-6 transition-all duration-300 ${darkMode ? config.glowDark : config.glowLight}`}>
      
      {/* Radial Gauge */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <svg width={size} height={size} className="-rotate-90">
            {/* Background track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              fill="none"
              className={darkMode ? 'stroke-white/[0.06]' : 'stroke-slate-100'}
            />
            {/* Progress arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              fill="none"
              stroke={config.stroke}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: offset,
                filter: darkMode ? `drop-shadow(0 0 6px ${config.stroke})` : 'none',
              }}
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold font-mono ${config.fill}`}>
              {report.score}
            </span>
            <span className={`text-xs ${theme.textMuted}`}>/ 100</span>
          </div>
        </div>
      </div>

      {/* Status Label */}
      <div className={`flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-full mx-auto w-fit ${darkMode ? 'bg-white/[0.03]' : ''}`}>
        <span className={`w-2 h-2 rounded-full ${darkMode ? 'animate-glow-pulse' : 'animate-pulse'}`} style={{ backgroundColor: config.stroke, boxShadow: darkMode ? `0 0 8px ${config.stroke}` : 'none' }}></span>
        <span className={`text-xs font-semibold tracking-wide ${config.text} uppercase`}>
          {config.label}
        </span>
      </div>

      {/* Description */}
      <p className={`text-sm ${theme.textSecondary} text-center mb-6 leading-relaxed`}>
        {report.riskDescription}
      </p>

      {/* Stats Grid */}
      <div className={`grid grid-cols-3 gap-2 pt-4 border-t ${theme.divider}`}>
        <div className={`${theme.statBg} rounded-lg p-2.5 text-center`}>
          <Activity className={`w-3.5 h-3.5 ${theme.textMuted} mx-auto mb-1`} />
          <span className={`text-sm font-bold ${theme.textPrimary} block`}>{report.transactionsAnalyzed}</span>
          <span className={`text-[10px] ${theme.textMuted}`}>TX</span>
        </div>
        <div className={`${theme.statBg} rounded-lg p-2.5 text-center`}>
          <TrendingDown className={`w-3.5 h-3.5 ${theme.textMuted} mx-auto mb-1`} />
          <span className={`text-sm font-bold ${theme.textPrimary} block`}>{report.warnings.length}</span>
          <span className={`text-[10px] ${theme.textMuted}`}>Issues</span>
        </div>
        <div className={`${theme.statBg} rounded-lg p-2.5 text-center`}>
          <Wallet className={`w-3.5 h-3.5 ${theme.textMuted} mx-auto mb-1`} />
          <span className={`text-[10px] font-mono ${theme.textSecondary} block truncate`}>{shortAddress}</span>
          <span className={`text-[10px] ${theme.textMuted}`}>Wallet</span>
        </div>
      </div>
    </div>
  );
}

function getEducationalContent(issue: string, category: string): string {
  const issueText = `${issue} ${category}`.toLowerCase();
  
  if (issueText.includes('cex') || issueText.includes('exchange') || issueText.includes('binance') || issueText.includes('coinbase')) {
    return "Centralized Exchanges (CEX) require KYC verification. Linking this wallet directly to Binance/Coinbase reveals your real-world identity to anyone analyzing the chain. Recommended countermeasure: Use an intermediate privacy layer.";
  }
  
  if (issueText.includes('cluster') || issueText.includes('link') || issueText.includes('connect') || issueText.includes('pattern')) {
    return "Frequent fund transfers between your own wallets creates a clear behavioral 'fingerprint'. Chain observers can map your entire portfolio network. Your wallets are no longer isolated—they form a traceable cluster.";
  }
  
  if (issueText.includes('poap') || issueText.includes('identity') || issueText.includes('nft') || issueText.includes('badge') || issueText.includes('asset')) {
    return "Event badges (POAPs) and identity NFTs prove your physical location at specific dates. Combined with other on-chain data, this can deanonymize your real-world identity.";
  }
  
  if (issueText.includes('reuse') || issueText.includes('address') || issueText.includes('same wallet')) {
    return "Reusing addresses creates permanent links between all your activities. Professional adversaries can reconstruct your entire financial history from a single address.";
  }
  
  return "This activity creates an immutable record on the blockchain. Every transaction is logged forever. What seems anonymous today may be fully traceable tomorrow as analysis techniques improve.";
}

function AuditList({ warnings, darkMode, theme }: { warnings: Warning[]; darkMode: boolean; theme: ThemeProps & { hover: string; divider: string } }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const icons = {
    critical: XCircle,
    high: AlertTriangle,
    medium: AlertCircle,
    low: Info,
  };

  const severityConfig = {
    critical: { 
      iconColor: 'text-red-500', 
      borderColor: 'border-red-500/30',
      bgColor: darkMode ? 'bg-red-500/5' : 'bg-red-50',
    },
    high: { 
      iconColor: 'text-orange-500', 
      borderColor: 'border-orange-500/30',
      bgColor: darkMode ? 'bg-orange-500/5' : 'bg-orange-50',
    },
    medium: { 
      iconColor: 'text-amber-500', 
      borderColor: 'border-amber-500/30',
      bgColor: darkMode ? 'bg-amber-500/5' : 'bg-amber-50',
    },
    low: { 
      iconColor: 'text-emerald-500', 
      borderColor: 'border-emerald-500/30',
      bgColor: darkMode ? 'bg-emerald-500/5' : 'bg-emerald-50',
    },
  };

  const badgeStyles = {
    critical: 'bg-red-500/10 text-red-400 border-red-500/30',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };

  const toggleExpand = (index: number) => {
    setExpandedId(expandedId === index ? null : index);
  };

  return (
    <div className={`${theme.cardBg} rounded-3xl border ${theme.cardBorder} transition-all duration-300 overflow-hidden`}>
      {/* Header - Simple Style */}
      <div className={`p-5 border-b ${theme.divider}`}>
        <h2 className={`text-sm font-semibold tracking-wider ${theme.textMuted} uppercase`}>
          Detected Issues
        </h2>
      </div>

      {/* Issues List */}
      <div className="p-3 space-y-2">
        {warnings.map((w, i) => {
          const Icon = icons[w.severity];
          const config = severityConfig[w.severity];
          const isExpanded = expandedId === i;
          const educationalContent = getEducationalContent(w.message, w.category);

          return (
            <div 
              key={i} 
              className={`
                rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden
                ${darkMode ? 'bg-white/[0.02]' : 'bg-white'}
                ${isExpanded 
                  ? config.borderColor 
                  : `${darkMode ? 'border-white/[0.06]' : 'border-black/[0.06]'} ${theme.hover}`
                }
              `}
              onClick={() => toggleExpand(i)}
            >
              {/* Main Row */}
              <div className="flex items-center gap-4 px-4 py-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-white/[0.05]' : 'bg-black/[0.03]'} transition-colors`}>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${config.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${config.iconColor}`}>
                      {w.severity}
                    </span>
                    <span className={theme.textMuted}>•</span>
                    <span className={`text-xs ${theme.textMuted} font-mono`}>{w.category}</span>
                  </div>
                  <p className={`text-sm ${theme.textPrimary} ${isExpanded ? '' : 'line-clamp-1'}`}>{w.message}</p>
                </div>

                {/* Chevron */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${darkMode ? 'bg-white/[0.03]' : 'bg-black/[0.02]'} flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                  <ChevronDown className={`w-4 h-4 ${theme.textMuted}`} />
                </div>
              </div>

              {/* Expanded Educational Content */}
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-4 pb-4">
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-white/[0.02]' : 'bg-black/[0.02]'}`}>
                    <p className={`text-xs font-medium uppercase tracking-wider ${theme.textMuted} mb-2`}>
                      Why This Matters
                    </p>
                    <p className={`text-sm ${theme.textSecondary} leading-relaxed`}>
                      {educationalContent}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ToolsGrid({ actions, darkMode, theme }: { actions: Recommendation[]; darkMode: boolean; theme: ThemeProps & { toolCardBorder: string; toolCardHover: string; divider: string } }) {
  const grouped = actions.reduce<Record<string, { tool?: string; url?: string; items: Recommendation[] }>>((acc, a) => {
    const key = a.tool ?? 'General';
    if (!acc[key]) acc[key] = { tool: a.tool, url: a.toolUrl, items: [] };
    acc[key].items.push(a);
    return acc;
  }, {});

  const toolDescriptions: Record<string, string> = {
    'Privacy Cash': 'Anonymous mixing for maximum privacy',
    'Radr Labs': 'Advanced clustering analysis & obfuscation',
    'General': 'Best practices for privacy',
  };

  return (
    <div className={`${theme.cardBg} rounded-3xl border ${theme.cardBorder} transition-all duration-300 overflow-hidden`}>
      <div className={`p-5 border-b ${theme.divider}`}>
        <h2 className={`text-sm font-semibold tracking-wider ${theme.textMuted} uppercase`}>
          Recommended Tools
        </h2>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(grouped).map(([key, g]) => (
            <div 
              key={key} 
              className={`border ${theme.toolCardBorder} rounded-2xl p-5 ${theme.toolCardHover} transition-all flex flex-col ${darkMode ? 'bg-white/[0.02]' : ''}`}
            >
              <div className="flex-1">
                <h3 className={`font-bold ${theme.textPrimary} mb-1`}>{g.tool ?? 'General Tips'}</h3>
                <p className={`text-xs ${theme.textMuted} mb-4`}>
                  {toolDescriptions[g.tool ?? 'General'] ?? `${g.items.length} recommendations`}
                </p>
                <ul className="space-y-2 mb-4">
                  {g.items.slice(0, 2).map((item, i) => (
                    <li key={i} className={`text-xs ${theme.textSecondary} flex items-start gap-2`}>
                      <span className={theme.textMuted}>→</span>
                      <span className="line-clamp-2">{item.action}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {g.url ? (
                <a
                  href={g.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 w-full py-3 text-xs font-semibold rounded-xl transition-all duration-300 ${darkMode 
                    ? 'btn-premium-dark' 
                    : 'btn-premium-light'}`}
                >
                  Deploy Fix
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button className={`w-full py-3 ${theme.statBg} ${theme.textMuted} text-xs font-semibold rounded-xl cursor-default border ${darkMode ? 'border-white/[0.05]' : 'border-transparent'}`}>
                  Manual Steps
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
