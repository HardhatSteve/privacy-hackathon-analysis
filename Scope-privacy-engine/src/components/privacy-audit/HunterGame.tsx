'use client';

import { useState } from 'react';
import { X, Crosshair, Trophy, ChevronRight, ArrowLeft, RotateCcw } from 'lucide-react';

/**
 * HunterGame - Reverse investigation game
 */

interface HunterGameProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

interface GameNode {
  id: string;
  label: string;
  isTarget: boolean;
  revealed: boolean;
  clicked: boolean;
  x: number;
  y: number;
}

interface Level {
  title: string;
  mission: string;
  nodes: Omit<GameNode, 'revealed' | 'clicked'>[];
  education: string;
}

const LEVELS: Level[] = [
  {
    title: "Level 1: Find the KYC Link",
    mission: "The target uses DeFi. Find how they got their funds on-chain.",
    nodes: [
      { id: 'target', label: 'TARGET WALLET', isTarget: false, x: 50, y: 40 },
      { id: 'dex', label: 'Jupiter DEX', isTarget: false, x: 20, y: 70 },
      { id: 'nft', label: 'NFT Marketplace', isTarget: false, x: 80, y: 70 },
      { id: 'cex', label: 'Binance Withdrawal', isTarget: true, x: 50, y: 85 },
    ],
    education: "Centralized Exchanges are the easiest way to track targets. They have full KYC records.",
  },
  {
    title: "Level 2: Locate the Target",
    mission: "The target claims to be anonymous. Find physical location evidence.",
    nodes: [
      { id: 'target', label: 'TARGET WALLET', isTarget: false, x: 50, y: 40 },
      { id: 'defi', label: 'DeFi Pool', isTarget: false, x: 20, y: 70 },
      { id: 'poap', label: 'NYC POAP Mint', isTarget: true, x: 80, y: 70 },
      { id: 'unknown', label: 'Unknown Wallet', isTarget: false, x: 50, y: 85 },
    ],
    education: "Unique NFTs (POAPs) act like tracking beacons. They prove physical presence at events.",
  },
  {
    title: "Level 3: Cluster Analysis",
    mission: "Find evidence that multiple wallets belong to the same person.",
    nodes: [
      { id: 'target', label: 'TARGET WALLET', isTarget: false, x: 50, y: 35 },
      { id: 'walletA', label: 'Wallet A', isTarget: false, x: 25, y: 65 },
      { id: 'walletB', label: 'Wallet B', isTarget: false, x: 75, y: 65 },
      { id: 'dust', label: '0.001 SOL Transfer', isTarget: true, x: 50, y: 85 },
    ],
    education: "Small 'dust' transfers between unlinked wallets reveal they belong to the same owner (Clustering).",
  },
];

type GameState = 'start' | 'playing' | 'success' | 'failed' | 'end';

