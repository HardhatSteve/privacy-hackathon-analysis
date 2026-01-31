'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { 
  initLightProtocol,
  isLightReady, 
  isLightSdkAvailable, 
  getLightStatus,
  testLightProtocol,
  getCompressedBalance,
  LIGHT_PROGRAM_IDS 
} from '@/lib/light-compression';
import { Database, Zap, Shield, ExternalLink, CheckCircle, XCircle, AlertTriangle, RefreshCw, Wallet } from 'lucide-react';

export function CompressionStatus() {
  const { publicKey } = useWallet();
  const [status, setStatus] = useState<{
    initialized: boolean;
    sdkLoaded: boolean;
    compressionReady: boolean;
    mode: 'full' | 'fallback';
    rpcType: 'helius' | 'standard';
  } | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [compressedBalance, setCompressedBalance] = useState<number | null>(null);
  const [checkingBalance, setCheckingBalance] = useState(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await initLightProtocol();
      setStatus(getLightStatus());
      setLoading(false);
    };
    
    init();
    const interval = setInterval(() => {
      setStatus(getLightStatus());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const runDiagnostics = async () => {
    setTesting(true);
    const result = await testLightProtocol();
    setTestResult(result);
    setStatus(getLightStatus());
    setTesting(false);
  };

  const checkCompressedBalance = async () => {
    if (!publicKey) return;
    setCheckingBalance(true);
    try {
      const result = await getCompressedBalance(publicKey);
      setCompressedBalance(result.lamports);
      console.log('[Light] Compressed balance check:', result);
    } catch (error) {
      console.error('[Light] Failed to check compressed balance:', error);
      setCompressedBalance(0);
    }
    setCheckingBalance(false);
  };

  const isFullMode = status?.mode === 'full';

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
      <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center gap-2">
        <Zap className="w-4 h-4 text-purple-400" />
        ZK Compression
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
          isFullMode 
            ? 'text-emerald-400 bg-emerald-500/10' 
            : 'text-amber-400 bg-amber-500/10'
        }`}>
          {loading ? 'Loading...' : isFullMode ? 'ACTIVE' : 'FALLBACK'}
        </span>
      </h3>
      
      <div className="space-y-2.5">
        {/* SDK Status */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500 flex items-center gap-1.5">
            <Database className="w-3 h-3" />
            SDK Status
          </span>
          <span className={`flex items-center gap-1.5 ${status?.sdkLoaded ? 'text-emerald-400' : 'text-red-400'}`}>
            {status?.sdkLoaded ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            {loading ? '...' : status?.sdkLoaded ? 'Loaded' : 'Not Loaded'}
          </span>
        </div>
        
        {/* Compression RPC */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">Compression RPC</span>
          <span className={`flex items-center gap-1.5 ${status?.compressionReady ? 'text-emerald-400' : 'text-amber-400'}`}>
            {status?.compressionReady ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <AlertTriangle className="w-3 h-3" />
            )}
            {loading ? '...' : status?.compressionReady ? 'Connected' : 'Not Connected'}
          </span>
        </div>
        
        {/* RPC Type */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">RPC Provider</span>
          <span className={`text-xs ${status?.rpcType === 'helius' ? 'text-emerald-400' : 'text-amber-400'}`}>
            {loading ? '...' : status?.rpcType === 'helius' ? 'Helius' : 'Standard'}
          </span>
        </div>
        
        {/* Privacy Level */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500 flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            Privacy
          </span>
          <span className={`text-xs ${isFullMode ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isFullMode ? 'Full ZK (merkle roots)' : 'Tracking Only'}
          </span>
        </div>
      </div>
      
      {/* Compressed Balance Check */}
      {publicKey && (
        <div className="mt-3 pt-3 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500 flex items-center gap-1.5">
              <Wallet className="w-3 h-3" />
              Compressed Balance
            </span>
            {compressedBalance !== null && (
              <span className={`text-xs font-mono ${compressedBalance > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {(compressedBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL
              </span>
            )}
          </div>
          <button
            onClick={checkCompressedBalance}
            disabled={checkingBalance}
            className="w-full flex items-center justify-center gap-2 text-xs text-purple-400 hover:text-purple-300 py-1.5 bg-purple-500/10 rounded transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${checkingBalance ? 'animate-spin' : ''}`} />
            {checkingBalance ? 'Checking...' : 'Check Shielded Balance'}
          </button>
          {compressedBalance !== null && compressedBalance > 0 && (
            <p className="text-[10px] text-emerald-400/80 mt-1.5 text-center">
              ✓ You have shielded SOL in compressed accounts!
            </p>
          )}
        </div>
      )}
      
      {/* Diagnostics Button */}
      <div className="mt-3 pt-3 border-t border-zinc-800">
        <button
          onClick={runDiagnostics}
          disabled={testing}
          className="w-full flex items-center justify-center gap-2 text-xs text-zinc-400 hover:text-white py-2 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${testing ? 'animate-spin' : ''}`} />
          {testing ? 'Running Diagnostics...' : 'Run Diagnostics'}
        </button>
        
        {testResult && (
          <div className="mt-2 p-2 bg-zinc-800/50 rounded text-[10px] space-y-1">
            <div className="flex justify-between">
              <span className="text-zinc-500">SDK Available</span>
              <span className={testResult.sdkAvailable ? 'text-emerald-400' : 'text-red-400'}>
                {testResult.sdkAvailable ? '✓' : '✗'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">RPC Connected</span>
              <span className={testResult.rpcConnected ? 'text-emerald-400' : 'text-red-400'}>
                {testResult.rpcConnected ? '✓' : '✗'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Helius Configured</span>
              <span className={testResult.heliusConfigured ? 'text-emerald-400' : 'text-amber-400'}>
                {testResult.heliusConfigured ? '✓' : '✗'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Compression Support</span>
              <span className={testResult.compressionSupported ? 'text-emerald-400' : 'text-red-400'}>
                {testResult.compressionSupported ? '✓' : '✗'}
              </span>
            </div>
            {testResult.error && (
              <div className="text-red-400 mt-1 pt-1 border-t border-zinc-700">
                Error: {testResult.error}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Program IDs (collapsible) */}
      <details className="mt-3 pt-3 border-t border-zinc-800">
        <summary className="text-xs text-zinc-600 cursor-pointer hover:text-zinc-400 transition-colors">
          Program IDs
        </summary>
        <div className="mt-2 space-y-1 text-[10px] font-mono">
          <div className="flex justify-between text-zinc-600">
            <span>System</span>
            <a 
              href={`https://solscan.io/account/${LIGHT_PROGRAM_IDS.lightSystemProgram}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-purple-400 flex items-center gap-1"
            >
              {LIGHT_PROGRAM_IDS.lightSystemProgram.slice(0, 8)}...
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>Compression</span>
            <a 
              href={`https://solscan.io/account/${LIGHT_PROGRAM_IDS.accountCompression}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-purple-400 flex items-center gap-1"
            >
              {LIGHT_PROGRAM_IDS.accountCompression.slice(0, 8)}...
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </details>
      
      {/* Bounty tag */}
      <div className="mt-3 pt-3 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-600">Hackathon Bounty</span>
          <span className="text-xs text-purple-400 font-semibold">$18,000 Pool</span>
        </div>
      </div>
    </div>
  );
}
