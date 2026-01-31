'use client';

import { useState, useEffect } from 'react';
import { isNoirReady } from '@/lib/noir-proofs';
import { isLightReady, isLightSdkAvailable } from '@/lib/light-compression';
import { isHeliusAvailable } from '@/lib/helius';
import { Trophy, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface IntegrationStatusItem {
  name: string;
  bounty: number;
  status: 'active' | 'fallback' | 'inactive' | 'loading';
  statusText: string;
  docs?: string;
}

export function IntegrationStatus() {
  const [integrations, setIntegrations] = useState<IntegrationStatusItem[]>([
    { name: 'Noir ZK Proofs', bounty: 10000, status: 'loading', statusText: 'Loading...' },
    { name: 'Light Protocol', bounty: 18000, status: 'loading', statusText: 'Loading...' },
    { name: 'Helius RPC', bounty: 5000, status: 'loading', statusText: 'Loading...' },
  ]);
  const [totalBounty, setTotalBounty] = useState(33000);

  useEffect(() => {
    const checkIntegrations = async () => {
      const items: IntegrationStatusItem[] = [
        {
          name: 'Noir ZK Proofs',
          bounty: 10000,
          status: isNoirReady() ? 'active' : 'fallback',
          statusText: isNoirReady() ? 'Ready' : 'Fallback',
          docs: 'https://noir-lang.org/docs/',
        },
        {
          name: 'Light Protocol',
          bounty: 18000,
          status: isLightSdkAvailable() ? 'active' : isLightReady() ? 'fallback' : 'inactive',
          statusText: isLightSdkAvailable() ? 'Connected' : isLightReady() ? 'Fallback' : 'Not Ready',
          docs: 'https://www.zkcompression.com/',
        },
        {
          name: 'Helius RPC',
          bounty: 5000,
          status: isHeliusAvailable() ? 'active' : 'fallback',
          statusText: isHeliusAvailable() ? 'Connected' : 'Default RPC',
          docs: 'https://docs.helius.dev/',
        },
      ];
      
      setIntegrations(items);
      setTotalBounty(items.reduce((sum, item) => sum + item.bounty, 0));
    };
    
    checkIntegrations();
    
    // Re-check every 10 seconds
    const interval = setInterval(checkIntegrations, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'fallback': return <AlertCircle className="w-3 h-3 text-yellow-400" />;
      case 'loading': return <Loader2 className="w-3 h-3 text-zinc-500 animate-spin" />;
      default: return <AlertCircle className="w-3 h-3 text-red-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'fallback': return 'text-yellow-400';
      case 'loading': return 'text-zinc-500';
      default: return 'text-red-400';
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
      <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-400" />
        Hackathon Integrations
      </h3>
      
      <div className="space-y-2">
        {integrations.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-sm group">
            <div className="flex items-center gap-2">
              {getStatusIcon(item.status)}
              <span className="text-zinc-300">{item.name}</span>
              {item.docs && (
                <a
                  href={item.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink className="w-3 h-3 text-zinc-600 hover:text-zinc-400" />
                </a>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs ${getStatusColor(item.status)}`}>
                {item.statusText}
              </span>
              <span className="text-zinc-600 text-xs font-mono">
                ${item.bounty.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Total bounty */}
      <div className="mt-4 pt-3 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Total Target</span>
          <div className="text-right">
            <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              ${totalBounty.toLocaleString()}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-zinc-600 mt-1 text-right">
          All bounties available on devnet
        </p>
      </div>
    </div>
  );
}
