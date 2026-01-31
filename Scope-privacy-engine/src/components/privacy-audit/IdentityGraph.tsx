'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Shield, Building2, Users, Fingerprint, Wallet, AlertTriangle } from 'lucide-react';
import type { PrivacyReport } from './types';

/**
 * IdentityGraph - Interactive network visualization
 * Supports both light and dark mode
 */

interface IdentityGraphProps {
  report: PrivacyReport;
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

interface GraphNode {
  id: string;
  type: 'user' | 'cex' | 'cluster' | 'identity' | 'unknown';
  label: string;
  subLabel?: string;
  x: number;
  y: number;
  size: number;
  color: string;
  icon: 'shield' | 'building' | 'users' | 'fingerprint' | 'wallet' | 'alert';
  riskLevel: 'safe' | 'warning' | 'danger';
}

// Generate initial nodes
function createNodes(report: PrivacyReport): GraphNode[] {
  const nodes: GraphNode[] = [];
  const centerX = 50;
  const centerY = 50;
  
  const userColor = report.score >= 70 ? '#10b981' : report.score >= 40 ? '#f59e0b' : '#ef4444';
  
  nodes.push({
    id: 'user',
    type: 'user',
    label: 'Your Wallet',
    subLabel: `${report.walletAddress.slice(0, 6)}...${report.walletAddress.slice(-4)}`,
    x: centerX,
    y: centerY,
    size: 60,
    color: userColor,
    icon: 'shield',
    riskLevel: report.score >= 70 ? 'safe' : report.score >= 40 ? 'warning' : 'danger',
  });
  
  let angle = 0;
  const angleStep = 45;
  const radius = 30;
  
  const cexResult = report.detectorResults.cex;
  if (cexResult.detected) {
    if (cexResult.exchangesInvolved.some(e => e.toLowerCase().includes('binance'))) {
      nodes.push({
        id: 'binance',
        type: 'cex',
        label: 'Binance',
        subLabel: `${cexResult.totalCEXTransactions} transactions`,
        x: centerX + Math.cos(angle * Math.PI / 180) * radius,
        y: centerY + Math.sin(angle * Math.PI / 180) * radius,
        size: 50,
        color: '#f0b90b',
        icon: 'building',
        riskLevel: 'danger',
      });
      angle += angleStep;
    }
    
    if (cexResult.exchangesInvolved.some(e => e.toLowerCase().includes('coinbase'))) {
      nodes.push({
        id: 'coinbase',
        type: 'cex',
        label: 'Coinbase',
        subLabel: `KYC Exchange`,
        x: centerX + Math.cos(angle * Math.PI / 180) * radius,
        y: centerY + Math.sin(angle * Math.PI / 180) * radius,
        size: 50,
        color: '#0052ff',
        icon: 'building',
        riskLevel: 'danger',
      });
      angle += angleStep;
    }
  }
  
  if (report.detectorResults.clustering.detected) {
    for (let i = 0; i < 3; i++) {
      nodes.push({
        id: `cluster-${i}`,
        type: 'cluster',
        label: `Linked Wallet ${i + 1}`,
        subLabel: 'Pattern detected',
        x: centerX + Math.cos((angle + i * 15) * Math.PI / 180) * (radius * 0.8),
        y: centerY + Math.sin((angle + i * 15) * Math.PI / 180) * (radius * 0.8),
        size: 35,
        color: '#8b5cf6',
        icon: 'users',
        riskLevel: 'warning',
      });
    }
    angle += angleStep;
  }
  
  if (report.detectorResults.assets.detected) {
    nodes.push({
      id: 'identity',
      type: 'identity',
      label: 'Public Identity',
      subLabel: 'NFTs & POAPs found',
      x: centerX + Math.cos(angle * Math.PI / 180) * radius,
      y: centerY + Math.sin(angle * Math.PI / 180) * radius,
      size: 45,
      color: '#ec4899',
      icon: 'fingerprint',
      riskLevel: 'warning',
    });
    angle += angleStep;
  }
  
  // Unknown wallets
  for (let i = 0; i < 2; i++) {
    nodes.push({
      id: `unknown-${i}`,
      type: 'unknown',
      label: 'Unknown Wallet',
      subLabel: 'No risk detected',
      x: centerX + Math.cos((angle + i * angleStep) * Math.PI / 180) * (radius * 1.1),
      y: centerY + Math.sin((angle + i * angleStep) * Math.PI / 180) * (radius * 1.1),
      size: 30,
      color: '#6b7280',
      icon: 'wallet',
      riskLevel: 'safe',
    });
  }
  
  return nodes;
}

function getIcon(icon: GraphNode['icon'], color: string) {
  const props = { className: "w-1/2 h-1/2", color, strokeWidth: 2 };
  switch (icon) {
    case 'shield': return <Shield {...props} />;
    case 'building': return <Building2 {...props} />;
    case 'users': return <Users {...props} />;
    case 'fingerprint': return <Fingerprint {...props} />;
    case 'wallet': return <Wallet {...props} />;
    case 'alert': return <AlertTriangle {...props} />;
  }
}

export function IdentityGraph({ report, isOpen, onClose, darkMode }: IdentityGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState<string | null>(null);
  
  // Initialize nodes
  useEffect(() => {
    if (isOpen) {
      setNodes(createNodes(report));
    }
  }, [report, isOpen]);
  
  // Escape to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  
  // Handle drag start
  const onMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const nodeX = (node.x / 100) * rect.width;
    const nodeY = (node.y / 100) * rect.height;
    
    setDragOffset({
      x: e.clientX - rect.left - nodeX,
      y: e.clientY - rect.top - nodeY,
    });
    setDragging(nodeId);
  };
  
  // Handle drag move
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const newX = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const newY = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;
    
