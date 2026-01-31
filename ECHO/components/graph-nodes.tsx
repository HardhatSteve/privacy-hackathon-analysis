"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Wallet, Code, Coins, Shield, AlertTriangle, Zap, Eye, Lock } from "lucide-react";
import { motion } from "framer-motion";

// MEV Badge Component
const MevBadge = ({ type, count }: { type: string; count?: number }) => {
  const badges: Record<string, { emoji: string; color: string; label: string }> = {
    sandwich: { emoji: "🥪", color: "red", label: "Sandwich" },
    frontrun: { emoji: "🏃", color: "orange", label: "Frontrun" },
    backrun: { emoji: "🔙", color: "yellow", label: "Backrun" },
    jit: { emoji: "⚡", color: "purple", label: "JIT" },
    liquidation: { emoji: "💀", color: "red", label: "Liquidated" },
  };
  
  const badge = badges[type] || { emoji: "⚠️", color: "gray", label: type };
  
  return (
    <span 
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded
        ${badge.color === 'red' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : ''}
        ${badge.color === 'orange' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : ''}
        ${badge.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : ''}
        ${badge.color === 'purple' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : ''}
        ${badge.color === 'gray' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' : ''}
      `}
      title={`${badge.label}${count ? ` (${count}x)` : ''}`}
    >
      <span>{badge.emoji}</span>
      {count && count > 1 && <span>×{count}</span>}
    </span>
  );
};

// Risk Badge Component
const RiskBadge = ({ level }: { level: "low" | "medium" | "high" | "critical" }) => {
  const config = {
    low: { color: "green", icon: Shield },
    medium: { color: "yellow", icon: Eye },
    high: { color: "orange", icon: AlertTriangle },
    critical: { color: "red", icon: AlertTriangle },
  };
  
  const { color, icon: Icon } = config[level];
  
  return (
    <span 
      className={`inline-flex items-center gap-0.5 px-1 py-0.5 text-[9px] font-bold uppercase rounded
        ${color === 'green' ? 'bg-green-500/20 text-green-400' : ''}
        ${color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' : ''}
        ${color === 'orange' ? 'bg-orange-500/20 text-orange-400' : ''}
        ${color === 'red' ? 'bg-red-500/20 text-red-400' : ''}
      `}
    >
      <Icon className="h-2.5 w-2.5" />
      {level}
    </span>
  );
};

// Wallet Node Component
export const WalletNode = memo(({ data }: NodeProps) => {
  const privacyColor =
    (data.privacyScore || 50) >= 70
      ? "green"
      : (data.privacyScore || 50) >= 40
        ? "yellow"
        : "red";

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-500/50 !border-blue-500" />
      
      <div className={`
        min-w-[180px] px-4 py-3 rounded-xl border-2 backdrop-blur-sm
        bg-black/80 shadow-lg transition-all duration-200
        hover:scale-105 hover:shadow-xl cursor-pointer
        ${data.isMain ? 'border-blue-500 shadow-blue-500/30' : 'border-blue-500/30'}
      `}>
        <div className="flex items-start gap-3">
          <div className={`
            p-2 rounded-lg
            ${privacyColor === 'green' ? 'bg-green-500/20 border border-green-500/40' : ''}
            ${privacyColor === 'yellow' ? 'bg-yellow-500/20 border border-yellow-500/40' : ''}
            ${privacyColor === 'red' ? 'bg-red-500/20 border border-red-500/40' : ''}
          `}>
            <Wallet className={`h-5 w-5
              ${privacyColor === 'green' ? 'text-green-400' : ''}
              ${privacyColor === 'yellow' ? 'text-yellow-400' : ''}
              ${privacyColor === 'red' ? 'text-red-400' : ''}
            `} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-white truncate">
                {data.label}
              </span>
              {data.badge && (
                <span className="text-xs">{data.badge}</span>
              )}
            </div>
            
            <code className="text-xs text-gray-400 font-mono block truncate">
              {data.address}
            </code>
            
            {/* MEV Badges */}
            {data.mevExposure && data.mevExposure.detected && (
              <div className="mt-2 flex flex-wrap gap-1">
                {data.mevExposure.types?.map((type: string, i: number) => (
                  <MevBadge key={i} type={type} />
                ))}
                {(!data.mevExposure.types || data.mevExposure.types.length === 0) && (
                  <MevBadge type="sandwich" count={data.mevExposure.count} />
                )}
              </div>
            )}
            
            {/* Risk Level Badge */}
            {data.riskLevel && (
              <div className="mt-1">
                <RiskBadge level={data.riskLevel} />
              </div>
            )}
            
            {data.balance !== undefined && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-mono">Balance:</span>
                <span className="text-xs text-blue-400 font-mono font-bold">
                  {data.balance.toFixed(2)} SOL
                </span>
              </div>
            )}
            
            {data.privacyScore !== undefined && (
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-mono">Privacy:</span>
                <span className={`text-xs font-mono font-bold
                  ${privacyColor === 'green' ? 'text-green-400' : ''}
                  ${privacyColor === 'yellow' ? 'text-yellow-400' : ''}
                  ${privacyColor === 'red' ? 'text-red-400' : ''}
                `}>
                  {data.privacyScore}/100
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500/50 !border-blue-500" />
    </motion.div>
  );
});

WalletNode.displayName = "WalletNode";

// Program Node Component
export const ProgramNode = memo(({ data }: NodeProps) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="relative"
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-500/50 !border-blue-500" />
      
      <div className="min-w-[160px] px-4 py-3 rounded-xl border-2 border-blue-500/30 bg-black/80 backdrop-blur-sm shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl hover:border-blue-500/50 cursor-pointer">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/40">
            <Code className="h-5 w-5 text-blue-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold text-white block truncate mb-1">
              {data.label}
            </span>
            
            <code className="text-xs text-gray-400 font-mono block truncate">
              {data.programId?.slice(0, 8)}...
            </code>
            
            {data.interactions && (
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xs text-gray-500 font-mono">
                  {data.interactions} interactions
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500/50 !border-blue-500" />
    </motion.div>
  );
});

ProgramNode.displayName = "ProgramNode";

// Exchange Node Component
export const ExchangeNode = memo(({ data }: NodeProps) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="relative"
    >
      <Handle type="target" position={Position.Top} className="!bg-orange-500/50 !border-orange-500" />
      
      <div className="min-w-[180px] px-4 py-3 rounded-xl border-2 border-orange-500/30 bg-black/80 backdrop-blur-sm shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl hover:border-orange-500/50 cursor-pointer">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/40">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-white truncate">
                {data.label}
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-500/20 text-orange-400 rounded">
                EXCHANGE
              </span>
            </div>
            
            <code className="text-xs text-gray-400 font-mono block truncate">
              {data.address?.slice(0, 16)}...
            </code>
            
            <div className="mt-2 text-xs text-orange-400/80 font-mono">
              ⚠️ KYC Required
            </div>
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-orange-500/50 !border-orange-500" />
    </motion.div>
  );
});

ExchangeNode.displayName = "ExchangeNode";

// Token Node Component
export const TokenNode = memo(({ data }: NodeProps) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="relative"
    >
      <Handle type="target" position={Position.Top} className="!bg-purple-500/50 !border-purple-500" />
      
      <div className="min-w-[150px] px-4 py-3 rounded-xl border-2 border-purple-500/30 bg-black/80 backdrop-blur-sm shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl hover:border-purple-500/50 cursor-pointer">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/40">
            <Coins className="h-5 w-5 text-purple-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-white">
                {data.symbol}
              </span>
            </div>
            
            <span className="text-xs text-gray-400 block truncate">
              {data.label}
            </span>
            
            {data.amount !== undefined && (
              <div className="mt-2">
                <span className="text-xs text-purple-400 font-mono font-bold">
                  {data.amount.toLocaleString()} {data.symbol}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-purple-500/50 !border-purple-500" />
    </motion.div>
  );
});

TokenNode.displayName = "TokenNode";

// MEV Node Component - Shows MEV attack indicators
export const MevNode = memo(({ data }: NodeProps) => {
  const attackType = data.attackType || "mev";
  const attackConfig: Record<string, { emoji: string; color: string; label: string }> = {
    sandwich: { emoji: "🥪", color: "red", label: "Sandwich Attack" },
    frontrun: { emoji: "🏃", color: "orange", label: "Frontrun" },
    backrun: { emoji: "🔙", color: "yellow", label: "Backrun" },
    jit: { emoji: "⚡", color: "purple", label: "JIT Liquidity" },
    liquidation: { emoji: "💀", color: "red", label: "Liquidation" },
    mev: { emoji: "🤖", color: "orange", label: "MEV Bot" },
  };
  
  const config = attackConfig[attackType] || attackConfig.mev;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="relative"
    >
      <Handle type="target" position={Position.Top} className={`
        ${config.color === 'red' ? '!bg-red-500/50 !border-red-500' : ''}
        ${config.color === 'orange' ? '!bg-orange-500/50 !border-orange-500' : ''}
        ${config.color === 'yellow' ? '!bg-yellow-500/50 !border-yellow-500' : ''}
        ${config.color === 'purple' ? '!bg-purple-500/50 !border-purple-500' : ''}
      `} />
      
      <div className={`
        min-w-[160px] px-4 py-3 rounded-xl border-2 bg-black/80 backdrop-blur-sm shadow-lg 
        transition-all duration-200 hover:scale-105 hover:shadow-xl cursor-pointer
        ${config.color === 'red' ? 'border-red-500/40 shadow-red-500/20' : ''}
        ${config.color === 'orange' ? 'border-orange-500/40 shadow-orange-500/20' : ''}
        ${config.color === 'yellow' ? 'border-yellow-500/40 shadow-yellow-500/20' : ''}
        ${config.color === 'purple' ? 'border-purple-500/40 shadow-purple-500/20' : ''}
      `}>
        <div className="flex items-start gap-3">
          <div className={`
            p-2 rounded-lg
            ${config.color === 'red' ? 'bg-red-500/20 border border-red-500/40' : ''}
            ${config.color === 'orange' ? 'bg-orange-500/20 border border-orange-500/40' : ''}
            ${config.color === 'yellow' ? 'bg-yellow-500/20 border border-yellow-500/40' : ''}
            ${config.color === 'purple' ? 'bg-purple-500/20 border border-purple-500/40' : ''}
          `}>
            <Zap className={`h-5 w-5
              ${config.color === 'red' ? 'text-red-400' : ''}
              ${config.color === 'orange' ? 'text-orange-400' : ''}
              ${config.color === 'yellow' ? 'text-yellow-400' : ''}
              ${config.color === 'purple' ? 'text-purple-400' : ''}
            `} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-white truncate">
                {config.emoji} {config.label}
              </span>
            </div>
            
            {data.address && (
              <code className="text-xs text-gray-400 font-mono block truncate">
                {data.address.slice(0, 12)}...
              </code>
            )}
            
            {data.profit !== undefined && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-mono">Profit:</span>
                <span className={`text-xs font-mono font-bold
                  ${config.color === 'red' ? 'text-red-400' : ''}
                  ${config.color === 'orange' ? 'text-orange-400' : ''}
                  ${config.color === 'yellow' ? 'text-yellow-400' : ''}
                  ${config.color === 'purple' ? 'text-purple-400' : ''}
                `}>
                  +{data.profit.toFixed(4)} SOL
                </span>
              </div>
            )}
            
            {data.loss !== undefined && (
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-mono">Your Loss:</span>
                <span className="text-xs text-red-400 font-mono font-bold">
                  -{data.loss.toFixed(4)} SOL
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className={`
        ${config.color === 'red' ? '!bg-red-500/50 !border-red-500' : ''}
        ${config.color === 'orange' ? '!bg-orange-500/50 !border-orange-500' : ''}
        ${config.color === 'yellow' ? '!bg-yellow-500/50 !border-yellow-500' : ''}
        ${config.color === 'purple' ? '!bg-purple-500/50 !border-purple-500' : ''}
      `} />
    </motion.div>
  );
});

MevNode.displayName = "MevNode";

// Stealth Node Component - Shows privacy-enhanced transactions
export const StealthNode = memo(({ data }: NodeProps) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="relative"
    >
      <Handle type="target" position={Position.Top} className="!bg-emerald-500/50 !border-emerald-500" />
      
      <div className="min-w-[160px] px-4 py-3 rounded-xl border-2 border-emerald-500/40 bg-black/80 backdrop-blur-sm shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:scale-105 hover:shadow-xl cursor-pointer">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40">
            <Lock className="h-5 w-5 text-emerald-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-white truncate">
                {data.label || "🔒 Stealth Transfer"}
              </span>
            </div>
            
            <span className="text-xs text-emerald-400 font-mono block">
              Privacy Enhanced
            </span>
            
            {data.protocol && (
              <div className="mt-2">
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30">
                  {data.protocol}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500/50 !border-emerald-500" />
    </motion.div>
  );
});

StealthNode.displayName = "StealthNode";

// Export node types configuration
export const nodeTypes = {
  wallet: WalletNode,
  program: ProgramNode,
  exchange: ExchangeNode,
  token: TokenNode,
  mev: MevNode,
  stealth: StealthNode,
};
