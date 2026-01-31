"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { 
  Globe,
  AlertTriangle,
  Shield,
  Filter,
  Info,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import type { WalletAnalysis } from "@/lib/privacy-engine";

interface ComplianceHeatmapProps {
  analysis: WalletAnalysis | null;
}

interface RiskCategory {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  score: number;
}

export function ComplianceHeatmap({ analysis }: ComplianceHeatmapProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Calculate risk categories from real analysis data
  const riskCategories = useMemo((): RiskCategory[] => {
    if (!analysis) return [];

    const rangeScore = analysis.rangeRiskScore?.riskScore || 0;
    const temporalRisk = analysis.temporalAnalysis?.hasPatterns ? 60 : 20;
    const mevRisk = analysis.mevExposure?.detected ? 70 : 10;
    
    // Calculate identity risk from risks array
    const identityRisks = analysis.risks.filter(r => r.category === "identity");
    const identityScore = identityRisks.length > 0 
      ? Math.min(100, identityRisks.reduce((sum, r) => sum + r.confidence, 0) / identityRisks.length)
      : 15;

    // Calculate compliance score
    const complianceRisks = analysis.risks.filter(r => r.category === "compliance");
    const complianceScore = complianceRisks.length > 0 ? 80 : rangeScore * 10;

    const categories: RiskCategory[] = [
      {
        id: "identity",
        name: "Identity Exposure",
        score: Math.round(identityScore),
        description: "Risk of linking wallet to real-world identity through KYC exchanges or address clustering",
        ...getRiskColors(identityScore),
      },
      {
        id: "temporal",
        name: "Temporal Patterns",
        score: Math.round(temporalRisk),
        description: "Transaction timing patterns that could reveal timezone or behavioral information",
        ...getRiskColors(temporalRisk),
      },
      {
        id: "mev",
        name: "MEV Exposure",
        score: Math.round(mevRisk),
        description: "Vulnerability to front-running, sandwich attacks, and value extraction",
        ...getRiskColors(mevRisk),
      },
      {
        id: "compliance",
        name: "Regulatory Risk",
        score: Math.round(complianceScore),
        description: "Interaction with sanctioned addresses or flagged entities",
        ...getRiskColors(complianceScore),
      },
      {
        id: "amount",
        name: "Amount Correlation",
        score: analysis.risks.find(r => r.id === "amount-correlation")?.confidence || 20,
        description: "Unique transaction amounts that can be used to link transactions",
        ...getRiskColors(analysis.risks.find(r => r.id === "amount-correlation")?.confidence || 20),
      },
      {
        id: "network",
        name: "Network Analysis",
        score: Math.min(100, analysis.uniqueInteractions * 2),
        description: "Graph analysis vulnerability based on interaction patterns",
        ...getRiskColors(Math.min(100, analysis.uniqueInteractions * 2)),
      },
    ];

    return categories.sort((a, b) => b.score - a.score);
  }, [analysis]);

  // Overall compliance score (inverse of risk)
  const overallCompliance = useMemo(() => {
    if (riskCategories.length === 0) return 100;
    const avgRisk = riskCategories.reduce((sum, cat) => sum + cat.score, 0) / riskCategories.length;
    return Math.round(100 - avgRisk);
  }, [riskCategories]);

  if (!analysis) {
    return (
      <div className="bg-black/40 rounded-xl p-6 border border-gray-700">
        <div className="text-center text-gray-500">
          <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-mono">No analysis data available</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/60 backdrop-blur-sm border-2 border-orange-500/30 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-orange-500/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/40">
            <Globe className="h-4 w-4 text-orange-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-mono font-bold text-orange-400">
              Compliance Heatmap
            </h3>
            <p className="text-xs text-gray-400">
              Risk category breakdown
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-xs font-mono ${
            overallCompliance >= 70 
              ? 'bg-green-500/20 text-green-400' 
              : overallCompliance >= 40 
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-red-500/20 text-red-400'
          }`}>
            {overallCompliance}% Compliant
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="border-t border-orange-500/20"
        >
          <div className="p-4 space-y-4">
            {/* Heatmap Grid */}
            <div className="grid grid-cols-2 gap-2">
              {riskCategories.map((category, index) => (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    selectedCategory === category.id
                      ? `${category.bgColor} ${category.borderColor} ring-2 ring-offset-2 ring-offset-black ring-${category.color.split('-')[1]}-500/50`
                      : `${category.bgColor} ${category.borderColor} hover:scale-[1.02]`
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-gray-400 truncate">
                      {category.name}
                    </span>
                    <span className={`text-sm font-bold font-mono ${category.color}`}>
                      {category.score}%
                    </span>
                  </div>
                  
                  {/* Mini progress bar */}
                  <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${category.score}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className={`h-full rounded-full ${
                        category.score >= 70 ? 'bg-red-500' :
                        category.score >= 40 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                    />
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Selected Category Details */}
            {selectedCategory && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 rounded-lg p-4 border border-gray-700"
              >
                {(() => {
                  const cat = riskCategories.find(c => c.id === selectedCategory);
                  if (!cat) return null;
                  return (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-mono text-white">{cat.name}</span>
                      </div>
                      <p className="text-sm text-gray-400">{cat.description}</p>
                      
                      {/* Recommendations based on risk level */}
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                          {cat.score >= 70 ? (
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                          ) : cat.score >= 40 ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-400" />
                          ) : (
                            <Shield className="h-4 w-4 text-green-400" />
                          )}
                          <span className="text-xs font-mono text-gray-400">
                            {cat.score >= 70 ? 'HIGH RISK' : cat.score >= 40 ? 'MODERATE RISK' : 'LOW RISK'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300">
                          {cat.score >= 70 
                            ? "Immediate action recommended. Consider using privacy-enhancing tools."
                            : cat.score >= 40
                              ? "Monitor this risk category. Some improvements possible."
                              : "Good privacy practices detected. Maintain current behavior."
                          }
                        </p>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span className="text-xs text-gray-400">Low Risk</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-500"></div>
                <span className="text-xs text-gray-400">Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500"></div>
                <span className="text-xs text-gray-400">High Risk</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Helper function to get colors based on risk score
function getRiskColors(score: number): { color: string; bgColor: string; borderColor: string } {
  if (score >= 70) {
    return {
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
    };
  } else if (score >= 40) {
    return {
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
    };
  } else {
    return {
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30",
    };
  }
}