    setNodes(prev => prev.map(n => 
      n.id === dragging 
        ? { ...n, x: Math.max(5, Math.min(95, newX)), y: Math.max(10, Math.min(85, newY)) }
        : n
    ));
  };
  
  // Handle drag end
  const onMouseUp = () => {
    setDragging(null);
  };
  
  if (!isOpen) return null;
  
  // Generate links
  const links: { from: GraphNode; to: GraphNode; color: string; danger: boolean }[] = [];
  const userNode = nodes.find(n => n.id === 'user');
  if (userNode) {
    nodes.filter(n => n.id !== 'user').forEach(n => {
      links.push({
        from: userNode,
        to: n,
        color: n.type === 'cex' ? '#ef4444' : n.color,
        danger: n.type === 'cex',
      });
    });
  }
  
  const hoveredNode = hovered ? nodes.find(n => n.id === hovered) : null;
  
  // Theme colors
  const bgColor = darkMode ? '#0a0a0f' : '#fafafa';
  const borderColor = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const textColor = darkMode ? 'white' : 'black';
  const textMuted = darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const gridColor = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const nodeBackground = darkMode ? '#0a0a0f' : '#ffffff';
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 ${darkMode ? 'bg-black/95' : 'bg-white/95'} backdrop-blur-sm`} 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div 
        className="relative w-full h-full max-w-5xl max-h-[85vh] m-6 rounded-2xl overflow-hidden"
        style={{ 
          backgroundColor: bgColor,
          border: `1px solid ${borderColor}`,
        }}
      >
        {/* Header */}
        <div 
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4"
          style={{
            background: darkMode 
              ? 'linear-gradient(to bottom, rgba(0,0,0,0.9), transparent)'
              : 'linear-gradient(to bottom, rgba(255,255,255,0.95), transparent)',
          }}
        >
          <div>
            <h2 className="text-lg font-bold flex items-center gap-3" style={{ color: textColor }}>
              <Shield className="w-5 h-5" style={{ opacity: 0.8 }} />
              Identity Graph
            </h2>
            <p className="text-xs mt-1" style={{ color: textMuted }}>Drag nodes to rearrange • Hover for info</p>
          </div>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'}`}
          >
            <X className="w-5 h-5" style={{ color: textColor }} />
          </button>
        </div>
        
        {/* Graph Area */}
        <div 
          ref={containerRef}
          className="absolute inset-0 mt-16 mb-16"
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          style={{ cursor: dragging ? 'grabbing' : 'default' }}
        >
          {/* Grid */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />
          
          {/* SVG for lines only */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {links.map((link, i) => (
              <line
                key={i}
                x1={`${link.from.x}%`}
                y1={`${link.from.y}%`}
                x2={`${link.to.x}%`}
                y2={`${link.to.y}%`}
                stroke={link.color}
                strokeWidth={link.danger ? 2 : 1}
                strokeOpacity={link.danger ? 0.8 : 0.4}
              />
            ))}
          </svg>
          
          {/* Nodes as HTML divs */}
          {nodes.map(node => (
            <div
              key={node.id}
              className="absolute flex items-center justify-center rounded-full border-2 transition-shadow duration-200"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                width: node.size,
                height: node.size,
                transform: 'translate(-50%, -50%)',
                backgroundColor: nodeBackground,
                borderColor: node.color,
                boxShadow: (hovered === node.id || dragging === node.id) 
                  ? `0 0 20px ${node.color}80, 0 0 40px ${node.color}40` 
                  : `0 0 10px ${node.color}30`,
                cursor: dragging === node.id ? 'grabbing' : 'grab',
                zIndex: dragging === node.id ? 100 : hovered === node.id ? 50 : 10,
              }}
              onMouseDown={(e) => onMouseDown(e, node.id)}
              onMouseEnter={() => !dragging && setHovered(node.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {getIcon(node.icon, node.color)}
            </div>
          ))}
          
          {/* Tooltip */}
          {hoveredNode && !dragging && (
            <div
              className={`absolute z-50 px-4 py-3 rounded-xl shadow-xl pointer-events-none min-w-[160px] ${darkMode ? 'bg-black' : 'bg-white'}`}
              style={{
                left: `${hoveredNode.x}%`,
                top: `${hoveredNode.y}%`,
                transform: 'translate(30px, -50%)',
                border: `1px solid ${hoveredNode.color}`,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hoveredNode.color }} />
                <span className="text-sm font-bold" style={{ color: textColor }}>{hoveredNode.label}</span>
              </div>
              {hoveredNode.subLabel && (
                <p className="text-xs mb-2" style={{ color: textMuted }}>{hoveredNode.subLabel}</p>
              )}
              <span className={`text-xs px-2 py-1 rounded-full ${
                hoveredNode.riskLevel === 'danger' ? 'bg-red-500/20 text-red-500' :
                hoveredNode.riskLevel === 'warning' ? 'bg-amber-500/20 text-amber-500' :
                'bg-emerald-500/20 text-emerald-500'
              }`}>
                {hoveredNode.riskLevel === 'danger' ? '⚠ High Risk' :
                 hoveredNode.riskLevel === 'warning' ? '● Medium Risk' : '✓ Low Risk'}
              </span>
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div 
          className={`absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-5 px-4 py-3 ${darkMode ? 'bg-black/90 border-white/10' : 'bg-white/90 border-black/10'} border-t`}
        >
          {[
            { color: '#f0b90b', label: 'Binance' },
            { color: '#0052ff', label: 'Coinbase' },
            { color: '#8b5cf6', label: 'Cluster' },
            { color: '#ec4899', label: 'Identity' },
            { color: '#6b7280', label: 'Unknown' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs" style={{ color: textMuted }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
