"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TerminalHeader } from "@/components/terminal-header";
import { GlobeBackground } from "@/components/globe-background";
import { WalletInput } from "@/components/wallet-input";
import Orb from "@/components/Orb";
import { Shield, Eye, Lock } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const handleAnalyze = (address: string) => {
    setSelectedWallet(address);
    router.push(`/analysis/${address}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Animated Background */}
      <GlobeBackground />

      {/* Floating Terminal Header */}
      <div className="absolute top-8 right-8 z-20">
        <TerminalHeader />
      </div>

      {/* Main Content */}
      <main className="relative z-10 px-6">
        {/* Hero Section */}
        <section className="flex min-h-screen items-center justify-center py-12">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center w-full">
          
          {/* Left Column - Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center gap-3"
            >
              <div className="px-4 py-1.5 rounded-full border-2 border-blue-500/40 bg-blue-500/10 text-sm font-mono uppercase tracking-wider text-blue-300 inline-flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Devnet Privacy Analysis
              </div>
              <div className="px-4 py-1.5 rounded-full border-2 border-yellow-500/40 bg-yellow-500/10 text-sm font-mono uppercase tracking-wider text-yellow-300 inline-flex items-center gap-2 animate-pulse">
                <span className="text-base">🚀</span>
                Mainnet Coming Soon!
              </div>
            </motion.div>

            {/* Main Heading */}
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-5xl lg:text-6xl font-bold tracking-tight leading-tight"
              >
                Visualize your
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400">
                  privacy footprint
                </span>
                <br />
                on Solana
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-lg text-gray-300 max-w-xl leading-relaxed"
              >
                Discover hidden transaction patterns, deanonymization risks, and
                privacy leaks across the gossip chain. Built for developers,
                secured for founders.
              </motion.p>
            </div>

            {/* Wallet Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <WalletInput onAnalyze={handleAnalyze} />
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-3 gap-4 pt-4"
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <Eye className="h-6 w-6 text-blue-400" />
                </div>
                <p className="text-xs text-gray-300 font-mono">
                  Deanonymization
                  <br />
                  Analysis
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-blue-400" />
                </div>
                <p className="text-xs text-gray-300 font-mono">
                  MEV Risk
                  <br />
                  Detection
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <Lock className="h-6 w-6 text-blue-400" />
                </div>
                <p className="text-xs text-gray-300 font-mono">
                  Privacy Cost
                  <br />
                  Metrics
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Visualization Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative hidden lg:block"
          >
            <div className="relative aspect-square max-h-[500px]">
              {/* Glowing orb effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-transparent blur-3xl" />
              
              {/* Animated Orb Visualization */}
              <div className="relative h-full w-full rounded-2xl border-2 border-blue-500/20 bg-black/40 backdrop-blur-sm overflow-hidden">
                <Orb
                  hue={180}
                  hoverIntensity={1.5}
                  rotateOnHover
                  forceHoverState={false}
                  backgroundColor="#000000"
                />
                
                {/* Text Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="text-center space-y-3 px-8"
                  >
                    <div className="inline-block px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 backdrop-blur-md">
                      <span className="text-sm font-mono text-blue-400 font-bold uppercase tracking-wider">
                        Real-Time Analysis
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                      Uncover Hidden
                      <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                        Privacy Risks
                      </span>
                    </h3>
                    <p className="text-sm text-gray-300 max-w-xs mx-auto leading-relaxed">
                      Analyze transaction patterns, detect MEV exposure, and visualize deanonymization paths in the Solana gossip network
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-24 border-t border-blue-500/10">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold mb-4">
                Complete <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Privacy Intelligence</span>
              </h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Advanced blockchain forensics meet privacy-first design. See what others can&apos;t.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: "🔍",
                  title: "Transaction Graph Analysis",
                  description: "Visualize complex wallet relationships and transaction flows through an interactive network graph. Identify clusters and connection patterns.",
                  delay: 0.1
                },
                {
                  icon: "🎯",
                  title: "Deanonymization Detection",
                  description: "Discover potential privacy leaks and identity correlation risks across the Solana gossip chain before bad actors do.",
                  delay: 0.2
                },
                {
                  icon: "⚡",
                  title: "MEV Exposure Tracking",
                  description: "Monitor your wallet's visibility to MEV bots and front-running attacks. Get real-time risk scores and mitigation strategies.",
                  delay: 0.3
                },
                {
                  icon: "🛡️",
                  title: "Privacy Scoring",
                  description: "Quantifiable privacy metrics based on transaction patterns, address clustering, and temporal analysis. Know your privacy posture.",
                  delay: 0.4
                },
                {
                  icon: "🎨",
                  title: "Compliance Heatmaps",
                  description: "Visual compliance risk mapping showing jurisdictional exposure and regulatory touch points across your transaction history.",
                  delay: 0.5
                },
                {
                  icon: "📊",
                  title: "AI-Powered Insights",
                  description: "Gemini AI analyzes patterns and generates actionable privacy recommendations tailored to your specific wallet behavior.",
                  delay: 0.6
                }
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: feature.delay }}
                  className="group relative p-6 rounded-xl border-2 border-blue-500/20 bg-black/40 backdrop-blur-sm hover:border-blue-500/40 hover:bg-blue-500/5 transition-all duration-300"
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-3 text-white group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="relative py-24 border-t border-blue-500/10">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold mb-4">
                How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Works</span>
              </h2>
              <p className="text-gray-300 text-lg">
                Privacy analysis in three simple steps
              </p>
            </motion.div>

            <div className="space-y-12">
              {[
                {
                  step: "01",
                  title: "Enter Wallet Address",
                  description: "Paste any Solana wallet address from Devnet. Our system immediately begins fetching transaction history and building the relationship graph.",
                  icon: "🔗"
                },
                {
                  step: "02",
                  title: "Deep Analysis Pipeline",
                  description: "We analyze transactions across multiple dimensions: temporal patterns, address clustering, program interactions, MEV exposure, and cross-chain correlations using Helius, Range, and QuickNode APIs.",
                  icon: "⚙️"
                },
                {
                  step: "03",
                  title: "Visual Intelligence",
                  description: "Navigate an interactive graph showing wallet relationships, privacy risks, compliance heatmaps, and AI-generated recommendations. Export reports in JSON or Markdown.",
                  icon: "📈"
                }
              ].map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="flex gap-8 items-start"
                >
                  <div className="flex-shrink-0">
                    <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-3xl">
                      {step.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="text-5xl font-bold text-white/70">{step.step}</span>
                      <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                    </div>
                    <p className="text-gray-300 text-lg leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 border-t border-blue-500/10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <h2 className="text-5xl font-bold">
                Ready to see your <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400">
                  privacy footprint?
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Start analyzing Solana wallets on Devnet. No signup required, completely free.
              </p>
              <div className="flex justify-center">
                <WalletInput onAnalyze={handleAnalyze} />
              </div>
              <div className="flex items-center justify-center gap-6 text-sm text-gray-500 font-mono">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Devnet Only
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Open Source
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Privacy First
                </span>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="relative z-50 border-t border-blue-500/10 bg-black/80 backdrop-blur-sm px-6 py-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-4 mb-4">
            <p className="text-gray-400 text-sm text-center max-w-2xl">
              <span className="text-blue-400 font-semibold">ECHO</span> — Making blockchain privacy risks visible and actionable
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-blue-500/10">
            <span className="text-gray-300 font-mono text-sm">
              Developed by <span className="text-blue-400 font-semibold">Shawn Chee</span>
            </span>
            <div className="flex items-center gap-6">
            <a
              href="https://www.linkedin.com/in/shawn-chee-b39384267/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-400 transition-colors font-mono text-sm flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </a>
            <a
              href="https://github.com/Shawnchee/ECHO"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-blue-400 transition-colors font-mono text-sm flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              GitHub
            </a>
          </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
