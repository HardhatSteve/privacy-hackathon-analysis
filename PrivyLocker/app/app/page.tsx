"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { MoveRight, Shield, Lock, FileKey } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const { connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-white selection:bg-purple-500/30">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-slate-950/50 backdrop-blur-xl fixed w-full z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-400" />
            <span className="font-bold text-xl tracking-tight">PrivyLocker</span>
          </div>
          <div className="flex items-center gap-4">
            <WalletMultiButton style={{ backgroundColor: '#9333ea', height: '40px' }} />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center pt-32 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/40 via-slate-950 to-slate-950 -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            Live on Solana Devnet + Inco Lightning
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            Your Digital Identity,<br />
            <span className="text-purple-400">Exclusively Yours.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Store personal documents securely with client-side encryption.
            Share only what matters using verifiable proofs - without ever revealing the raw file.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {connected ? (
              <Link
                href="/dashboard"
                className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-purple-600 px-8 font-medium text-white transition-all duration-300 hover:bg-purple-700 hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)] focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                <span className="mr-2">Go to Dashboard</span>
                <MoveRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-slate-500">Connect wallet to get started</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-950/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FileKey className="w-8 h-8 text-blue-400" />}
              title="Client-Side Encryption"
              description="Your documents are encrypted before they leave your device. Only you hold the keys."
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8 text-purple-400" />}
              title="Selective Disclosure"
              description="Prove you are over 18 without revealing your birthdate. Share attributes, not files."
            />
            <FeatureCard
              icon={<Lock className="w-8 h-8 text-emerald-400" />}
              title="Revocable Access"
              description="Full control over your data. Revoke access to any verifier instantly with one click."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors">
      <div className="mb-4 bg-slate-900/50 w-16 h-16 rounded-xl flex items-center justify-center border border-white/5">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
