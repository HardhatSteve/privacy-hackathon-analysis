import React, { useState } from 'react';
import {
  ShieldAlert,
  ChevronDown,
  Search,
  Target,
  TrendingDown,
  Activity,
  User,
  Link as LinkIcon,
  AlertCircle,
  ExternalLink,
  DollarSign,
  Flame,
  MousePointer2,
  Info
} from 'lucide-react';
import { ExposureData } from '../types/api';
import { cn } from '../lib/utils';
import Tooltip from './Tooltip';
import ClusteringGraph from './ClusteringGraph';

interface RiskSectionProps {
  data: ExposureData;
}

const RiskSection: React.FC<RiskSectionProps> = ({ data }) => {
  const [openItem, setOpenItem] = useState<string | null>('risks');

  const toggleItem = (id: string) => {
    setOpenItem(openItem === id ? null : id);
  };

  const AccordionItem = ({
    id,
    title,
    icon: Icon,
    children,
    badge,
    tooltipContent
  }: {
    id: string;
    title: string;
    icon: any;
    children: React.ReactNode;
    badge?: string;
    tooltipContent?: string;
  }) => {
    const isOpen = openItem === id;
    return (
      <div className="border-b border-border last:border-0">
        <button
          onClick={() => toggleItem(id)}
          className="w-full py-6 flex items-center justify-between text-left group transition-colors hover:bg-white/[0.02] px-4 rounded-xl"
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              isOpen ? "bg-solana-purple/20 text-solana-purple" : "bg-secondary text-muted-foreground"
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-3">
              <h4 className="font-bold text-lg tracking-tight">
                {title}
              </h4>
              {tooltipContent && (
                <Tooltip content={tooltipContent}>
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </Tooltip>
              )}
              {badge && (
                <span className="px-2 py-0.5 rounded-full bg-solana-purple/10 text-solana-purple text-[10px] font-black uppercase tracking-widest border border-solana-purple/20">
                  {badge}
                </span>
              )}
            </div>
          </div>
          <ChevronDown className={cn(
            "w-5 h-5 text-muted-foreground transition-transform duration-300",
            isOpen && "rotate-180"
          )} />
        </button>
        <div className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[1000px] opacity-100 pb-8 px-4" : "max-h-0 opacity-0"
        )}>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-secondary/10 border border-border rounded-[2.5rem] overflow-hidden">
      <AccordionItem
        id="identity"
        title="Identity Leakage"
        icon={User}
        badge="Dox Check"
        tooltipContent="Explains why having a public address tied to your social profile is dangerous: it enables targetted harassment and social engineering."
      >
        <div className="space-y-6">
          <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl font-medium">
            If your address was ever posted publicly on social media or linked to a name service (SNS),
            automated bots have already indexed it. <span className="text-foreground">Selective privacy like encrypt.trade allows you to trade without linking back to these public IDs.</span>
          </p>

          {/* SNS Domains Warning */}
          {data.snsDomains && data.snsDomains.length > 0 && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-3">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                {data.snsDomains.length} SNS Domain{data.snsDomains.length > 1 ? 's' : ''} Detected - Direct Identity Link
              </div>
              <p className="text-xs text-red-300/80">
                Your wallet is permanently linked to these public identifiers. Anyone can search these on X, Google, or Solana explorers to find your transaction history.
              </p>
              <div className="flex flex-wrap gap-2">
                {data.snsDomains.map(domain => (
                  <a
                    key={domain}
                    href={`https://www.sns.id/domain/${domain}`}
                    target="_blank"
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-full text-xs font-bold text-red-300 border border-red-500/30 transition-all flex items-center gap-1.5"
                  >
                    {domain}.sol
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* X Search Section */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Search Your Exposure on X
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={data.links.xSearch}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2.5 bg-black border border-white/10 rounded-xl hover:border-solana-purple/50 hover:bg-white/5 transition-all text-xs font-bold group"
              >
                <Search className="w-4 h-4 text-solana-purple" />
                Search Wallet Address
                <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-solana-purple transition-colors" />
              </a>
              {data.links.snsSearch && (
                <a
                  href={data.links.snsSearch}
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl hover:border-red-500/50 hover:bg-red-500/20 transition-all text-xs font-bold text-red-300 group"
                >
                  <Search className="w-4 h-4 text-red-400" />
                  Search "{data.snsDomains[0]}.sol" on X
                  <ExternalLink className="w-3 h-3 text-red-400/60 group-hover:text-red-400 transition-colors" />
                </a>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground italic">
              Click to see if your address or SNS domain has been publicly shared on X (Twitter). Results show permanent public exposure.
            </p>
          </div>

          {/* Other Search Links */}
          <div className="flex flex-wrap gap-4">
            <a
              href={data.links.arkham}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-black border border-white/10 rounded-xl hover:border-solana-purple/50 transition-all text-xs font-bold"
            >
              <Target className="w-4 h-4 text-solana-purple" />
              Arkham Intelligence
            </a>
          </div>
        </div>
      </AccordionItem>

      <AccordionItem
        id="financial"
        title="Financial Profile"
        icon={DollarSign}
        badge="Portfolio"
        tooltipContent="Shows how much of your wealth is visible. High visibility increases the risk of being targeted by exploiters."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Estimated Value</span>
              <span className="text-solana-green font-mono font-black">${data.netWorthUsd.toLocaleString()}</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-solana-green w-[65%]" />
            </div>
            <p className="text-[10px] text-muted-foreground italic">Visibility of high-value assets makes you a target for spear-phishing.</p>
          </div>

          <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Memecoin Degeneracy</span>
              <span className="text-orange-400 font-mono font-black">{data.memecoinTrades} TRADES</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-orange-400 w-[80%]" />
            </div>
            <p className="text-[10px] text-muted-foreground italic">High interaction with unverified tokens suggests behavioral risks.</p>
          </div>
        </div>
      </AccordionItem>

      <AccordionItem
        id="clustering"
        title="Clustering & Network"
        icon={LinkIcon}
        badge="Connections"
        tooltipContent="Analyzes the 'crowd' you belong to. Clustering helps attackers guess your physical location or real-world identity via common touchpoints."
      >
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            You have interacted with <span className="text-foreground font-bold">{data.clustering.interactedCount}</span> unique addresses.
            {data.clustering.topAddresses && data.clustering.topAddresses.length > 0 && (
              <> Behavioral clustering links you to these top nodes:</>
            )}
          </p>
          {data.clustering.topAddresses && data.clustering.topAddresses.length > 0 ? (
            <>
              <div className="grid gap-2">
                {data.clustering.topAddresses.map((addr, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 group hover:border-solana-purple/30 transition-all cursor-default">
                    <span className="font-mono text-[11px] text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[200px] md:max-w-none">
                      {addr}
                    </span>
                    <MousePointer2 className="w-3.5 h-3.5 text-solana-purple opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 rounded-xl bg-solana-green/5 border border-solana-green/10 text-[11px] text-solana-green font-bold flex gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                Encrypting swaps on encrypt.trade breaks these cluster chains, preventing you from being grouped with compromised entities.
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">No clustering data available - wallet may have limited interaction history.</p>
          )}
        </div>
      </AccordionItem>

      <AccordionItem
        id="network"
        title="Network Visualization"
        icon={LinkIcon}
        badge="Graph"
        tooltipContent="Interactive visualization of your wallet's connection network. Each link represents a permanent, public connection that can be used for cluster analysis."
      >
        {data.clustering.networkNodes && data.clustering.networkNodes.length > 0 ? (
          <ClusteringGraph
            walletAddress={data.links.solscan.split('/').pop() || 'wallet'}
            networkNodes={data.clustering.networkNodes}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No network data available</p>
        )}
      </AccordionItem>

      <AccordionItem
        id="risks"
        title="Key Risks Detected"
        icon={ShieldAlert}
        badge={`${data.risks.length} Critical`}
        tooltipContent="Specific vulnerabilities identified by our AI scanner. These require immediate attention."
      >
        <ul className="space-y-4">
          {data.risks.map((risk, idx) => (
            <li key={idx} className="flex gap-4 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-colors">
              <div className="mt-1">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-sm font-medium leading-relaxed">{risk}</p>
            </li>
          ))}
        </ul>
      </AccordionItem>

      <AccordionItem
        id="activity"
        title="Recent Activity"
        icon={Activity}
        badge="Footprints"
        tooltipContent="Your most recent public footprints. Each entry represents data leaked to MEV bots and trackers."
      >
        {data.recentTxSummary && data.recentTxSummary.length > 0 ? (
          <div className="rounded-2xl border border-white/5 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Type</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Description</th>
                  <th className="px-4 py-3 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.recentTxSummary.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-bold uppercase">{tx.type}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-muted-foreground">{tx.description}</td>
                    <td className={cn(
                      "px-4 py-3 font-mono font-black text-right",
                      tx.amountUsd > 0 ? "text-solana-green" : "text-red-400"
                    )}>
                      ${Math.abs(tx.amountUsd).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No recent transaction data available</p>
        )}
      </AccordionItem>

      {/* DeFi Positions */}
      {data.defiPositions && data.defiPositions.length > 0 && (
        <AccordionItem
          id="defi"
          title="DeFi Positions"
          icon={DollarSign}
          badge="Protocols"
          tooltipContent="Your interactions with DeFi protocols reveal your trading strategies and financial activities."
        >
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Detected activity across <span className="text-foreground font-bold">{data.defiPositions.length}</span> DeFi protocols:
            </p>
            <div className="grid gap-2">
              {data.defiPositions.map((position, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 hover:border-solana-purple/30 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{position.protocol}</span>
                      <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-bold uppercase">
                        {position.type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last activity: {position.lastActivity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-black text-solana-green">
                      {position.interactions} txs
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AccordionItem>
      )}

      {/* Loss Analysis */}
      {data.topLosses && data.topLosses.length > 0 && (
        <AccordionItem
          id="losses"
          title="Estimated Losses"
          icon={TrendingDown}
          badge="Risk"
          tooltipContent="Estimated losses from memecoin trading and failed transactions - permanent on-chain record."
        >
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Detected potential losses from risky trading activities:
            </p>
            <div className="grid gap-2">
              {data.topLosses.map((loss, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/20 hover:border-red-500/40 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-red-400" />
                      <span className="font-bold text-foreground">{loss.protocol}</span>
                      <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-[10px] font-bold uppercase text-red-400">
                        {loss.type}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-black text-red-400">
                      -${loss.estimatedLoss.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10 text-[11px] text-yellow-400 font-bold flex gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              These losses are permanently visible on-chain and can be used to profile your risk tolerance and trading behavior.
            </div>
          </div>
        </AccordionItem>
      )}

      {/* Related Addresses */}
      {data.relatedAddresses && data.relatedAddresses.length > 0 && (
        <AccordionItem
          id="related"
          title="Related Addresses"
          icon={LinkIcon}
          badge="Secondary Wallets"
          tooltipContent="Addresses that received gas money from you - likely your other wallets. This links multiple identities together."
        >
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              Found <span className="text-foreground font-bold">{data.relatedAddresses.length}</span> potentially related addresses:
            </p>
            <div className="grid gap-2">
              {data.relatedAddresses.map((related, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 hover:border-solana-purple/30 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-foreground">{related.address}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
                        related.confidence === 'high' ? 'bg-red-500/20 text-red-400' :
                          related.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                      )}>
                        {related.confidence}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {related.reason}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-black text-solana-green">
                      {related.totalAmount} SOL
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {related.gasTransfers} transfers
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 rounded-xl bg-red-500/5 border border-red-500/10 text-[11px] text-red-400 font-bold flex gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              🚨 CRITICAL: These gas transfers permanently link multiple wallets to your identity. Surveillance firms use this to build complete profiles.
            </div>
          </div>
        </AccordionItem>
      )}
    </div>
  );
};

export default RiskSection;