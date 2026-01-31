'use client';

import { useEffect, useState } from 'react';
import { 
  initLightProtocol, 
  getLightStatus, 
  testLightProtocol,
  LIGHT_PROGRAM_IDS 
} from '@/lib/light-compression';
import { Shield, CheckCircle, XCircle, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LightStatus {
  initialized: boolean;
  sdkLoaded: boolean;
  compressionReady: boolean;
  mode: 'full' | 'fallback';
  rpcType: 'helius' | 'standard';
}

interface TestResult {
  sdkAvailable: boolean;
  rpcConnected: boolean;
  heliusConfigured: boolean;
  compressionSupported: boolean;
  mode: 'full' | 'fallback';
  error?: string;
}

export function LightProtocolStatus({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<LightStatus | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initLightProtocol();
      setStatus(getLightStatus());
      setLoading(false);
    };
    init();
  }, []);

  const runTest = async () => {
    setTesting(true);
    const result = await testLightProtocol();
    setTestResult(result);
    setTesting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Loader2 className="w-3 h-3 animate-spin" />
        Checking Light Protocol...
      </div>
    );
  }

  const isFullMode = status?.mode === 'full';

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-1.5 text-xs px-2 py-1 rounded",
        isFullMode 
          ? "bg-emerald-500/20 text-emerald-400" 
          : "bg-amber-500/20 text-amber-400"
      )}>
        <Shield className="w-3 h-3" />
        <span>{isFullMode ? 'ZK Compression Active' : 'Privacy Fallback'}</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-3 border rounded-lg",
      isFullMode 
        ? "bg-emerald-500/10 border-emerald-500/30" 
        : "bg-amber-500/10 border-amber-500/30"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Shield className={cn(
            "w-4 h-4",
            isFullMode ? "text-emerald-400" : "text-amber-400"
          )} />
          <span className="text-sm font-medium text-white">
            Light Protocol
          </span>
        </div>
        <span className={cn(
          "text-xs px-2 py-0.5 rounded",
          isFullMode 
            ? "bg-emerald-500/20 text-emerald-400" 
            : "bg-amber-500/20 text-amber-400"
        )}>
          {isFullMode ? 'FULL COMPRESSION' : 'FALLBACK MODE'}
        </span>
      </div>
      
      <div className="space-y-1 text-xs">
        <StatusRow 
          ok={status?.sdkLoaded} 
          label="SDK Loaded" 
        />
        <StatusRow 
          ok={status?.compressionReady} 
          label="Compression RPC" 
        />
        <StatusRow 
          ok={status?.rpcType === 'helius'} 
          label="Helius RPC" 
          warning={status?.rpcType !== 'helius'}
        />
      </div>
      
      {!isFullMode && (
        <div className="mt-2 p-2 bg-amber-500/10 rounded text-[10px] text-amber-300/80">
          <div className="flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Running in Fallback Mode</p>
              <p className="mt-0.5 text-zinc-400">
                Deposits use standard transfers with local privacy tracking.
                For full ZK compression, set <code className="bg-black/30 px-1 rounded">NEXT_PUBLIC_HELIUS_API_KEY</code> in .env.local
              </p>
            </div>
          </div>
        </div>
      )}

      {testResult && (
        <div className="mt-2 p-2 bg-black/20 rounded text-[10px]">
          <p className="font-medium text-zinc-300 mb-1">Test Results:</p>
          <div className="space-y-0.5 text-zinc-400">
            <p>SDK: {testResult.sdkAvailable ? '✓' : '✗'}</p>
            <p>RPC: {testResult.rpcConnected ? '✓' : '✗'}</p>
            <p>Helius: {testResult.heliusConfigured ? '✓' : '✗'}</p>
            <p>Compression: {testResult.compressionSupported ? '✓' : '✗'}</p>
            {testResult.error && <p className="text-red-400">Error: {testResult.error}</p>}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-3">
        <button
          onClick={runTest}
          disabled={testing}
          className="text-[10px] text-sky-400 hover:text-sky-300 disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Run Diagnostics'}
        </button>
        
        <a
          href={`https://solscan.io/account/${LIGHT_PROGRAM_IDS.lightSystemProgram}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300"
        >
          View Light Program <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

function StatusRow({ 
  ok, 
  label, 
  warning = false 
}: { 
  ok?: boolean; 
  label: string; 
  warning?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle className="w-3 h-3 text-emerald-400" />
      ) : warning ? (
        <AlertTriangle className="w-3 h-3 text-amber-400" />
      ) : (
        <XCircle className="w-3 h-3 text-red-400" />
      )}
      <span className="text-zinc-400">{label}</span>
    </div>
  );
}

// Export a small inline badge for headers
export function LightProtocolBadge() {
  const [mode, setMode] = useState<'full' | 'fallback' | null>(null);

  useEffect(() => {
    const check = async () => {
      await initLightProtocol();
      const status = getLightStatus();
      setMode(status.mode);
    };
    check();
  }, []);

  if (!mode) return null;

  return (
    <span className={cn(
      "text-[10px] px-1.5 py-0.5 rounded font-medium",
      mode === 'full' 
        ? "bg-emerald-500/20 text-emerald-400" 
        : "bg-amber-500/20 text-amber-400"
    )}>
      {mode === 'full' ? 'ZK' : 'Fallback'}
    </span>
  );
}
