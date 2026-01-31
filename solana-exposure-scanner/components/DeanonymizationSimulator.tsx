import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Eye, ArrowRight, AlertTriangle, Shield, Lock, Unlock,
    Building2, User, Wallet, Globe, Network, FileSearch,
    ChevronRight, Play, RotateCcw
} from 'lucide-react';
import { ExposureData } from '../types/api';

interface DeanonymizationSimulatorProps {
    walletAddress: string;
    data: ExposureData;
}

const DeanonymizationSimulator: React.FC<DeanonymizationSimulatorProps> = ({ walletAddress, data }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showResult, setShowResult] = useState(false);

    const truncatedAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

    // Build simulation steps based on actual wallet data
    const steps = [
        {
            id: 1,
            icon: Wallet,
            color: 'text-solana-green',
            bgColor: 'bg-solana-green/20',
            borderColor: 'border-solana-green/30',
            title: 'Target Identified',
            subtitle: 'Wallet enters surveillance scope',
            description: `A surveillance company spots wallet ${truncatedAddress} making on-chain activity. They begin building a profile.`,
            dataPoint: `${data.tradeCount} transactions now being analyzed`,
        },
        {
            id: 2,
            icon: Network,
            color: 'text-solana-purple',
            bgColor: 'bg-solana-purple/20',
            borderColor: 'border-solana-purple/30',
            title: 'Network Mapping',
            subtitle: 'Clustering analysis begins',
            description: `Algorithms detect ${data.clustering.interactedCount} connected addresses. Pattern matching identifies wallet clusters.`,
            dataPoint: `${data.clustering.topAddresses.length} addresses now linked to you`,
        },
        {
            id: 3,
            icon: Building2,
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-500/20',
            borderColor: 'border-yellow-500/30',
            title: 'Exchange Detection',
            subtitle: 'KYC linkage established',
            description: `Deposit to a centralized exchange detected. Your government ID, SSN, and address are now linked to this wallet.`,
            dataPoint: 'Real identity now connected',
        },
        {
            id: 4,
            icon: FileSearch,
            color: 'text-orange-500',
            bgColor: 'bg-orange-500/20',
            borderColor: 'border-orange-500/30',
            title: 'Financial Profiling',
            subtitle: 'Wealth assessment complete',
            description: `Your entire portfolio is analyzed. Net worth: $${data.netWorthUsd.toLocaleString()}. Trading patterns, risk appetite, and investment strategy are documented.`,
            dataPoint: `${data.memecoinTrades} speculative trades flagged`,
        },
        {
            id: 5,
            icon: User,
            color: 'text-red-500',
            bgColor: 'bg-red-500/20',
            borderColor: 'border-red-500/30',
            title: 'Full Deanonymization',
            subtitle: 'Identity confirmed',
            description: 'All connected wallets are now linked to your real identity. Your complete on-chain history is attributed to you—permanently.',
            dataPoint: `Exposure Score: ${data.exposureScore}/100`,
        },
    ];

    useEffect(() => {
        if (isPlaying && currentStep < steps.length) {
            const timer = setTimeout(() => {
                setCurrentStep(prev => prev + 1);
            }, 3000);
            return () => clearTimeout(timer);
        } else if (currentStep >= steps.length) {
            setIsPlaying(false);
            setShowResult(true);
        }
    }, [isPlaying, currentStep, steps.length]);

    const startSimulation = () => {
        setCurrentStep(0);
        setShowResult(false);
        setIsPlaying(true);
    };

    const resetSimulation = () => {
        setCurrentStep(0);
        setIsPlaying(false);
        setShowResult(false);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-red-400">Surveillance Simulation</span>
                </div>
                <h3 className="text-3xl font-black tracking-tighter uppercase">
                    How You Get <span className="text-red-400">Deanonymized</span>
                </h3>
                <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                    Watch step-by-step how surveillance companies track, profile, and identify your wallet.
                </p>
            </div>

            {/* Control Buttons */}
            <div className="flex justify-center gap-4">
                {!isPlaying && currentStep === 0 && (
                    <motion.button
                        onClick={startSimulation}
                        className="flex items-center gap-3 px-8 py-4 bg-red-500 text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl shadow-red-500/30"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Play className="w-5 h-5" />
                        Start Simulation
                    </motion.button>
                )}
                {(currentStep > 0 || showResult) && (
                    <motion.button
                        onClick={resetSimulation}
                        className="flex items-center gap-3 px-6 py-3 bg-secondary/50 border border-border rounded-2xl font-black text-sm uppercase tracking-wider"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </motion.button>
                )}
            </div>

            {/* Progress Bar */}
            <div className="relative">
                <div className="h-2 bg-secondary/30 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-solana-green via-yellow-500 to-red-500"
                        initial={{ width: '0%' }}
                        animate={{ width: `${(currentStep / steps.length) * 100}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
                <div className="flex justify-between mt-2">
                    <span className="text-[10px] font-bold text-solana-green">Anonymous</span>
                    <span className="text-[10px] font-bold text-red-400">Fully Exposed</span>
                </div>
            </div>

            {/* Steps Display */}
            <div className="space-y-4">
                <AnimatePresence mode="wait">
                    {steps.map((step, idx) => (
                        idx < currentStep && (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, x: -50, height: 0 }}
                                animate={{ opacity: 1, x: 0, height: 'auto' }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5, type: 'spring' }}
                                className={`p-6 rounded-[2rem] ${step.bgColor} border ${step.borderColor} relative overflow-hidden`}
                            >
                                {/* Step Number */}
                                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center">
                                    <span className="text-xs font-black text-white">{step.id}</span>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-2xl ${step.bgColor} border ${step.borderColor} flex items-center justify-center shrink-0`}>
                                        <step.icon className={`w-6 h-6 ${step.color}`} />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <h4 className={`text-lg font-black tracking-tight ${step.color}`}>{step.title}</h4>
                                            <ChevronRight className={`w-4 h-4 ${step.color}`} />
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{step.subtitle}</span>
                                        </div>
                                        <p className="text-sm text-foreground/80 leading-relaxed">{step.description}</p>
                                        <div className="inline-block px-3 py-1 bg-black/20 rounded-lg">
                                            <span className="text-[10px] font-black text-white uppercase tracking-wider">{step.dataPoint}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Connection Line */}
                                {idx < currentStep - 1 && (
                                    <div className="absolute left-10 bottom-0 translate-y-full w-0.5 h-4 bg-gradient-to-b from-white/20 to-transparent" />
                                )}
                            </motion.div>
                        )
                    ))}
                </AnimatePresence>

                {/* Playing indicator */}
                {isPlaying && currentStep < steps.length && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-6 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center gap-4"
                    >
                        <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    className="w-2 h-2 rounded-full bg-solana-purple"
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
                                />
                            ))}
                        </div>
                        <span className="text-sm font-bold text-muted-foreground">Analyzing wallet...</span>
                    </motion.div>
                )}
            </div>

            {/* Final Result */}
            <AnimatePresence>
                {showResult && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-8 rounded-[2.5rem] bg-gradient-to-br from-red-500/20 to-orange-500/10 border border-red-500/30 space-y-6"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-red-500/30 flex items-center justify-center">
                                <Unlock className="w-8 h-8 text-red-400" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black tracking-tight text-red-400">Simulation Complete</h4>
                                <p className="text-sm text-muted-foreground">Your wallet has been fully profiled</p>
                            </div>
                        </div>

                        <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                <span className="text-red-400 font-bold">This is real.</span> Everything shown above can be done
                                by anyone with access to blockchain analysis tools. Your transactions are permanent and public.
                            </p>
                        </div>

                        {/* Solution CTA */}
                        <div className="p-6 rounded-2xl bg-solana-purple/20 border border-solana-purple/30 space-y-4">
                            <div className="flex items-center gap-3">
                                <Lock className="w-6 h-6 text-solana-purple" />
                                <h5 className="text-lg font-black text-solana-purple">Break The Chain</h5>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                <span className="text-solana-green font-bold">encrypt.trade</span> uses selective encryption to hide
                                specific transactions, breaking the surveillance chain while maintaining full blockchain verification.
                            </p>
                            <a
                                href="https://encrypt.trade"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-solana-purple text-white rounded-xl font-black text-sm uppercase tracking-wider hover:bg-solana-purple/90 transition-all"
                            >
                                <Shield className="w-4 h-4" />
                                Protect Your Privacy
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DeanonymizationSimulator;
