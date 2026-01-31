import React from 'react';
import { ShieldCheck, Eye, EyeOff, ArrowRight, Lock, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

const PrivacySolution: React.FC = () => {
  return (
    <div className="mt-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-solana-purple/20 via-background to-solana-green/10 border border-white/10 p-1 md:p-8">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldCheck className="w-64 h-64 text-solana-purple" />
        </div>

        <div className="relative z-10 space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-3xl md:text-5xl font-black tracking-tighter">
              Reduce Your Exposure with <br />
              <span className="solana-text-gradient">Selective Privacy</span>
            </h3>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-medium">
              On Solana, your entire history is an open book. Use selective encryption to hide specific actions while maintaining full chain usability.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Normal Tx */}
            <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/5 space-y-6">
              <div className="flex items-center gap-3 text-red-400 font-black text-xs uppercase tracking-widest">
                <Eye className="w-4 h-4" /> Normal Transaction
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Asset & Amount</span>
                  <span className="text-xs font-mono font-bold text-foreground">142.5 SOL ($18,450)</span>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Route & DEX</span>
                  <span className="text-xs font-mono font-bold text-foreground">Jupiter {'->'} Phoenix</span>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Balance Change</span>
                  <span className="text-xs font-mono font-bold text-foreground">Publicly Verified</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Everything is visible to MEV bots, copy-traders, and analysis tools. Your net worth is effectively public.
              </p>
            </div>

            {/* Encrypted Tx */}
            <div className="p-8 rounded-[2.5rem] bg-solana-purple/10 border border-solana-purple/20 space-y-6 shadow-2xl shadow-solana-purple/10">
              <div className="flex items-center gap-3 text-solana-purple font-black text-xs uppercase tracking-widest">
                <EyeOff className="w-4 h-4" /> encrypt.trade (Encrypted)
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-solana-purple/10 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Asset & Amount</span>
                  <div className="flex items-center gap-2">
                    <Lock className="w-3 h-3 text-solana-purple" />
                    <span className="text-xs font-mono font-bold text-solana-purple">ENCRYPTED</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-solana-purple/10 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Route & DEX</span>
                  <div className="flex items-center gap-2">
                    <Lock className="w-3 h-3 text-solana-purple" />
                    <span className="text-xs font-mono font-bold text-solana-purple">ENCRYPTED</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-solana-purple/10 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Balance Change</span>
                  <span className="text-xs font-mono font-bold text-foreground">Verified but Private</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Hide sensitive actions without breaking usability. Only what matters stays private. Powered by ZK proofs.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <a
              href="https://app.encifher.io"
              target="_blank"
              className="group flex items-center gap-3 px-12 py-5 bg-solana-purple text-white rounded-[2rem] font-black text-xl hover:bg-solana-purple/90 transition-all shadow-2xl shadow-solana-purple/30 active:scale-95"
            >
              Try encrypt.trade Now
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </a>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              <Zap className="w-3 h-3 text-solana-green" />
              Sponsored by encrypt.trade — Privacy Track Sponsor
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySolution;