"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shuffle, 
  Shield, 
  Clock, 
  Layers, 
  TrendingDown,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Zap,
  Info,
  RefreshCw
} from "lucide-react";
import { Button } from "./ui/button";
import type { WalletAnalysis } from "@/lib/privacy-engine";

interface SimulationPanelProps {
  analysis: WalletAnalysis | null;
  onSimulationChange?: (simulation: SimulationResult) => void;
}

export interface SimulationResult {
  originalScore: number;
  simulatedScore: number;
  improvements: Array<{
    technique: string;
    impact: number;
    description: string;
  }>;
  activeSimulations: string[];
}

interface SimulationOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  impact: number; // Privacy score improvement
  riskReduction: string;
  implementation: string;
}

const SIMULATION_OPTIONS: SimulationOption[] = [
  {
    id: "timing-randomization",
    name: "Randomize Timing",
    description: "Eliminate temporal patterns by randomizing transaction times",
    icon: <Clock className="h-4 w-4" />,
    impact: 15,
    riskReduction: "Removes timezone/schedule correlation attacks",
    implementation: "Transactions queued and executed at random intervals (1-24h delay)",
  },
  {
    id: "batch-transactions",
    name: "Batch Transactions",
    description: "Combine multiple transactions to obscure individual amounts",
    icon: <Layers className="h-4 w-4" />,
    impact: 12,
    riskReduction: "Eliminates amount correlation and reduces transaction fingerprinting",
    implementation: "Transactions batched into groups of 5-10 before execution",
  },
  {
    id: "address-rotation",
    name: "Address Rotation",
    description: "Use fresh addresses for each interaction to prevent linking",
    icon: <Shuffle className="h-4 w-4" />,
    impact: 20,
    riskReduction: "Prevents repeat interaction analysis and address clustering",
    implementation: "New derived addresses generated for each transaction",
  },
  {
    id: "decoy-transactions",
    name: "Decoy Transactions",
    description: "Generate noise transactions to mask real activity",
    icon: <Zap className="h-4 w-4" />,
    impact: 10,
    riskReduction: "Increases anonymity set and confuses transaction graph analysis",
    implementation: "Small random transactions sent to decoy addresses periodically",
  },
];

export function SimulationPanel({ analysis, onSimulationChange }: SimulationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSimulations, setActiveSimulations] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const originalScore = analysis?.privacyScore ?? 50;

  // Calculate simulated score
  const calculateSimulatedScore = useCallback(() => {
    let bonus = 0;
    activeSimulations.forEach((simId) => {
      const sim = SIMULATION_OPTIONS.find((s) => s.id === simId);
      if (sim) bonus += sim.impact;
    });
    return Math.min(100, originalScore + bonus);
  }, [activeSimulations, originalScore]);

  const simulatedScore = calculateSimulatedScore();
  const improvement = simulatedScore - originalScore;

  const toggleSimulation = (simId: string) => {
    setActiveSimulations((prev) => {
      const next = new Set(prev);
      if (next.has(simId)) {
        next.delete(simId);
      } else {
        next.add(simId);
      }
      return next;
    });
  };

  const resetSimulations = () => {
    setActiveSimulations(new Set());
  };

  // Notify parent of changes
  const getSimulationResult = (): SimulationResult => ({
    originalScore,
    simulatedScore,
    improvements: Array.from(activeSimulations).map((id) => {
      const sim = SIMULATION_OPTIONS.find((s) => s.id === id)!;
      return {
        technique: sim.name,
        impact: sim.impact,
        description: sim.riskReduction,
      };
    }),
    activeSimulations: Array.from(activeSimulations),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/60 backdrop-blur-sm border-2 border-cyan-500/30 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-cyan-500/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40">
            <Zap className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-mono font-bold text-cyan-400">
                Privacy Simulator
              </h3>
              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30">
                SIMULATION
              </span>
            </div>
            <p className="text-xs text-gray-400">
              "What If?" scenarios for privacy improvement
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {activeSimulations.size > 0 && (
            <span className="px-2 py-1 text-xs font-mono bg-cyan-500/20 text-cyan-400 rounded">
              {activeSimulations.size} active
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
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
          >
            <div className="px-4 pb-4 space-y-4 border-t border-cyan-500/20">
              {/* Score Comparison */}
              <div className="pt-4 grid grid-cols-2 gap-4">
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                  <div className="text-xs text-gray-400 font-mono mb-1">Current Score</div>
                  <div className="text-2xl font-bold text-white font-mono">{originalScore}</div>
                </div>
                <div className={`rounded-lg p-3 border ${
                  improvement > 0 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-gray-900/50 border-gray-700'
                }`}>
                  <div className="text-xs text-gray-400 font-mono mb-1">Simulated Score</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold font-mono ${
                      improvement > 0 ? 'text-green-400' : 'text-white'
                    }`}>
                      {simulatedScore}
                    </span>
                    {improvement > 0 && (
                      <span className="flex items-center text-xs text-green-400">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +{improvement}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Simulation Options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                    Privacy Techniques
                  </span>
                  {activeSimulations.size > 0 && (
                    <button
                      onClick={resetSimulations}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Reset
                    </button>
                  )}
                </div>

                {SIMULATION_OPTIONS.map((sim) => {
                  const isActive = activeSimulations.has(sim.id);
                  const isShowingDetails = showDetails === sim.id;

                  return (
                    <div
                      key={sim.id}
                      className={`rounded-lg border transition-all ${
                        isActive
                          ? 'bg-cyan-500/10 border-cyan-500/40'
                          : 'bg-black/40 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleSimulation(sim.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                isActive
                                  ? 'bg-cyan-500/30 text-cyan-400'
                                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                              }`}
                            >
                              {sim.icon}
                            </button>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">
                                  {sim.name}
                                </span>
                                <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                                  isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                                }`}>
                                  +{sim.impact} pts
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {sim.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShowDetails(isShowingDetails ? null : sim.id)}
                              className="p-1 rounded hover:bg-white/10"
                            >
                              <Info className="h-4 w-4 text-gray-400" />
                            </button>
                            <button
                              onClick={() => toggleSimulation(sim.id)}
                              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                                isActive
                                  ? 'bg-cyan-500 text-black'
                                  : 'bg-gray-700 text-white hover:bg-gray-600'
                              }`}
                            >
                              {isActive ? 'Active' : 'Enable'}
                            </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isShowingDetails && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="mt-3 pt-3 border-t border-gray-700 space-y-2"
                            >
                              <div>
                                <span className="text-xs text-gray-500 font-mono">Risk Reduction:</span>
                                <p className="text-xs text-green-400 mt-1">{sim.riskReduction}</p>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500 font-mono">Implementation:</span>
                                <p className="text-xs text-gray-300 mt-1">{sim.implementation}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Simulation Info */}
              {activeSimulations.size > 0 && (
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-cyan-400 font-mono">
                    💡 This is a preview of potential privacy improvements.
                    Implement these techniques manually to achieve the simulated score.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
