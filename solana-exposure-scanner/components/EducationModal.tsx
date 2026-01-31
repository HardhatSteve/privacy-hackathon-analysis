import React, { useState } from 'react';
import { X, Eye, Target, Network, DollarSign, Shield, AlertTriangle, Lock } from 'lucide-react';

interface EducationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EducationModal: React.FC<EducationModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'surveillance' | 'techniques' | 'consequences'>('surveillance');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-background border border-border rounded-[3rem] shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border p-8 rounded-t-[3rem] z-10">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black tracking-tighter uppercase">How You're Being Watched</h2>
                            <p className="text-muted-foreground text-sm font-medium">Understanding blockchain surveillance</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-12 h-12 rounded-2xl bg-secondary hover:bg-accent transition-all flex items-center justify-center group"
                        >
                            <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 mt-6">
                        {[
                            { id: 'surveillance', label: 'Surveillance', icon: Eye },
                            { id: 'techniques', label: 'Techniques', icon: Network },
                            { id: 'consequences', label: 'Risks', icon: AlertTriangle },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all ${activeTab === tab.id
                                        ? 'bg-solana-purple text-white shadow-xl shadow-solana-purple/20'
                                        : 'bg-secondary/50 text-muted-foreground hover:bg-accent'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8">
                    {activeTab === 'surveillance' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black tracking-tighter uppercase solana-text-gradient">
                                    Public Blockchains = Permanent Surveillance
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Every transaction you make on Solana is permanently recorded and publicly visible. This creates an
                                    unprecedented surveillance infrastructure where your entire financial history can be analyzed,
                                    profiled, and linked to your real-world identity.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[
                                    {
                                        icon: Target,
                                        title: 'Transaction Tracking',
                                        description: 'Every SOL transfer, token swap, and NFT purchase is tracked. Companies use this to build detailed profiles of your financial behavior.',
                                        example: 'When you send to Binance, they know your wallet. When you swap on Jupiter, everyone can see it.'
                                    },
                                    {
                                        icon: Network,
                                        title: 'Address Clustering',
                                        description: 'Algorithms detect when multiple wallets belong to the same person by analyzing interaction patterns and common behaviors.',
                                        example: 'If two wallets frequently interact or use similar patterns, they can be linked together.'
                                    },
                                    {
                                        icon: DollarSign,
                                        title: 'Wealth Profiling',
                                        description: 'Your net worth, trading frequency, and investment strategies are completely transparent to anyone watching.',
                                        example: 'Hackers and scammers can see exactly how much you own and target high-value wallets.'
                                    },
                                    {
                                        icon: Shield,
                                        title: 'Identity Linkage',
                                        description: 'One KYC transaction or SNS domain can link your entire on-chain history to your real identity.',
                                        example: 'A single deposit to Coinbase connects your name, address, and SSN to all your DeFi activity.'
                                    },
                                ].map((item, idx) => (
                                    <div key={idx} className="p-6 rounded-[2rem] bg-secondary/30 border border-border space-y-4 hover:bg-secondary/50 transition-all">
                                        <div className="w-12 h-12 rounded-2xl bg-solana-purple/10 flex items-center justify-center">
                                            <item.icon className="w-6 h-6 text-solana-purple" />
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="text-lg font-black tracking-tight">{item.title}</h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                                            <p className="text-xs text-solana-green bg-solana-green/10 p-3 rounded-xl border border-solana-green/20">
                                                💡 Example: {item.example}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'techniques' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black tracking-tighter uppercase solana-text-gradient">
                                    Chain Analysis Techniques
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Surveillance companies use sophisticated algorithms to extract maximum information from public blockchain data.
                                </p>
                            </div>

                            <div className="space-y-6">
                                {[
                                    {
                                        technique: 'Common Input Ownership Heuristic',
                                        how: 'If multiple addresses send funds in the same transaction, they likely belong to the same person or entity',
                                        detection: 'Analyzing transaction inputs to cluster wallet ownership',
                                    },
                                    {
                                        technique: 'Temporal Analysis',
                                        how: 'Wallets that transact at similar times or with regular patterns can be linked',
                                        detection: 'Tracking transaction timestamps and frequency patterns',
                                    },
                                    {
                                        technique: 'Address Reuse Detection',
                                        how: 'Using the same deposit address across multiple services reveals connections',
                                        detection: 'Monitoring where the same wallet appears across different platforms',
                                    },
                                    {
                                        technique: 'Dust Attack Tracking',
                                        how: 'Sending tiny amounts to wallets and watching where they move to map connections',
                                        detection: 'Tracing small "dust" transactions to link wallet clusters',
                                    },
                                    {
                                        technique: 'Exchange Deposit Correlation',
                                        how: 'Matching deposit/withdrawal amounts and timings to link CEX accounts to wallets',
                                        detection: 'Analyzing CEX wallet flows and pattern matching',
                                    },
                                    {
                                        technique: 'Behavioral Fingerprinting',
                                        how: 'Your trading style, timing, and preferences create a unique "fingerprint"',
                                        detection: 'Machine learning models analyzing trading behavior patterns',
                                    },
                                ].map((item, idx) => (
                                    <div key={idx} className="p-6 rounded-[2rem] bg-secondary/30 border border-border space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 mt-1">
                                                <span className="text-red-400 font-black text-sm">{idx + 1}</span>
                                            </div>
                                            <div className="space-y-3 flex-1">
                                                <h4 className="text-lg font-black tracking-tight">{item.technique}</h4>
                                                <div className="space-y-2">
                                                    <div className="flex gap-3">
                                                        <span className="text-xs font-black text-solana-purple uppercase shrink-0">How:</span>
                                                        <p className="text-sm text-muted-foreground">{item.how}</p>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <span className="text-xs font-black text-yellow-500 uppercase shrink-0">Detection:</span>
                                                        <p className="text-sm text-muted-foreground">{item.detection}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'consequences' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black tracking-tighter uppercase solana-text-gradient">
                                    Real-World Consequences
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Blockchain surveillance isn't just theoretical - it has serious real-world impacts on privacy,
                                    security, and financial freedom.
                                </p>
                            </div>

                            <div className="space-y-6">
                                {[
                                    {
                                        risk: 'Targeted Attacks',
                                        severity: 'Critical',
                                        description: 'Criminals scan the blockchain for high-value wallets and target them with sophisticated phishing, SIM swaps, or even physical threats.',
                                        realExample: 'Multiple crypto holders have been victims of $5 wrench attacks after their wealth became publicly visible.',
                                    },
                                    {
                                        risk: 'Financial Discrimination',
                                        severity: 'High',
                                        description: 'Banks, services, and platforms can deny you access based on your on-chain activity, even if legal.',
                                        realExample: 'Users who used privacy tools or certain DeFi protocols have had bank accounts closed without explanation.',
                                    },
                                    {
                                        risk: 'Identity Doxxing',
                                        severity: 'High',
                                        description: 'One small mistake links your wallet to your identity, exposing your entire financial history to anyone who knows you.',
                                        realExample: 'A single ENS domain or social media wallet tip can connect your pseudonymous activity to your real name.',
                                    },
                                    {
                                        risk: 'Trading Exploitation',
                                        severity: 'Medium',
                                        description: 'MEV bots and traders front-run your transactions, extracting value from your trading activity.',
                                        realExample: 'Sandwich attacks on DEXs can cost traders 1-5% on every swap due to visible mempool transactions.',
                                    },
                                    {
                                        risk: 'Government Overreach',
                                        severity: 'Medium',
                                        description: 'Authoritarian regimes can track political dissidents and freeze assets based on on-chain activity.',
                                        realExample: 'Multiple countries have used blockchain analysis to track and target citizens.',
                                    },
                                    {
                                        risk: 'Permanent Record',
                                        severity: 'Medium',
                                        description: 'Your bad trades, mistakes, and past activities are permanently visible, potentially affecting future opportunities.',
                                        realExample: 'Employers and investors increasingly check blockchain history before hiring or investing.',
                                    },
                                ].map((item, idx) => (
                                    <div key={idx} className="p-6 rounded-[2rem] bg-red-500/5 border border-red-500/20 space-y-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <h4 className="text-lg font-black tracking-tight text-red-400">{item.risk}</h4>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${item.severity === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                    item.severity === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                                        'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                }`}>
                                                {item.severity}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                                        <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                                            <p className="text-xs text-muted-foreground">
                                                <span className="text-solana-purple font-black">Real Example:</span> {item.realExample}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Solution CTA */}
                            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-solana-purple/20 to-solana-green/10 border border-solana-purple/30 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-solana-purple/20 flex items-center justify-center">
                                        <Lock className="w-8 h-8 text-solana-purple" />
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-2xl font-black tracking-tighter solana-text-gradient">The Solution: Selective Privacy</h4>
                                        <p className="text-sm text-muted-foreground">Protect sensitive transactions without sacrificing usability</p>
                                    </div>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    Tools like <span className="text-solana-purple font-bold">encrypt.trade</span> let you selectively
                                    encrypt specific transactions, hiding amounts and counterparties while maintaining full blockchain
                                    verification. You don't need to choose between privacy and functionality - you can have both.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-border p-6 rounded-b-[3rem]">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground font-medium">
                            This scanner shows you what's already visible. Take action to protect yourself.
                        </p>
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-solana-purple text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-solana-purple/90 transition-all shadow-xl shadow-solana-purple/20"
                        >
                            Got It
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EducationModal;
