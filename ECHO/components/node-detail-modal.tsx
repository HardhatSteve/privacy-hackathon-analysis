"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, Building2, Code, Shield, AlertTriangle, ExternalLink, Copy, Check, TrendingUp, Clock, Users, Zap, Lock } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

interface NodeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: {
    address: string;
    type: "wallet" | "exchange" | "program" | "mev" | "stealth";
    riskLevel: "low" | "medium" | "high" | "critical";
    isMain?: boolean;
    label?: string;
    confidence?: number;
    transactionCount?: number;
    attackType?: string;
    profit?: number;
    loss?: number;
  } | null;
  mainAddress: string;
}

// Risk level explanations with detailed recommendations
const riskExplanations = {
  low: {
    title: "Low Risk",
    color: "green",
    icon: Shield,
    description: "This address shows minimal privacy concerns. Interactions with this address are unlikely to compromise your anonymity.",
    implications: [
      "Standard wallet activity detected",
      "No known associations with tracking services",
      "Low transaction correlation risk",
    ],
    risks: [
      "General on-chain visibility (all transactions are public)",
      "Potential future analysis if blockchain analytics improve",
    ],
    recommendations: [
      "Continue normal operations - this connection is safe",
      "Monitor for any changes in the address's risk profile",
      "Consider using ShadowWire for high-value transactions regardless",
    ],
  },
  medium: {
    title: "Medium Risk",
    color: "yellow",
    icon: AlertTriangle,
    description: "This address has some privacy considerations. Regular interactions may create traceable patterns.",
    implications: [
      "Moderate transaction volume detected",
      "Some interactions may be traceable",
      "Consider using privacy-enhancing tools",
    ],
    risks: [
      "Transaction pattern analysis possible",
      "Timing correlations may reveal activity windows",
      "Amount fingerprinting could link transactions",
    ],
    recommendations: [
      "Use ShadowWire for future transactions with this address",
      "Randomize transaction timing to break temporal patterns",
      "Consider batching transactions to obscure amounts",
      "Use address rotation for repeat interactions",
    ],
  },
  high: {
    title: "High Risk",
    color: "red",
    icon: AlertTriangle,
    description: "This address poses significant privacy risks. Interactions could expose your identity or transaction patterns.",
    implications: [
      "High correlation with identifiable addresses",
      "Possible KYC exchange or tracking service",
      "Transactions may be easily linked to your wallet",
    ],
    risks: [
      "Direct KYC linkage through exchange records",
      "Blockchain analysis firms actively tracking this address",
      "Government/regulatory access to transaction data",
      "Your real identity may already be associated",
    ],
    recommendations: [
      "Minimize further interactions with this address",
      "Use intermediate wallets with no prior history",
      "Route ALL transactions through ShadowWire",
      "Consider using decoy transactions to confuse analysis",
      "Avoid time-sensitive transactions that reveal timezone",
    ],
  },
  critical: {
    title: "Critical Risk",
    color: "red",
    icon: AlertTriangle,
    description: "This address is strongly associated with identity exposure. Avoid further interactions if possible.",
    implications: [
      "Direct link to KYC/identity verification",
      "Known tracking or surveillance address",
      "High probability of deanonymization",
    ],
    risks: [
      "Your identity is likely already compromised through this link",
      "All historical transactions may be traced to you",
      "Future transactions will be monitored",
      "Potential legal/compliance implications",
    ],
    recommendations: [
      "STOP all direct interactions immediately",
      "Create new wallets with no connection to this address",
      "Use multi-hop routing through ShadowWire",
      "Consider your operational security compromised",
      "Use fresh addresses for all future activity",
    ],
  },
};

// Node type explanations
const typeExplanations = {
  wallet: {
    title: "Wallet Address",
    icon: Wallet,
    description: "A standard Solana wallet address that may belong to an individual, organization, or automated service.",
  },
  exchange: {
    title: "Exchange Address",
    icon: Building2,
    description: "This address is associated with a cryptocurrency exchange. Exchanges typically require KYC verification, which can link transactions to real identities.",
  },
  program: {
    title: "Program Address",
    icon: Code,
    description: "A Solana program (smart contract) address. Programs execute on-chain logic and may be DeFi protocols, NFT marketplaces, or other dApps.",
  },
  mev: {
    title: "MEV Bot",
    icon: Zap,
    description: "A Maximum Extractable Value (MEV) bot that exploits transaction ordering. This bot has extracted value from your transactions through sandwich attacks, frontrunning, or arbitrage.",
  },
  stealth: {
    title: "Stealth Transfer",
    icon: Lock,
    description: "A privacy-enhanced transaction using stealth address technology. The recipient's identity is protected through cryptographic means.",
  },
};

