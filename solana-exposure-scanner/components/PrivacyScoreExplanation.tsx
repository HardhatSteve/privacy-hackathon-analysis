
import React from 'react';
import { ArrowLeft, Shield, Link, Users, Activity, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const PrivacyScoreExplanation: React.FC = () => {
    const navigate = useNavigate();

    const sections = [
        {
            title: "Identity Exposure",
            icon: <Shield className="w-6 h-6 text-pink-500" />,
            weight: "10%",
            color: "from-pink-500/20 to-pink-500/5",
            borderColor: "border-pink-500/20",
            textColor: "text-pink-400",
            description: "Tracks how much personal metadata is linked to the wallet.",
            points: [
                { val: "+30", desc: "Owning an SNS Domain (e.g., name.sol) — Major Risk!" },
                { val: "+15", desc: "Owning 2+ domains" },
                { val: "+20", desc: "NFTs with revealing names (e.g., 'DAO Member')" },
                { val: "+15", desc: "Owning 'Profile Picture' (PFP) NFTs" }
            ]
        },
        {
            title: "KYC / CEX Links",
            icon: <Link className="w-6 h-6 text-blue-500" />,
            weight: "30%",
            color: "from-blue-500/20 to-blue-500/5",
            borderColor: "border-blue-500/20",
            textColor: "text-blue-400",
            description: "Tracks connections to Centralized Exchanges (Coinbase, Binance, etc.) which require ID.",
            points: [
                { val: "40 pts", desc: "Interacting with 1 CEX" },
                { val: "60 pts", desc: "Interacting with 2 CEXs" },
                { val: "75 pts", desc: "Interacting with 3+ CEXs" },
                { val: "+15", desc: "High frequency of CEX transfers (>10 txs)" }
            ]
        },
        {
            title: "Wallet Clustering",
            icon: <Users className="w-6 h-6 text-purple-500" />,
            weight: "25%",
            color: "from-purple-500/20 to-purple-500/5",
            borderColor: "border-purple-500/20",
            textColor: "text-purple-400",
            description: "Tracks how many other wallets this address interacts with.",
            points: [
                { val: "20 pts", desc: ">5 unique interactions" },
                { val: "55 pts", desc: ">50 unique interactions" },
                { val: "85 pts", desc: ">500 unique interactions" },
                { val: "Why?", desc: "More connections make it easier to map out a user's entire network." }
            ]
        },
        {
            title: "Activity Patterns",
            icon: <Activity className="w-6 h-6 text-green-500" />,
            weight: "20%",
            color: "from-green-500/20 to-green-500/5",
            borderColor: "border-green-500/20",
            textColor: "text-green-400",
            description: "Tracks if the wallet behaves like a diligent user vs. a burner.",
            points: [
                { val: "85 pts", desc: ">1,000 transactions" },
                { val: "+10", desc: "High frequency (>5 txs/day)" },
                { val: "Why?", desc: "Consistent, long-term activity creates a 'fingerprint' that is hard to hide." }
            ]
        },
        {
            title: "Financial Exposure",
            icon: <Wallet className="w-6 h-6 text-yellow-500" />,
            weight: "15%",
            color: "from-yellow-500/20 to-yellow-500/5",
            borderColor: "border-yellow-500/20",
            textColor: "text-yellow-400",
            description: "Tracks the size of the target based on Net Worth.",
            points: [
                { val: "35 pts", desc: "> $1,000 Net Worth" },
                { val: "70 pts", desc: "> $100,000 Net Worth" },
                { val: "90 pts", desc: "> $1,000,000 Net Worth" }
            ]
        }
    ];

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Scanner
                    </button>
                    <h1 className="text-4xl font-black tracking-tighter uppercase">
                        How Exposure is <span className="text-transparent bg-clip-text bg-gradient-to-r from-solana-green to-solana-purple">Calculated</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        The Exposure Score (0-100) is a weighted average of 5 key privacy factors. A higher score means less privacy and higher risk of deanonymization.
                    </p>
                </div>

                {/* Factors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sections.map((section, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`p-6 rounded-xl border ${section.borderColor} bg-gradient-to-br ${section.color} backdrop-blur-sm`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-background/50 border border-white/5">
                                        {section.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg leading-none">{section.title}</h3>
                                        <span className={`text-xs font-mono ${section.textColor} font-bold`}>WEIGHT: {section.weight}</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground mb-4 min-h-[40px]">
                                {section.description}
                            </p>

                            <div className="space-y-2">
                                {section.points.map((point, pIdx) => (
                                    <div key={pIdx} className="flex items-start gap-3 text-sm">
                                        <span className="font-mono font-bold text-foreground/80 min-w-[50px] text-right">{point.val}</span>
                                        <span className="text-muted-foreground">{point.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Formula Section */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="p-8 rounded-xl border border-border bg-card/50 backdrop-blur"
                >
                    <h3 className="font-bold text-xl mb-4">The Formula</h3>
                    <div className="bg-black/50 p-4 rounded-lg font-mono text-sm md:text-base overflow-x-auto text-green-400">
                        Score = (KYC_Score * 0.30) + (Clustering_Score * 0.25) + (Activity_Score * 0.20) + (Financial_Score * 0.15) + (Identity_Score * 0.10)
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default PrivacyScoreExplanation;
