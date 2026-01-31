import { useEffect, useMemo } from 'react';
import Graph from 'graphology';
import { SigmaContainer, useLoadGraph, useSigma } from '@react-sigma/core';
import '@react-sigma/core/lib/style.css';
import type { CounterpartyData } from '../types/exposure';

interface NetworkGraphProps {
  address: string;
  counterparties?: CounterpartyData[];
}

// Color mapping for node types
const typeColors: Record<string, string> = {
  dex: '#6366f1',     // Indigo - DEX
  nft: '#a855f7',     // Purple - NFT
  cex: '#f59e0b',     // Amber - CEX
  contract: '#06b6d4', // Cyan - Contract
  wallet: '#22c55e',   // Green - Wallet
  unknown: '#6b7280',  // Gray - Unknown
  center: '#f0f0f5',   // White - Center wallet
};

// Load graph data into Sigma
function LoadGraph({ address, counterparties }: NetworkGraphProps) {
  const loadGraph = useLoadGraph();
  const sigma = useSigma();

  useEffect(() => {
    const graph = new Graph();

    // Add center node (the analyzed wallet)
    const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;
    graph.addNode('center', {
      label: shortAddress,
      x: 0,
      y: 0,
      size: 25,
      color: typeColors.center,
      type: 'center',
    });

    // Add counterparty nodes in a circular layout
    if (counterparties && counterparties.length > 0) {
      const angleStep = (2 * Math.PI) / counterparties.length;
      const radius = 200;

      counterparties.forEach((cp, index) => {
        const angle = index * angleStep - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        // Size based on interaction count (min 8, max 20)
        const size = Math.min(20, Math.max(8, 8 + cp.txCount));

        const shortAddr = `${cp.address.slice(0, 4)}...${cp.address.slice(-4)}`;

        graph.addNode(cp.address, {
          label: shortAddr,
          x,
          y,
          size,
          color: typeColors[cp.type] || typeColors.unknown,
          type: cp.type,
          txCount: cp.txCount,
          lastInteraction: cp.lastInteraction,
        });

        // Add edge from center to counterparty
        // Edge size based on transaction count
        const edgeSize = Math.min(5, Math.max(1, cp.txCount / 3));
        graph.addEdge('center', cp.address, {
          size: edgeSize,
          color: `${typeColors[cp.type] || typeColors.unknown}60`,
        });
      });
    }

    loadGraph(graph);

    // Configure sigma settings
    const settings = sigma.getSettings();
    sigma.setSettings({
      ...settings,
      labelColor: { color: '#f0f0f5' },
      labelSize: 12,
      labelWeight: 'bold',
      edgeLabelColor: { color: '#9090a0' },
    });
  }, [loadGraph, sigma, address, counterparties]);

  return null;
}

// Hover state component
function GraphEvents() {
  const sigma = useSigma();

  useEffect(() => {
    const handleEnterNode = ({ node }: { node: string }) => {
      sigma.getGraph().setNodeAttribute(node, 'highlighted', true);
    };

    const handleLeaveNode = ({ node }: { node: string }) => {
      sigma.getGraph().setNodeAttribute(node, 'highlighted', false);
    };

    sigma.on('enterNode', handleEnterNode);
    sigma.on('leaveNode', handleLeaveNode);

    return () => {
      sigma.off('enterNode', handleEnterNode);
      sigma.off('leaveNode', handleLeaveNode);
    };
  }, [sigma]);

  return null;
}

export function NetworkGraph({ address, counterparties }: NetworkGraphProps) {
  // Show placeholder if no counterparties
  const hasCounterparties = counterparties && counterparties.length > 0;

  // Legend items
  const legendItems = useMemo(() => [
    { type: 'dex', label: 'DEX' },
    { type: 'nft', label: 'NFT' },
    { type: 'cex', label: 'CEX' },
    { type: 'contract', label: 'Contract' },
    { type: 'wallet', label: 'Wallet' },
    { type: 'unknown', label: 'Unknown' },
  ], []);

  return (
    <div className="network-graph-panel">
      <h3 className="panel-title">Wallet Connections</h3>

      {hasCounterparties ? (
        <>
          <div className="network-graph-container">
            <SigmaContainer
              style={{ height: '100%', width: '100%' }}
              settings={{
                allowInvalidContainer: true,
                renderLabels: true,
                labelDensity: 0.5,
                labelGridCellSize: 100,
                defaultEdgeType: 'line',
                defaultNodeType: 'circle',
              }}
            >
              <LoadGraph address={address} counterparties={counterparties} />
              <GraphEvents />
            </SigmaContainer>
          </div>

          <div className="network-legend">
            {legendItems.map(({ type, label }) => (
              <div key={type} className="legend-item">
                <span
                  className="legend-dot"
                  style={{ backgroundColor: typeColors[type] }}
                />
                <span className="legend-label">{label}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="network-placeholder">
          <div className="placeholder-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3" />
              <circle cx="4" cy="8" r="2" />
              <circle cx="20" cy="8" r="2" />
              <circle cx="4" cy="16" r="2" />
              <circle cx="20" cy="16" r="2" />
              <line x1="9.5" y1="10.5" x2="5.5" y2="9" />
              <line x1="14.5" y1="10.5" x2="18.5" y2="9" />
              <line x1="9.5" y1="13.5" x2="5.5" y2="15" />
              <line x1="14.5" y1="13.5" x2="18.5" y2="15" />
            </svg>
          </div>
          <p className="placeholder-text">
            Network data unavailable
          </p>
          <p className="placeholder-subtext">
            Transaction counterparties will appear here
          </p>
        </div>
      )}
    </div>
  );
}
