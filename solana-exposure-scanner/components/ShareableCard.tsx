import React, { useRef, useState } from 'react';
import { Download, Share2, Twitter, Copy, Check, QrCode, Shield, AlertTriangle, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { ExposureData } from '../types/api';

interface ShareableCardProps {
    walletAddress: string;
    data: ExposureData;
}

const ShareableCard: React.FC<ShareableCardProps> = ({ walletAddress, data }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const getScoreColor = (score: number) => {
        if (score < 30) return { bg: 'from-green-500 to-emerald-600', text: 'text-green-400', label: 'LOW RISK' };
        if (score < 60) return { bg: 'from-yellow-500 to-orange-500', text: 'text-yellow-400', label: 'MEDIUM RISK' };
        if (score < 80) return { bg: 'from-orange-500 to-red-500', text: 'text-orange-400', label: 'HIGH RISK' };
        return { bg: 'from-red-500 to-red-700', text: 'text-red-400', label: 'CRITICAL' };
    };

    const scoreInfo = getScoreColor(data.exposureScore);
    const truncatedAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

    const downloadAsImage = async () => {
        if (!cardRef.current) return;
        setDownloading(true);

        try {
            // Dynamic import for html-to-image
            const { toPng } = await import('html-to-image');
            const dataUrl = await toPng(cardRef.current, {
                quality: 1,
                pixelRatio: 2,
                backgroundColor: '#000000',
            });

            const link = document.createElement('a');
            link.download = `exposure-report-${truncatedAddress}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Failed to generate image:', err);
            // Fallback: copy link instead
            copyLink();
        } finally {
            setDownloading(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareToTwitter = () => {
        const text = `🔍 My Solana wallet exposure score: ${data.exposureScore}/100 ${scoreInfo.label}\n\nCheck your on-chain privacy exposure:\n`;
        const url = window.location.href;
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    };

    return (
        <div className="space-y-6">
            {/* Shareable Card */}
            <div
                ref={cardRef}
                className="relative p-8 rounded-[2.5rem] bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e] border border-white/10 overflow-hidden"
            >
                {/* Background Effects */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-solana-purple/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-solana-green/20 rounded-full blur-[80px]" />

                {/* Header */}
                <div className="relative flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-solana-purple to-solana-green flex items-center justify-center">
                            <Eye className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Exposure Scanner</p>
                            <p className="font-mono text-sm text-foreground">{truncatedAddress}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Powered by</p>
                        <p className="text-sm font-black text-solana-purple">encrypt.trade</p>
                    </div>
                </div>

                {/* Score Display */}
                <div className="relative text-center mb-8">
                    <div className={`inline-block px-6 py-2 rounded-full bg-gradient-to-r ${scoreInfo.bg} mb-4`}>
                        <span className="text-xs font-black uppercase tracking-[0.3em] text-white">{scoreInfo.label}</span>
                    </div>
                    <div className="flex items-center justify-center gap-4">
                        <span className={`text-8xl font-black tracking-tighter ${scoreInfo.text}`}>
                            {data.exposureScore}
                        </span>
                        <span className="text-3xl font-black text-muted-foreground">/100</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 font-medium">Privacy Exposure Score</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                        <p className="text-2xl font-black text-foreground">{data.clustering.interactedCount}</p>
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Connections</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                        <p className="text-2xl font-black text-foreground">${Math.round(data.netWorthUsd).toLocaleString()}</p>
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Visible Wealth</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                        <p className="text-2xl font-black text-foreground">{data.tradeCount}</p>
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Tracked Txs</p>
                    </div>
                </div>

                {/* Risks Summary */}
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-black uppercase tracking-wider text-red-400">Key Risks</span>
                    </div>
                    <ul className="space-y-1">
                        {data.risks.slice(0, 3).map((risk, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground truncate">• {risk}</li>
                        ))}
                    </ul>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                    <p className="text-[10px] text-muted-foreground font-medium">
                        Scan your wallet at <span className="text-solana-purple font-bold">exposurescanner.xyz</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-solana-green" />
                        <span className="text-[10px] text-solana-green font-black uppercase tracking-wider">Fix with encrypt.trade</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center">
                <motion.button
                    onClick={downloadAsImage}
                    disabled={downloading}
                    className="flex items-center gap-3 px-6 py-4 bg-solana-purple/20 border border-solana-purple/30 rounded-2xl font-black text-sm uppercase tracking-wider text-solana-purple hover:bg-solana-purple/30 transition-all disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Download className="w-5 h-5" />
                    {downloading ? 'Generating...' : 'Download Image'}
                </motion.button>

                <motion.button
                    onClick={shareToTwitter}
                    className="flex items-center gap-3 px-6 py-4 bg-[#1DA1F2]/20 border border-[#1DA1F2]/30 rounded-2xl font-black text-sm uppercase tracking-wider text-[#1DA1F2] hover:bg-[#1DA1F2]/30 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Twitter className="w-5 h-5" />
                    Share on X
                </motion.button>

                <motion.button
                    onClick={copyLink}
                    className="flex items-center gap-3 px-6 py-4 bg-secondary/50 border border-border rounded-2xl font-black text-sm uppercase tracking-wider text-foreground hover:bg-secondary transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                    {copied ? 'Copied!' : 'Copy Link'}
                </motion.button>
            </div>

            {/* Disclaimer */}
            <p className="text-center text-[10px] text-muted-foreground">
                Share your exposure score to raise awareness about blockchain surveillance
            </p>
        </div>
    );
};

export default ShareableCard;