export function NodeDetailModal({ isOpen, onClose, node, mainAddress }: NodeDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!node) return null;

  const riskInfo = riskExplanations[node.riskLevel];
  const typeInfo = typeExplanations[node.type];
  const RiskIcon = riskInfo.icon;
  const TypeIcon = typeInfo.icon;

  const copyAddress = () => {
    navigator.clipboard.writeText(node.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openExplorer = () => {
    window.open(`https://explorer.solana.com/address/${node.address}?cluster=devnet`, "_blank");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal - Compact */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[95vw] max-w-lg"
          >
            <div className="bg-gray-900/95 border-2 border-blue-500/30 rounded-xl shadow-2xl shadow-blue-500/10 overflow-hidden">
              {/* Header */}
              <div className={`
                px-4 py-2 border-b border-blue-500/20 flex-shrink-0
                ${riskInfo.color === 'green' ? 'bg-green-500/10' : ''}
                ${riskInfo.color === 'yellow' ? 'bg-yellow-500/10' : ''}
                ${riskInfo.color === 'red' ? 'bg-red-500/10' : ''}
              `}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RiskIcon className={`h-5 w-5
                      ${riskInfo.color === 'green' ? 'text-green-400' : ''}
                      ${riskInfo.color === 'yellow' ? 'text-yellow-400' : ''}
                      ${riskInfo.color === 'red' ? 'text-red-400' : ''}
                    `} />
                    <div>
                      <h3 className="text-base font-bold text-white">{riskInfo.title}</h3>
                      <p className="text-xs text-gray-400">{typeInfo.title}</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Content - Compact */}
              <div className="p-3 space-y-3">
                {/* Address */}
                <div className="flex items-center gap-2 bg-black/40 rounded-lg p-2 border border-blue-500/20">
                  <code className="flex-1 text-xs font-mono text-blue-400 truncate">
                    {node.address}
                  </code>
                  <button onClick={copyAddress} className="p-1.5 rounded hover:bg-white/10" title="Copy">
                    {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 text-gray-400" />}
                  </button>
                  <button onClick={openExplorer} className="p-1.5 rounded hover:bg-white/10" title="Explorer">
                    <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                </div>

                {/* Risk + Confidence Row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className={`rounded-lg p-2 border ${riskInfo.color === 'green' ? 'bg-green-500/10 border-green-500/30' : ''} ${riskInfo.color === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/30' : ''} ${riskInfo.color === 'red' ? 'bg-red-500/10 border-red-500/30' : ''}`}>
                    <span className="text-[10px] text-gray-500 uppercase">Risk Level</span>
                    <p className={`text-sm font-bold ${riskInfo.color === 'green' ? 'text-green-400' : ''} ${riskInfo.color === 'yellow' ? 'text-yellow-400' : ''} ${riskInfo.color === 'red' ? 'text-red-400' : ''}`}>
                      {riskInfo.title}
                    </p>
                  </div>
                  {!node.isMain && (
                    <div className="bg-black/40 rounded-lg p-2 border border-blue-500/20">
                      <span className="text-[10px] text-gray-500 uppercase">Confidence</span>
                      <p className="text-sm font-bold text-white">{node.confidence || 60}%</p>
                    </div>
                  )}
                  {node.isMain && (
                    <div className="bg-blue-500/10 rounded-lg p-2 border border-blue-500/30">
                      <span className="text-[10px] text-gray-500 uppercase">Status</span>
                      <p className="text-sm font-bold text-blue-400">Your Wallet</p>
                    </div>
                  )}
                </div>

                {/* Interaction Summary - Detailed Transparency */}
                <div className="bg-gray-800/40 rounded-lg p-2 border border-gray-600/20">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-gray-400">
                      {!node.isMain ? (
                        <><span className="text-blue-400 font-semibold">{node.transactionCount || 0}</span> direct transactions detected with this address</>
                      ) : (
                        <>Analyzed <span className="text-blue-400 font-semibold">{node.transactionCount || 0}</span> total transactions from your wallet</>
                      )}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {!node.isMain ? (
                        <>Risk assessment: {node.confidence > 80 ? 'High frequency + known exchange patterns' : node.confidence > 50 ? 'Multiple repeated interactions found' : 'Low correlation with identity exposure'} ({node.confidence?.toFixed(0)}% confidence)</>
                      ) : (
                        <>Privacy calculated using transaction graph analysis, temporal patterns, and compliance checks</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Key Risks - Only first 2 */}
                <div className={`rounded-lg p-2 border ${riskInfo.color === 'green' ? 'bg-green-500/5 border-green-500/20' : ''} ${riskInfo.color === 'yellow' ? 'bg-yellow-500/5 border-yellow-500/20' : ''} ${riskInfo.color === 'red' ? 'bg-red-500/5 border-red-500/20' : ''}`}>
                  <span className="text-[10px] text-gray-500 uppercase">Key Risks</span>
                  <div className="mt-1 space-y-0.5">
                    {riskInfo.risks.slice(0, 2).map((risk, i) => (
                      <p key={i} className="text-xs text-gray-300">• {risk}</p>
                    ))}
                  </div>
                </div>

                {/* Top Recommendation */}
                <div className={`rounded-lg p-2 border ${riskInfo.color === 'green' ? 'bg-green-500/5 border-green-500/20' : ''} ${riskInfo.color === 'yellow' ? 'bg-yellow-500/5 border-yellow-500/20' : ''} ${riskInfo.color === 'red' ? 'bg-red-500/5 border-red-500/20' : ''}`}>
                  <span className="text-[10px] text-gray-500 uppercase">💡 Recommendation</span>
                  <p className="text-xs text-gray-300 mt-1">{riskInfo.recommendations[0]}</p>
                </div>
              </div>

              {/* Footer - Compact */}
              <div className="px-3 py-2 border-t border-blue-500/20 bg-black/40">
                <Button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm h-8">
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
