import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NetworkNode } from '../types/api';
import { Eye, AlertTriangle, X, ExternalLink, Shield, Zap } from 'lucide-react';

interface ClusteringGraphProps {
    walletAddress: string;
    networkNodes: NetworkNode[];
}

const ClusteringGraph: React.FC<ClusteringGraphProps> = ({ walletAddress, networkNodes }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

    // Update container size on mount and resize
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.offsetWidth,
                    height: 600
                });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Color and style mapping by node type
    const getNodeStyle = (type: string) => {
        switch (type) {
            case 'CEX':
                return {
                    bg: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                    border: '#EF4444',
                    glow: 'rgba(220, 38, 38, 0.4)',
                    label: 'Exchange (KYC)'
                };
            case 'DEX':
                return {
                    bg: 'linear-gradient(135deg, #9945FF 0%, #7C3AED 100%)',
                    border: '#A855F7',
                    glow: 'rgba(153, 69, 255, 0.4)',
                    label: 'DEX Protocol'
                };
            case 'PROTOCOL':
                return {
                    bg: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                    border: '#60A5FA',
                    glow: 'rgba(59, 130, 246, 0.4)',
                    label: 'DeFi Protocol'
                };
            case 'MEMECOIN':
                return {
                    bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    border: '#FBBF24',
                    glow: 'rgba(245, 158, 11, 0.4)',
                    label: 'Memecoin'
                };
            default:
                return {
                    bg: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
                    border: '#9CA3AF',
                    glow: 'rgba(107, 114, 128, 0.3)',
                    label: 'Unknown'
                };
        }
    };

    // Calculate bubble positions using circle packing algorithm
    const bubbles = useMemo(() => {
        const centerX = containerSize.width / 2;
        const centerY = containerSize.height / 2;

        // Central node (your wallet)
        const centralBubble = {
            id: 'self',
            x: centerX,
            y: centerY,
            radius: 60,
            type: 'SELF',
            label: 'YOUR WALLET',
            address: walletAddress,
            interactions: 0
        };

        // Sort nodes by interactions for better layout
        const sortedNodes = [...networkNodes].sort((a, b) => b.interactions - a.interactions);

        // Calculate bubble positions in concentric circles
        const nodeBubbles = sortedNodes.map((node, index) => {
            // Scale radius based on interactions (min 20, max 50)
            const radius = Math.min(50, Math.max(20, 15 + node.interactions * 2));

            // Position in expanding spiral
            const angle = (index * 0.8) + (Math.random() * 0.3);
            const ringIndex = Math.floor(index / 8);
            const distanceFromCenter = 120 + (ringIndex * 80) + (Math.random() * 20);

            const x = centerX + Math.cos(angle) * distanceFromCenter;
            const y = centerY + Math.sin(angle) * distanceFromCenter;

            return {
                id: node.address,
                x,
                y,
                radius,
                type: node.type,
                label: node.label || `${node.address.slice(0, 6)}...${node.address.slice(-4)}`,
                address: node.address,
                interactions: node.interactions
            };
        });

        return [centralBubble, ...nodeBubbles];
    }, [networkNodes, containerSize, walletAddress]);

    // Connection lines from center to each bubble
    const connections = useMemo(() => {
        const center = bubbles[0];
        return bubbles.slice(1).map(bubble => ({
            x1: center.x,
            y1: center.y,
            x2: bubble.x,
            y2: bubble.y,
            strength: bubble.interactions
        }));
    }, [bubbles]);

    const truncatedAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

    return (
        <div className="space-y-6">
            {/* Warning Banner */}
            <div className="p-6 rounded-[2rem] bg-gradient-to-r from-red-500/10 to-yellow-500/10 border border-red-500/20">
                <div className="flex items-start gap-4">
                    <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-1" />
                    <div className="space-y-2">
                        <h4 className="text-lg font-black tracking-tight text-red-400">
                            This Network Grows Permanently
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Every bubble represents a <span className="text-foreground font-bold">permanent connection</span> that surveillance
                            companies use to track you. Larger bubbles = more interactions = stronger linkage.
                        </p>
                    </div>
                </div>
            </div>

            {/* Graph Container */}
            <div
                ref={containerRef}
                className="relative rounded-[2.5rem] bg-[#0a0a0f] border border-white/10 overflow-hidden"
                style={{ height: containerSize.height }}
            >
                {/* Background Grid */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }}
                />

                {/* Header */}
                <div className="absolute top-6 left-6 z-10 space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">
                        Connection Map
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-yellow-500">
                        <Eye className="w-3 h-3" />
                        <span>{networkNodes.length} Permanent Links</span>
                    </div>
                </div>

                {/* Legend */}
                <div className="absolute top-6 right-6 z-10 p-4 bg-black/80 backdrop-blur-sm rounded-2xl border border-white/10 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        Node Types
                    </p>
                    {[
                        { type: 'CEX', color: '#DC2626' },
                        { type: 'DEX', color: '#9945FF' },
                        { type: 'PROTOCOL', color: '#3B82F6' },
                        { type: 'MEMECOIN', color: '#F59E0B' },
                        { type: 'UNKNOWN', color: '#6B7280' },
                    ].map((item) => (
                        <div key={item.type} className="flex items-center gap-2">
                            <div
                                className="w-4 h-4 rounded-full shadow-lg"
                                style={{
                                    background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}99 100%)`,
                                    boxShadow: `0 0 10px ${item.color}40`
                                }}
                            />
                            <span className="text-[10px] font-medium text-muted-foreground">
                                {getNodeStyle(item.type).label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* SVG Canvas */}
                <svg
                    width={containerSize.width}
                    height={containerSize.height}
                    className="absolute inset-0"
                >
                    {/* Connection Lines */}
                    {connections.map((conn, idx) => (
                        <motion.line
                            key={idx}
                            x1={conn.x1}
                            y1={conn.y1}
                            x2={conn.x2}
                            y2={conn.y2}
                            stroke="url(#lineGradient)"
                            strokeWidth={Math.max(1, conn.strength / 3)}
                            strokeOpacity={hoveredNode === bubbles[idx + 1]?.id ? 0.8 : 0.15}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1, delay: idx * 0.05 }}
                        />
                    ))}

                    {/* Gradient Definition */}
                    <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#14F195" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#9945FF" stopOpacity="0.3" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Bubbles */}
                {bubbles.map((bubble, idx) => {
                    const style = bubble.type === 'SELF'
                        ? { bg: 'linear-gradient(135deg, #14F195 0%, #00D9FF 100%)', border: '#14F195', glow: 'rgba(20, 241, 149, 0.5)' }
                        : getNodeStyle(bubble.type);

                    const isHovered = hoveredNode === bubble.id;
                    const isSelected = selectedNode?.address === bubble.address;

                    return (
                        <motion.div
                            key={bubble.id}
                            className="absolute cursor-pointer"
                            style={{
                                left: bubble.x - bubble.radius,
                                top: bubble.y - bubble.radius,
                                width: bubble.radius * 2,
                                height: bubble.radius * 2,
                            }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                                scale: isHovered ? 1.15 : 1,
                                opacity: 1,
                                zIndex: isHovered ? 100 : idx
                            }}
                            transition={{
                                delay: idx * 0.03,
                                type: 'spring',
                                stiffness: 200,
                                damping: 15
                            }}
                            onMouseEnter={() => setHoveredNode(bubble.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                            onClick={() => bubble.type !== 'SELF' && setSelectedNode(bubble as any)}
                        >
                            {/* Glow Effect */}
                            <div
                                className="absolute inset-0 rounded-full blur-xl transition-opacity duration-300"
                                style={{
                                    background: style.glow,
                                    opacity: isHovered ? 0.8 : 0.3
                                }}
                            />

                            {/* Main Bubble */}
                            <div
                                className="relative w-full h-full rounded-full border-2 transition-all duration-300 flex items-center justify-center overflow-hidden"
                                style={{
                                    background: style.bg,
                                    borderColor: isHovered ? '#fff' : style.border,
                                    boxShadow: isHovered
                                        ? `0 0 30px ${style.glow}, inset 0 0 20px rgba(255,255,255,0.2)`
                                        : `0 0 20px ${style.glow}`
                                }}
                            >
                                {/* Inner Highlight */}
                                <div
                                    className="absolute inset-2 rounded-full opacity-20"
                                    style={{
                                        background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, transparent 50%)'
                                    }}
                                />

                                {/* Label (only for larger bubbles) */}
                                {bubble.radius > 30 && (
                                    <span
                                        className="relative text-white font-black text-center px-2 leading-tight"
                                        style={{ fontSize: Math.max(8, bubble.radius / 5) }}
                                    >
                                        {bubble.type === 'SELF' ? 'YOU' : bubble.label?.slice(0, 12)}
                                    </span>
                                )}
                            </div>

                            {/* Hover Tooltip */}
                            <AnimatePresence>
                                {isHovered && bubble.type !== 'SELF' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 whitespace-nowrap"
                                    >
                                        <div className="px-3 py-2 bg-black/90 border border-white/10 rounded-xl text-center">
                                            <p className="text-xs font-bold text-foreground">{bubble.label}</p>
                                            <p className="text-[10px] text-muted-foreground">{bubble.interactions} interactions</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}

                {/* Pulse Animation for Center */}
                <motion.div
                    className="absolute rounded-full border-2 border-solana-green/30 pointer-events-none"
                    style={{
                        left: containerSize.width / 2 - 80,
                        top: containerSize.height / 2 - 80,
                        width: 160,
                        height: 160,
                    }}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                />
            </div>

            {/* Node Detail Modal */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="p-6 rounded-[2rem] bg-secondary/20 border border-border space-y-4"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-12 h-12 rounded-xl"
                                    style={{ background: getNodeStyle(selectedNode.type).bg }}
                                />
                                <div>
                                    <p className="font-black text-lg">{selectedNode.label || 'Unknown'}</p>
                                    <p className="font-mono text-xs text-muted-foreground">{selectedNode.address}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedNode(null)}
                                className="p-2 hover:bg-secondary rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                                <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Type</p>
                                <p className="text-lg font-bold">{getNodeStyle(selectedNode.type).label}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                                <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Interactions</p>
                                <p className="text-lg font-bold">{selectedNode.interactions}</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                            <div className="flex items-center gap-2 text-red-400 text-sm font-bold">
                                <AlertTriangle className="w-4 h-4" />
                                This connection lets analysts link your activity forever
                            </div>
                        </div>

                        <a
                            href={`https://solscan.io/account/${selectedNode.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-secondary/50 rounded-xl text-sm font-bold hover:bg-secondary transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            View on Solscan
                        </a>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-red-400">KYC Links</p>
                    <p className="text-3xl font-black tracking-tight">
                        {networkNodes.filter(n => n.type === 'CEX').length}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                        Direct links to your real identity
                    </p>
                </div>

                <div className="p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-400">Total Connections</p>
                    <p className="text-3xl font-black tracking-tight">
                        {networkNodes.length}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                        Clustered with your wallet
                    </p>
                </div>

                <div className="p-6 rounded-2xl bg-solana-green/5 border border-solana-green/20 space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-solana-green">Interactions</p>
                    <p className="text-3xl font-black tracking-tight">
                        {networkNodes.reduce((sum, n) => sum + n.interactions, 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                        On-chain transactions tracked
                    </p>
                </div>
            </div>

            {/* Solution CTA */}
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-solana-purple/20 to-solana-green/10 border border-solana-purple/30 space-y-4">
                <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-solana-purple" />
                    <h4 className="text-xl font-black tracking-tight solana-text-gradient">
                        Break The Chain
                    </h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Every bubble is a permanent link that surveillance companies exploit.
                    <span className="text-foreground font-bold"> Selective encryption</span> on encrypt.trade
                    hides critical transactions, severing cluster analysis chains.
                </p>
            </div>
        </div>
    );
};

export default ClusteringGraph;
