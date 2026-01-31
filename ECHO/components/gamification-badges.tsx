"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { WalletAnalysis } from "@/lib/privacy-engine";

interface GamificationBadgesProps {
  analysis: WalletAnalysis | null;
}

interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
  earned: boolean;
  rarity: "common" | "rare" | "epic" | "legendary";
  condition: string;
}

export function GamificationBadges({ analysis }: GamificationBadgesProps) {
  const badges = useMemo((): Badge[] => {
    if (!analysis) return [];

    const privacyScore = analysis.privacyScore;
    const txCount = analysis.transactionCount;
    const uniqueInteractions = analysis.uniqueInteractions;
    const risks = analysis.risks;
    const mevExposure = analysis.mevExposure;
    const temporalPatterns = analysis.temporalAnalysis.hasPatterns;

    return [
      // Privacy Score Badges
      {
        id: "shadow-master",
        emoji: "🕵️",
        name: "Shadow Master",
        description: "Achieved 90+ privacy score",
        earned: privacyScore >= 90,
        rarity: "legendary",
        condition: "Privacy Score ≥ 90",
      },
      {
        id: "privacy-pro",
        emoji: "🛡️",
        name: "Privacy Pro",
        description: "Maintained strong privacy practices",
        earned: privacyScore >= 70,
        rarity: "epic",
        condition: "Privacy Score ≥ 70",
      },
      {
        id: "cautious-trader",
        emoji: "👀",
        name: "Cautious Trader",
        description: "Moderate privacy awareness",
        earned: privacyScore >= 50 && privacyScore < 70,
        rarity: "rare",
        condition: "Privacy Score 50-69",
      },
      
      // Activity Badges
      {
        id: "whale-watcher",
        emoji: "🐋",
        name: "Whale Watcher",
        description: "High transaction volume",
        earned: txCount >= 100,
        rarity: "epic",
        condition: "100+ transactions",
      },
      {
        id: "social-butterfly",
        emoji: "🦋",
        name: "Social Butterfly",
        description: "Many unique interactions",
        earned: uniqueInteractions >= 50,
        rarity: "rare",
        condition: "50+ unique addresses",
      },
      {
        id: "minimalist",
        emoji: "🎯",
        name: "Minimalist",
        description: "Few, focused interactions",
        earned: uniqueInteractions <= 10 && txCount >= 5,
        rarity: "rare",
        condition: "≤10 interactions with 5+ txs",
      },

      // Risk Badges
      {
        id: "ghost-mode",
        emoji: "👻",
        name: "Ghost Mode",
        description: "No critical risks detected",
        earned: !risks.some(r => r.severity === "critical"),
        rarity: "epic",
        condition: "Zero critical risks",
      },
      {
        id: "clean-slate",
        emoji: "✨",
        name: "Clean Slate",
        description: "No risks detected at all",
        earned: risks.length === 0,
        rarity: "legendary",
        condition: "Zero risks",
      },
      {
        id: "risk-taker",
        emoji: "🎰",
        name: "Risk Taker",
        description: "Multiple high-severity risks",
        earned: risks.filter(r => r.severity === "critical" || r.severity === "high").length >= 3,
        rarity: "common",
        condition: "3+ high/critical risks",
      },

      // MEV Badges
      {
        id: "mev-immune",
        emoji: "🛡️",
        name: "MEV Immune",
        description: "No MEV exposure detected",
        earned: !mevExposure.detected,
        rarity: "rare",
        condition: "Zero MEV incidents",
      },
      {
        id: "sandwich-survivor",
        emoji: "🥪",
        name: "Sandwich Survivor",
        description: "Survived MEV attacks",
        earned: mevExposure.detected && mevExposure.count <= 3,
        rarity: "common",
        condition: "1-3 MEV incidents",
      },

      // Temporal Badges
      {
        id: "night-owl",
        emoji: "🦉",
        name: "Night Owl",
        description: "Transactions in late hours",
        earned: analysis.temporalAnalysis.commonHours.some(h => h >= 22 || h <= 4),
        rarity: "common",
        condition: "Active 10PM-4AM",
      },
      {
        id: "unpredictable",
        emoji: "🎲",
        name: "Unpredictable",
        description: "No temporal patterns",
        earned: !temporalPatterns,
        rarity: "rare",
        condition: "No timing patterns",
      },
      {
        id: "routine-robot",
        emoji: "🤖",
        name: "Routine Robot",
        description: "Highly predictable timing",
        earned: temporalPatterns && analysis.temporalAnalysis.confidence >= 50,
        rarity: "common",
        condition: "50%+ timing correlation",
      },

      // Special Badges
      {
        id: "devnet-explorer",
        emoji: "🧪",
        name: "Devnet Explorer",
        description: "Using the safe testing environment",
        earned: true, // Always earned on devnet
        rarity: "common",
        condition: "Using Devnet",
      },
    ];
  }, [analysis]);

  const earnedBadges = badges.filter(b => b.earned);
  const unearnedBadges = badges.filter(b => !b.earned);

  const rarityColors = {
    common: "from-gray-500 to-gray-600",
    rare: "from-blue-500 to-blue-600",
    epic: "from-purple-500 to-purple-600",
    legendary: "from-yellow-500 to-orange-500",
  };

  const rarityBorders = {
    common: "border-gray-500/30",
    rare: "border-blue-500/30",
    epic: "border-purple-500/30",
    legendary: "border-yellow-500/30 animate-pulse",
  };

  if (!analysis) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* How Badges Work */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <h3 className="text-sm font-mono text-blue-400 font-bold mb-2">🏆 How Badges Work</h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          Badges are earned based on your wallet's privacy behavior. They help you understand 
          your privacy strengths and areas for improvement. Here's how you can earn them:
        </p>
      </div>

      {/* Badge Categories */}
      <div className="space-y-3">
        <div className="bg-black/40 border border-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🛡️</span>
            <span className="text-sm font-mono text-white font-bold">Privacy Score Badges</span>
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <p>• <span className="text-yellow-400">Shadow Master</span> - Achieve 90+ privacy score</p>
            <p>• <span className="text-purple-400">Privacy Pro</span> - Maintain 70+ privacy score</p>
            <p>• <span className="text-blue-400">Cautious Trader</span> - Score between 50-69</p>
          </div>
        </div>

        <div className="bg-black/40 border border-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">👻</span>
            <span className="text-sm font-mono text-white font-bold">Risk Avoidance Badges</span>
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <p>• <span className="text-green-400">Ghost Mode</span> - No critical risks detected</p>
            <p>• <span className="text-cyan-400">Clean Slate</span> - Zero risks at all</p>
            <p>• <span className="text-purple-400">MEV Immune</span> - No MEV exposure</p>
          </div>
        </div>

        <div className="bg-black/40 border border-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎲</span>
            <span className="text-sm font-mono text-white font-bold">Behavior Badges</span>
          </div>
          <div className="text-xs text-gray-400 space-y-1">
            <p>• <span className="text-blue-400">Unpredictable</span> - No temporal patterns</p>
            <p>• <span className="text-cyan-400">Minimalist</span> - Few, focused interactions</p>
            <p>• <span className="text-yellow-400">Social Butterfly</span> - Many unique interactions (privacy risk!)</p>
          </div>
        </div>
      </div>

      {/* Your Status */}
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/30">
        <h3 className="text-sm font-mono text-blue-400 font-bold mb-3">Your Current Status</h3>
        <div className="flex flex-wrap gap-2">
          {earnedBadges.map((badge) => (
            <div
              key={badge.id}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border ${rarityBorders[badge.rarity]} bg-black/40`}
              title={badge.description}
            >
              <span>{badge.emoji}</span>
              <span className="text-xs font-mono text-white">{badge.name}</span>
            </div>
          ))}
          {earnedBadges.length === 0 && (
            <p className="text-xs text-gray-500">No badges earned yet. Improve your privacy to unlock badges!</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
