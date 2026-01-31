"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  TrendingDown, 
  TrendingUp,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  Download,
  Play,
  Map,
  Trophy,
  Terminal
} from "lucide-react";
import type { WalletAnalysis } from "@/lib/privacy-engine";
import { SimulationPanel } from "./simulation-panel";
import { ComplianceHeatmap } from "./compliance-heatmap";
import { ExportPanel } from "./export-panel";
import { GamificationBadges } from "./gamification-badges";

interface AnalysisSidebarProps {
  address: string;
  analysis?: WalletAnalysis | null;
}

export function AnalysisSidebar({ address, analysis }: AnalysisSidebarProps) {
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "simulation" | "heatmap" | "export" | "badges" | "logs">("overview");

  const privacyScore = analysis?.privacyScore ?? 0;
  const transactionCount = analysis?.transactionCount ?? 0;
  const uniqueInteractions = analysis?.uniqueInteractions ?? 0;
  const risks = analysis?.risks ?? [];
  const aiSummary = analysis?.aiSummary;
  const mevExposure = analysis?.mevExposure;

  const privacyColor =
    privacyScore >= 70
      ? "green"
      : privacyScore >= 40
        ? "yellow"
        : "red";

  const tabs = [
    { id: "overview" as const, icon: Shield, label: "Overview" },
    { id: "simulation" as const, icon: Play, label: "Simulate" },

    { id: "heatmap" as const, icon: Map, label: "Heatmap" },
    { id: "badges" as const, icon: Trophy, label: "Badges" },
    { id: "logs" as const, icon: Terminal, label: "API Logs" },
    { id: "export" as const, icon: Download, label: "Export" },
  ];

  return (
    <div className="h-full flex flex-col bg-black/40 backdrop-blur-sm border-2 border-blue-500/20 rounded-2xl overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-blue-500/20 bg-black/60 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[60px] px-2 py-3 text-xs font-mono transition-colors flex flex-col items-center gap-1 ${
              activeTab === tab.id
                ? "bg-blue-500/20 text-blue-400 border-b-2 border-blue-400"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
      {/* Privacy Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Privacy Score
        </h3>
        
        <div className="relative">
          <div className="flex items-end justify-between mb-2">
            <div className={`text-5xl font-bold font-mono
              ${privacyColor === 'green' ? 'text-green-400' : ''}
              ${privacyColor === 'yellow' ? 'text-yellow-400' : ''}
              ${privacyColor === 'red' ? 'text-red-400' : ''}
            `}>
              {privacyScore}
              <span className="text-2xl text-gray-500">/100</span>
            </div>
            
            <div className={`px-3 py-1 rounded-full text-xs font-mono uppercase
              ${privacyColor === 'green' ? 'bg-green-500/20 text-green-400 border border-green-500/40' : ''}
              ${privacyColor === 'yellow' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' : ''}
              ${privacyColor === 'red' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : ''}
            `}>
              {privacyColor === 'green' ? '🛡️ Strong' : privacyColor === 'yellow' ? '⚠️ Moderate' : '🚨 Weak'}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${privacyScore}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`h-full rounded-full
                ${privacyColor === 'green' ? 'bg-gradient-to-r from-green-600 to-green-400' : ''}
                ${privacyColor === 'yellow' ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : ''}
                ${privacyColor === 'red' ? 'bg-gradient-to-r from-red-600 to-red-400' : ''}
              `}
            />
          </div>
        </div>
      </motion.div>

      {/* AI Summary */}
      {aiSummary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4 space-y-2"
        >
          <h3 className="text-sm font-mono text-purple-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Summary
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed">
            {aiSummary.summary}
          </p>
        </motion.div>
      )}

      {/* Key Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
          <div className="text-xs text-gray-400 font-mono mb-1">Transactions</div>
          <div className="text-2xl font-bold text-blue-400 font-mono">
            {transactionCount}
          </div>
        </div>
        
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
          <div className="text-xs text-gray-400 font-mono mb-1">Interactions</div>
          <div className="text-2xl font-bold text-blue-400 font-mono">
            {uniqueInteractions}
          </div>
        </div>
        
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
          <div className="text-xs text-gray-400 font-mono mb-1">Risks Found</div>
          <div className="text-2xl font-bold text-purple-400 font-mono">
            {risks.length}
          </div>
        </div>
        
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3">
          <div className="text-xs text-gray-400 font-mono mb-1">MEV Risk</div>
          <div className="text-2xl font-bold text-orange-400 font-mono">
            {mevExposure?.detected ? `${mevExposure.count}` : '0'}
          </div>
        </div>
      </motion.div>

      {/* Deanonymization Risks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Deanonymization Risks ({risks.length})
        </h3>
        
        <div className="space-y-2">
          {risks.length === 0 ? (
            <div className="text-sm text-gray-500 font-mono p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              ✅ No significant risks detected
            </div>
          ) : (
            risks.map((risk) => {
              const isExpanded = expandedRisk === risk.id;
              const severityColor =
                risk.severity === "critical"
                  ? "red"
                  : risk.severity === "high"
                    ? "orange"
                    : risk.severity === "medium"
                      ? "yellow"
                      : "blue";

              return (
                <motion.div
                  key={risk.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`border rounded-lg overflow-hidden transition-all
                    ${severityColor === 'red' ? 'bg-red-500/5 border-red-500/30' : ''}
                    ${severityColor === 'orange' ? 'bg-orange-500/5 border-orange-500/30' : ''}
                    ${severityColor === 'yellow' ? 'bg-yellow-500/5 border-yellow-500/30' : ''}
                    ${severityColor === 'blue' ? 'bg-blue-500/5 border-blue-500/30' : ''}
                  `}
                >
                  <button
                    onClick={() => setExpandedRisk(isExpanded ? null : risk.id)}
                    className="w-full p-3 text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-mono uppercase
                            ${severityColor === 'red' ? 'bg-red-500/20 text-red-400' : ''}
                            ${severityColor === 'orange' ? 'bg-orange-500/20 text-orange-400' : ''}
                            ${severityColor === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                            ${severityColor === 'blue' ? 'bg-blue-500/20 text-blue-400' : ''}
                          `}>
                            {risk.severity}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            {risk.confidence.toFixed(2)}% confidence
                          </span>
                        </div>
                        
                        <div className="text-sm text-white font-mono">
                          {risk.title}
                        </div>
                      </div>
                      
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-white/10"
                      >
                        <div className="p-3 space-y-2">
                          <p className="text-xs text-gray-300 leading-relaxed">
                            {risk.description}
                          </p>
                          
                          {risk.recommendation && (
                            <div className="pt-2 border-t border-white/10">
                              <p className="text-xs text-blue-400">
                                💡 {risk.recommendation}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 pt-2">
                            <Info className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500 font-mono">
                              Affects {risk.affectedTransactions} transaction{risk.affectedTransactions > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Privacy Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 space-y-3"
      >
        <h3 className="text-sm font-mono text-blue-400 uppercase tracking-wider flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Privacy Tips
        </h3>
        
        <ul className="space-y-2 text-xs text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>Use multiple wallets to separate activities</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>Avoid regular transaction patterns</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>Consider using privacy-preserving protocols</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">•</span>
            <span>Batch transactions to reduce correlation</span>
          </li>
        </ul>
      </motion.div>

      {/* Badge/Gamification Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-center py-4 border border-blue-500/20 rounded-lg bg-black/40"
      >
        <div className="text-4xl mb-2">🕵️</div>
        <div className="text-sm font-mono text-blue-400 font-bold">Shadow Operator</div>
        <div className="text-xs text-gray-500 mt-1">Good privacy practices detected</div>
        <button 
          onClick={() => setActiveTab("badges")}
          className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-mono"
        >
          View All Badges →
        </button>
      </motion.div>
            </motion.div>
          )}

          {/* Simulation Tab */}
          {activeTab === "simulation" && (
            <motion.div
              key="simulation"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <SimulationPanel analysis={analysis ?? null} />
            </motion.div>
          )}

          {/* Heatmap Tab */}
          {activeTab === "heatmap" && (
            <motion.div
              key="heatmap"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ComplianceHeatmap analysis={analysis ?? null} />
            </motion.div>
          )}

          {/* Badges Tab */}
          {activeTab === "badges" && (
            <motion.div
              key="badges"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <GamificationBadges analysis={analysis ?? null} />
            </motion.div>
          )}

          {/* API Logs Tab - Transparency for users */}
          {activeTab === "logs" && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 space-y-2">
                <h3 className="text-sm font-mono text-blue-400 uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  API Data Transparency
                </h3>
                <p className="text-xs text-gray-400">
                  See exactly what data was fetched for your analysis. We believe in full transparency.
                </p>
              </div>

              {/* Helius Data */}
              <div className="bg-black/60 border border-gray-700 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-purple-500/10 border-b border-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  <span className="text-xs font-mono text-purple-400">Helius API</span>
                </div>
                <div className="p-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transactions fetched:</span>
                    <span className="text-white">{analysis?.transactionCount ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Unique addresses:</span>
                    <span className="text-white">{analysis?.uniqueInteractions ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Network:</span>
                    <span className="text-yellow-400">Devnet</span>
                  </div>
                </div>
              </div>

              {/* Range Protocol Data */}
              <div className="bg-black/60 border border-gray-700 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-cyan-500/10 border-b border-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                  <span className="text-xs font-mono text-cyan-400">Range Protocol</span>
                </div>
                <div className="p-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Risk Score:</span>
                    <span className="text-white">{analysis?.rangeRiskScore?.riskScore ?? 'N/A'}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sanctions Check:</span>
                    <span className={analysis?.sanctionsCheck?.isSanctioned ? 'text-red-400' : 'text-green-400'}>
                      {analysis?.sanctionsCheck?.isSanctioned ? '⚠️ Flagged' : '✅ Clear'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Risk Level:</span>
                    <span className="text-white">{analysis?.rangeRiskScore?.riskLevel ?? 'Unknown'}</span>
                  </div>
                </div>
              </div>

              {/* MEV Detection Data */}
              <div className="bg-black/60 border border-gray-700 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-orange-500/10 border-b border-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                  <span className="text-xs font-mono text-orange-400">QuickNode MEV</span>
                </div>
                <div className="p-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-500">MEV Detected:</span>
                    <span className={analysis?.mevExposure?.detected ? 'text-red-400' : 'text-green-400'}>
                      {analysis?.mevExposure?.detected ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Attack Count:</span>
                    <span className="text-white">{analysis?.mevExposure?.count ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Extracted:</span>
                    <span className="text-white">
                      {analysis?.mevExposure?.totalExtracted 
                        ? `${(analysis.mevExposure.totalExtracted / 1e9).toFixed(4)} SOL`
                        : '0 SOL'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Temporal Analysis */}
              <div className="bg-black/60 border border-gray-700 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-blue-500/10 border-b border-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span className="text-xs font-mono text-blue-400">Temporal Analysis</span>
                </div>
                <div className="p-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Patterns Found:</span>
                    <span className={analysis?.temporalAnalysis?.hasPatterns ? 'text-yellow-400' : 'text-green-400'}>
                      {analysis?.temporalAnalysis?.hasPatterns ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Confidence:</span>
                    <span className="text-white">{analysis?.temporalAnalysis?.confidence ?? 0}%</span>
                  </div>
                  {analysis?.temporalAnalysis?.commonHours && analysis.temporalAnalysis.commonHours.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Active Hours:</span>
                      <span className="text-white">
                        {analysis.temporalAnalysis.commonHours.map(h => `${h}:00`).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Gemini AI */}
              <div className="bg-black/60 border border-gray-700 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-pink-500/10 border-b border-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-pink-400"></div>
                  <span className="text-xs font-mono text-pink-400">Gemini AI Summary</span>
                </div>
                <div className="p-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Privacy Score:</span>
                    <span className="text-white">{analysis?.aiSummary?.privacyScore ?? 'N/A'}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Recommendations:</span>
                    <span className="text-white">{analysis?.aiSummary?.recommendations?.length ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* Deanonymization Paths */}
              <div className="bg-black/60 border border-gray-700 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-red-500/10 border-b border-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-400"></div>
                  <span className="text-xs font-mono text-red-400">Risk Detection</span>
                </div>
                <div className="p-3 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Risks Identified:</span>
                    <span className="text-white">{analysis?.risks?.length ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Deanon Paths:</span>
                    <span className="text-white">{analysis?.deanonymizationPaths?.length ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Critical Risks:</span>
                    <span className="text-red-400">
                      {analysis?.risks?.filter(r => r.severity === 'critical').length ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center pt-2">
                🔒 All data is fetched in real-time and not stored on our servers.
              </p>
            </motion.div>
          )}

          {/* Export Tab */}
          {activeTab === "export" && (
            <motion.div
              key="export"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ExportPanel analysis={analysis ?? null} address={address} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