export function HunterGame({ isOpen, onClose, darkMode }: HunterGameProps) {
  const [gameState, setGameState] = useState<GameState>('start');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [nodes, setNodes] = useState<GameNode[]>([]);
  const [score, setScore] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [clickedNodeId, setClickedNodeId] = useState<string | null>(null);

  const startGame = () => {
    setCurrentLevel(0);
    setScore(0);
    loadLevel(0);
    setGameState('playing');
  };

  const loadLevel = (levelIndex: number) => {
    const level = LEVELS[levelIndex];
    setNodes(level.nodes.map(n => ({ ...n, revealed: n.id === 'target', clicked: false })));
    setHasAttempted(false);
    setClickedNodeId(null);
  };

  const handleNodeClick = (nodeId: string) => {
    // Block if already attempted or clicking target node
    if (hasAttempted || nodeId === 'target') return;
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // ONE SHOT - lock after first click
    setHasAttempted(true);
    setClickedNodeId(nodeId);
    
    // Reveal the clicked node
    setNodes(prev => prev.map(n => 
      n.id === nodeId ? { ...n, clicked: true, revealed: true } : n
    ));

    if (node.isTarget) {
      // SUCCESS - correct target
      setScore(prev => prev + 1);
      setGameState('success');
    } else {
      // FAILED - wrong target
      setGameState('failed');
    }
  };

  const retryLevel = () => {
    loadLevel(currentLevel);
    setGameState('playing');
  };

  const nextLevel = () => {
    if (currentLevel + 1 >= LEVELS.length) {
      setGameState('end');
    } else {
      const nextLevelIndex = currentLevel + 1;
      setCurrentLevel(nextLevelIndex);
      loadLevel(nextLevelIndex);
      setGameState('playing');
    }
  };

  const restart = () => {
    setGameState('start');
  };

  if (!isOpen) return null;

  const textColor = darkMode ? 'text-white' : 'text-black';
  const textMuted = darkMode ? 'text-white/50' : 'text-black/50';
  const cardBg = darkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 ${darkMode ? 'bg-black/95' : 'bg-white/95'} backdrop-blur-sm`}
        onClick={onClose}
      />

      {/* Close Button */}
      <button 
        onClick={onClose}
        className={`absolute top-6 right-6 z-10 p-3 rounded-xl ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'} transition-colors`}
      >
        <X className={`w-5 h-5 ${textColor}`} />
      </button>

      {/* Back Button */}
      <button 
        onClick={onClose}
        className={`absolute top-6 left-6 z-10 p-3 rounded-xl ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/10 hover:bg-black/20'} transition-colors`}
      >
        <ArrowLeft className={`w-5 h-5 ${textColor}`} />
      </button>

      {/* START SCREEN */}
      {gameState === 'start' && (
        <div className={`relative z-10 text-center max-w-lg px-6 ${textColor}`}>
          <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-500/10'} flex items-center justify-center`}>
            <Crosshair className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">HUNTER MODE</h1>
          <p className={`text-lg mb-2 ${textMuted}`}>Reverse Investigation</p>
          <p className={`text-sm mb-8 ${textMuted} max-w-sm mx-auto`}>
            You are the analyst. Find the privacy flaw in each target's transaction graph.
            <br /><span className="text-red-500 font-semibold">ONE SHOT per level. Choose wisely.</span>
          </p>
          <button
            onClick={startGame}
            className="px-8 py-4 rounded-2xl font-bold text-lg transition-all bg-emerald-500 text-white hover:bg-emerald-400"
          >
            <span className="flex items-center gap-3">
              <Crosshair className="w-5 h-5" />
              INITIATE HUNT
            </span>
          </button>
        </div>
      )}

      {/* PLAYING SCREEN */}
      {gameState === 'playing' && (
        <div className={`relative z-10 w-full max-w-xl px-6 ${textColor}`}>
          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className={`text-xs font-mono ${textMuted}`}>
                CASE {currentLevel + 1}/{LEVELS.length}
              </span>
              <span className={`text-xs font-mono ${textMuted}`}>
                SCORE: {score}/{currentLevel}
              </span>
            </div>
            <div className={`h-1 rounded-full ${darkMode ? 'bg-white/10' : 'bg-black/10'}`}>
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${((currentLevel + 1) / LEVELS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Mission Card */}
          <div className={`rounded-2xl border p-6 mb-4 ${cardBg}`}>
            <div className={`text-xs font-mono mb-2 ${textMuted} uppercase tracking-wider`}>
              🎯 {LEVELS[currentLevel].title}
            </div>
            <p className={`text-sm ${textMuted}`}>
              {LEVELS[currentLevel].mission}
            </p>
          </div>

          {/* Hovered Node Info */}
          <div className={`text-center mb-2 h-6`}>
            {hoveredNode && hoveredNode !== 'target' && !hasAttempted && (
              <span className={`text-sm font-mono px-3 py-1 rounded ${darkMode ? 'bg-white/10' : 'bg-black/10'}`}>
                {nodes.find(n => n.id === hoveredNode)?.label || 'UNKNOWN'}
              </span>
            )}
          </div>

          {/* Graph Card */}
          <div className={`rounded-2xl border p-4 mb-4 ${cardBg} ${hasAttempted ? 'cursor-not-allowed' : 'cursor-crosshair'}`} style={{ height: '280px', position: 'relative' }}>
            {/* SVG Lines */}
            <svg className="absolute inset-0 w-full h-full">
              {nodes.filter(n => n.id !== 'target').map(node => {
                const target = nodes.find(n => n.id === 'target');
                if (!target) return null;
                return (
                  <line
                    key={node.id}
                    x1={`${target.x}%`}
                    y1={`${target.y}%`}
                    x2={`${node.x}%`}
                    y2={`${node.y}%`}
                    stroke={node.clicked && node.isTarget ? '#ef4444' : node.clicked ? '#facc15' : darkMode ? '#ffffff' : '#000000'}
                    strokeWidth={node.clicked && node.isTarget ? 3 : 1}
                    strokeOpacity={node.clicked ? 0.8 : 0.2}
                    strokeDasharray={node.clicked ? '0' : '4,4'}
                  />
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map(node => (
              <div
                key={node.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                  node.id === 'target' ? 'cursor-default' : hasAttempted ? 'cursor-not-allowed' : 'cursor-crosshair'
                }`}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                onClick={() => handleNodeClick(node.id)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <div 
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all text-sm font-bold ${
                    node.id === 'target' 
                      ? `${darkMode ? 'bg-white/10 border-white/50 text-white' : 'bg-black/10 border-black/50 text-black'}` 
                      : node.clicked && node.isTarget
                        ? 'bg-red-500/30 border-red-500 text-red-500 ring-4 ring-red-500/30'
                        : node.clicked
                          ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500'
                          : `${darkMode ? 'bg-white/5 border-white/30 hover:border-white/60 hover:bg-white/10 text-white/60' : 'bg-black/5 border-black/30 hover:border-black/60 hover:bg-black/10 text-black/60'}`
                  } ${hasAttempted && !node.clicked ? 'opacity-50' : ''}`}
                >
                  {node.id === 'target' ? '🎯' : node.clicked && node.isTarget ? '!' : '?'}
                </div>

                {/* Tooltip - only show when hovering and not attempted yet */}
                {hoveredNode === node.id && !hasAttempted && node.id !== 'target' && (
                  <div className={`absolute top-full mt-1 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs font-mono whitespace-nowrap z-10 ${
                    darkMode ? 'bg-black border border-white/20 text-white' : 'bg-white border border-black/20 text-black'
                  }`}>
                    Click to confirm
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Hint */}
          <p className={`text-center text-xs ${textMuted}`}>
            {hasAttempted ? 'Decision locked.' : 'Hover to investigate • ONE SHOT to confirm'}
          </p>
        </div>
      )}

      {/* FAILED SCREEN */}
      {gameState === 'failed' && (
        <div className={`relative z-10 text-center max-w-lg px-6 ${textColor}`}>
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2 text-red-500">MISSION FAILED</h1>
          <p className={`text-sm mb-6 ${textMuted}`}>Incorrect suspect. The real evidence was missed.</p>
          
          <div className={`rounded-2xl border p-6 mb-6 text-left ${cardBg}`}>
            <p className={`text-sm ${textMuted} leading-relaxed`}>
              <span className="text-red-500">Correct target was:</span> {LEVELS[currentLevel].nodes.find(n => n.isTarget)?.label}
            </p>
            <p className={`text-sm ${textMuted} leading-relaxed mt-2`}>
              <span className={textColor}>INTEL:</span> {LEVELS[currentLevel].education}
            </p>
          </div>

          <button
            onClick={retryLevel}
            className="w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 bg-red-500 text-white hover:bg-red-400"
          >
            <RotateCcw className="w-5 h-5" />
            RETRY LEVEL
          </button>
        </div>
      )}

      {/* SUCCESS SCREEN */}
      {gameState === 'success' && (
        <div className={`relative z-10 text-center max-w-lg px-6 ${textColor}`}>
          <div className="text-5xl mb-4">🎯</div>
          <h1 className="text-2xl font-bold mb-2 text-emerald-500">TARGET IDENTIFIED</h1>
          <p className={`text-sm mb-6 ${textMuted}`}>First shot. Clean hit.</p>
          
          <div className={`rounded-2xl border p-6 mb-6 text-left ${cardBg}`}>
            <p className={`text-sm ${textMuted} leading-relaxed`}>
              <span className={textColor}>INTEL:</span> {LEVELS[currentLevel].education}
            </p>
          </div>

          <button
            onClick={nextLevel}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${darkMode 
              ? 'bg-white text-black hover:bg-white/90' 
              : 'bg-black text-white hover:bg-black/90'
            }`}
          >
            {currentLevel + 1 >= LEVELS.length ? 'VIEW RESULTS' : 'NEXT CASE'}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* END SCREEN */}
      {gameState === 'end' && (
        <div className={`relative z-10 text-center max-w-lg px-6 ${textColor}`}>
          <div className="text-6xl mb-4"><Trophy className="w-16 h-16 mx-auto text-emerald-500" /></div>
          <h1 className="text-3xl font-bold mb-2">HUNT COMPLETE</h1>
          <p className={`text-5xl font-bold font-mono my-6`}>
            {score}/{LEVELS.length}
          </p>
          
          {/* Score Bar */}
          <div className={`w-full h-3 rounded-full mb-8 ${darkMode ? 'bg-white/10' : 'bg-black/10'}`}>
            <div 
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${(score / LEVELS.length) * 100}%` }}
            />
          </div>

          <p className={`text-sm mb-8 ${textMuted}`}>
            {score === LEVELS.length 
              ? "Perfect. Every shot hit the target." 
              : score >= LEVELS.length * 0.5
                ? "Good work. But some targets escaped."
                : "Needs improvement. Study the intel."}
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={restart}
              className={`px-8 py-4 rounded-2xl font-bold transition-all ${darkMode 
                ? 'bg-white text-black hover:bg-white/90' 
                : 'bg-black text-white hover:bg-black/90'
              }`}
            >
              <span className="flex items-center justify-center gap-3">
                <Trophy className="w-5 h-5" />
                HUNT AGAIN
              </span>
            </button>
            <button
              onClick={onClose}
              className={`px-8 py-3 rounded-2xl font-semibold transition-all ${darkMode 
                ? 'bg-white/10 hover:bg-white/20' 
                : 'bg-black/10 hover:bg-black/20'
              }`}
            >
              Back to Training Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
