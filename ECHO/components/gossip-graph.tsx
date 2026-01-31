"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
  MarkerType,
  NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion } from "framer-motion";
import { nodeTypes } from "./graph-nodes";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "./ui/button";
import { NodeDetailModal } from "./node-detail-modal";
import type { WalletAnalysis, DeanonymizationPath } from "@/lib/privacy-engine";

interface GossipGraphProps {
  address: string;
  analysis?: WalletAnalysis | null;
}

// Known Solana program addresses (for type detection)
const KNOWN_PROGRAMS = new Set([
  "11111111111111111111111111111111", // System Program
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", // Token Program
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL", // Associated Token Program
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s", // Metaplex
  "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", // Jupiter
  "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc", // Orca Whirlpool
  "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP", // Raydium
]);

// Detect address type based on characteristics
function detectAddressType(address: string): "wallet" | "exchange" | "program" {
  if (!address || address.length < 32) return "wallet";
  
  // Check known programs
  if (KNOWN_PROGRAMS.has(address)) return "program";
  
  // Heuristic: addresses with repeating patterns often are programs
  if (/^(.)\1{30,}$/.test(address)) return "program";
  
  return "wallet";
}

// Convert analysis data to React Flow format
function convertAnalysisToReactFlow(
  address: string, 
  paths: DeanonymizationPath[],
  mevExposure?: { detected: boolean; count: number; totalExtracted: number },
  privacyScore?: number,
  totalTransactions?: number
) {
  const nodeMap = new Map<string, { 
    type: "wallet" | "exchange" | "program" | "mev"; 
    risk: string;
    confidence?: number;
    transactionCount?: number;
    mevExposure?: { detected: boolean; count: number; totalExtracted: number };
    attackType?: string;
    profit?: number;
    loss?: number;
  }>();
  const edgeList: Array<{ from: string; to: string; confidence: number }> = [];

  // Add the main wallet as the first node
  nodeMap.set(address, { 
    type: "wallet", 
    risk: "medium",
    mevExposure,
    transactionCount: totalTransactions
  });

  // If MEV exposure detected, add MEV bot node
  if (mevExposure?.detected && mevExposure.count > 0) {
    const mevNodeId = `mev-bot-${address.slice(0, 8)}`;
    // Convert lamports to SOL (1 SOL = 1e9 lamports)
    const estimatedLossInSol = mevExposure.totalExtracted / 1e9;
    nodeMap.set(mevNodeId, {
      type: "mev",
      risk: "high",
      attackType: "sandwich",
      profit: estimatedLossInSol * 0.8, // Bot profit
      loss: estimatedLossInSol,
    });
    edgeList.push({
      from: mevNodeId,
      to: address,
      confidence: 95,
    });
  }

  // Filter out empty addresses and process paths
  paths.forEach((path) => {
    path.nodes.forEach((node) => {
      if (!node.address || node.address.trim() === "") return;
      
      if (!nodeMap.has(node.address)) {
        const detectedType = detectAddressType(node.address);
        nodeMap.set(node.address, { 
          type: node.type === "wallet" ? detectedType : node.type, 
          risk: node.risk,
          transactionCount: node.transactionCount
        });
      } else {
        // Update existing node with transactionCount if not set
        const existing = nodeMap.get(node.address)!;
        if (!existing.transactionCount && node.transactionCount) {
          existing.transactionCount = node.transactionCount;
        }
      }
    });
    path.edges.forEach((edge) => {
      if (!edge.from || !edge.to || edge.from.trim() === "" || edge.to.trim() === "") return;
      edgeList.push(edge);
      const targetNode = nodeMap.get(edge.to);
      if (targetNode) targetNode.confidence = edge.confidence;
    });
  });

  const nodeArray = Array.from(nodeMap.entries());
  const otherNodes = nodeArray.filter(([addr]) => addr !== address);
  
  const nodes: Node[] = nodeArray.map(([nodeAddress, data]) => {
    const isMain = nodeAddress === address;
    const isMev = data.type === "mev";
    const index = isMain ? 0 : otherNodes.findIndex(([addr]) => addr === nodeAddress) + 1;
    
    const radius = isMain ? 0 : isMev ? 150 : 280;
    const totalOthers = Math.max(otherNodes.length, 1);
    const angle = isMain ? 0 : isMev ? Math.PI : (2 * Math.PI * (index - 1)) / totalOthers - Math.PI / 2;
    const x = isMain ? 400 : 400 + radius * Math.cos(angle);
    const y = isMain ? 300 : 300 + radius * Math.sin(angle);

    return {
      id: nodeAddress,
      type: data.type,
      position: { x, y },
      data: {
        id: nodeAddress,
        address: nodeAddress,
        label: isMev ? "MEV Bot" : `${nodeAddress.slice(0, 4)}...${nodeAddress.slice(-4)}`,
        type: data.type,
        riskLevel: data.confidence > 80 ? "high" : data.confidence > 50 ? "medium" : "low",
        isMain,
        confidence: data.confidence,
        transactionCount: data.transactionCount,
        privacyScore: isMain ? privacyScore : undefined,
        mevExposure: data.mevExposure,
        attackType: data.attackType,
        profit: data.profit,
        loss: data.loss,
      },
    };
  });

  const edges: Edge[] = edgeList.map((edge, index) => {
    const riskLevel = edge.confidence > 80 ? "high" : edge.confidence > 50 ? "medium" : "low";
    return {
      id: `edge-${edge.from.slice(0, 8)}-${edge.to.slice(0, 8)}-${index}`,
      source: edge.from,
      target: edge.to,
      type: "smoothstep",
      animated: riskLevel === "high",
      style: {
        stroke: riskLevel === "high" ? "#ef4444" : riskLevel === "medium" ? "#f59e0b" : "#10b981",
        strokeWidth: 2,
        opacity: 0.7,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: riskLevel === "high" ? "#ef4444" : riskLevel === "medium" ? "#f59e0b" : "#10b981",
      },
      label: `${edge.confidence}%`,
      labelStyle: { fill: "#fff", fontSize: 10, fontFamily: "monospace" },
      labelBgStyle: { fill: "#000", fillOpacity: 0.8 },
    };
  });

  return { nodes, edges };
}

export function GossipGraph({ address, analysis }: GossipGraphProps) {
  console.log("🔍 GossipGraph received:", { pathCount: analysis?.deanonymizationPaths?.length ?? 0 });

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => convertAnalysisToReactFlow(
      address, 
      analysis?.deanonymizationPaths ?? [], 
      analysis?.mevExposure, 
      analysis?.privacyScore,
      analysis?.transactionCount
    ),
    [address, analysis]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [showRiskPaths, setShowRiskPaths] = useState(true);
  const [selectedNode, setSelectedNode] = useState<{
    address: string;
    type: "wallet" | "exchange" | "program";
    riskLevel: "low" | "medium" | "high" | "critical";
    isMain?: boolean;
    confidence?: number;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const toggleRiskPaths = useCallback(() => {
    setShowRiskPaths((prev) => !prev);
    setEdges((eds) => eds.map((edge) => ({ ...edge, hidden: showRiskPaths && edge.animated })));
  }, [showRiskPaths, setEdges]);

  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    setSelectedNode({
      address: node.id,
      type: node.data.type as "wallet" | "exchange" | "program",
      riskLevel: node.data.riskLevel as "low" | "medium" | "high" | "critical",
      isMain: node.data.isMain,
      confidence: node.data.confidence,
      transactionCount: node.data.transactionCount,
    });
    setModalOpen(true);
  }, []);

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-black/20"
        minZoom={0.1}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#3b82f6" className="opacity-20" />
        <Controls className="!bg-black/80 !border-blue-500/30 [&>button]:!bg-black/60 [&>button]:!border-blue-500/30 [&>button]:!text-blue-400 [&>button:hover]:!bg-blue-500/20" />

        <Panel position="top-right" className="space-y-2">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <Button onClick={toggleRiskPaths} size="sm" variant="outline" className="bg-black/80 backdrop-blur-sm border-blue-500/30 text-blue-400 hover:bg-blue-500/10 font-mono text-xs">
              {showRiskPaths ? <><Eye className="h-3 w-3 mr-1" />Hide Risk Paths</> : <><EyeOff className="h-3 w-3 mr-1" />Show Risk Paths</>}
            </Button>
          </motion.div>
        </Panel>

        <Panel position="top-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="bg-black/60 backdrop-blur-sm border border-blue-500/20 rounded-lg px-3 py-1.5 text-center">
            <span className="text-xs text-gray-400 font-mono">💡 Click any node for details</span>
            <div className="text-[10px] text-gray-500 font-mono mt-0.5">Top 12 connections shown • All addresses analyzed for scoring</div>
          </motion.div>
        </Panel>

        <Panel position="bottom-left" className="!bg-black/80 !backdrop-blur-sm !border !border-blue-500/20 !rounded-lg !p-3">
          <div className="space-y-2">
            <div className="text-xs font-mono text-blue-400 font-bold mb-2">Legend</div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-blue-500"></div><span className="text-xs text-gray-400 font-mono">Wallet</span></div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-orange-500"></div><span className="text-xs text-gray-400 font-mono">Exchange</span></div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-purple-500"></div><span className="text-xs text-gray-400 font-mono">Program</span></div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-red-500"></div><span className="text-xs text-gray-400 font-mono">MEV Bot</span></div>
            <div className="border-t border-blue-500/20 my-2"></div>
            <div className="flex items-center gap-2"><div className="h-0.5 w-6 bg-green-500"></div><span className="text-xs text-gray-400 font-mono">Low Risk (&lt;50%)</span></div>
            <div className="flex items-center gap-2"><div className="h-0.5 w-6 bg-yellow-500"></div><span className="text-xs text-gray-400 font-mono">Medium Risk (50-80%)</span></div>
            <div className="flex items-center gap-2"><div className="h-0.5 w-6 bg-red-500"></div><span className="text-xs text-gray-400 font-mono">High Risk (&gt;80%)</span></div>
            <div className="border-t border-blue-500/20 my-2"></div>
            <div className="text-xs font-mono text-gray-500">
              <span className="text-blue-400">Edge %</span> = Confidence score<br/>
              How certain we are that this<br/>
              connection can deanonymize you
            </div>
          </div>
        </Panel>

        <Panel position="bottom-right" className="!bg-black/80 !backdrop-blur-sm !border !border-blue-500/20 !rounded-lg !p-3">
          <div className="space-y-1">
            <div className="text-xs font-mono text-blue-400 font-bold mb-2">Graph Stats</div>
            <div className="flex justify-between gap-4"><span className="text-xs text-gray-400 font-mono">Nodes:</span><span className="text-xs text-white font-mono font-bold">{nodes.length}</span></div>
            <div className="flex justify-between gap-4"><span className="text-xs text-gray-400 font-mono">Edges:</span><span className="text-xs text-white font-mono font-bold">{edges.length}</span></div>
          </div>
        </Panel>
      </ReactFlow>

      <NodeDetailModal isOpen={modalOpen} onClose={() => setModalOpen(false)} node={selectedNode} mainAddress={address} />
    </div>
  );
}
