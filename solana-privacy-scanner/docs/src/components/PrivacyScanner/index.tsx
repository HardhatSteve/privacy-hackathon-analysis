import React, { useState, useEffect, useCallback } from 'react';
import styles from './PrivacyScanner.module.css';
import { BrowserRPCClient } from '../../utils/browser-rpc';
import { createBrowserNicknameProvider, NicknameProvider, truncateAddress } from '../../utils/nickname-store';
import NicknameManager from '../NicknameManager';
import AddressDisplay from '../AddressDisplay';

// Use default RPC endpoint
const DEFAULT_RPC = 'https://late-hardworking-waterfall.solana-mainnet.quiknode.pro/4017b48acf3a2a1665603cac096822ce4bec3a90/';

// Narrative types
interface AdversaryNarrative {
  introduction: string;
  paragraphs: {
    category: string;
    title: string;
    opening: string;
    statements: {
      signalId: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      statement: string;
      details: string[];
    }[];
    closing: string;
  }[];
  conclusion: string;
  identifiabilityLevel: 'anonymous' | 'pseudonymous' | 'identifiable' | 'fully-identified';
}

// Create a browser-compatible label provider from loaded labels
function createLabelProvider(labels: any[]) {
  return {
    lookup(address: string) {
      return labels.find((label: any) => label.address === address) || null;
    },
    lookupMany(addresses: string[]) {
      const results = new Map();
      for (const address of addresses) {
        const label = this.lookup(address);
        if (label) {
          results.set(address, label);
        }
      }
      return results;
    }
  };
}

interface Report {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  target: string;
  summary: {
    transactionsAnalyzed: number;
  };
  signals: Signal[];
  knownEntities: KnownEntity[];
  mitigations: string[];
}

interface Signal {
  name: string;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: string;
  evidence: Evidence[];
  mitigation: string;
  confidence: number;
}

interface Evidence {
  description: string;
  type?: string;
  value?: string;
}

interface KnownEntity {
  address: string;
  type: string;
  name: string;
  description: string;
}

export default function PrivacyScanner() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [narrative, setNarrative] = useState<AdversaryNarrative | null>(null);
  const [narrativeExpanded, setNarrativeExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [normalizeWalletData, setNormalizeWalletData] = useState<any>(null);
  const [generateReport, setGenerateReport] = useState<any>(null);
  const [generateNarrative, setGenerateNarrative] = useState<any>(null);
  const [knownLabels, setKnownLabels] = useState<any[]>([]);

  // Nickname management
  const [nicknames, setNicknames] = useState<NicknameProvider | null>(null);
  const [nicknameManagerOpen, setNicknameManagerOpen] = useState(false);
  const [, forceUpdate] = useState(0); // Used to trigger re-render when nicknames change

  useEffect(() => {
    // Initialize nickname provider (browser localStorage)
    if (typeof window !== 'undefined') {
      setNicknames(createBrowserNicknameProvider());
    }

    // Dynamically import the scanner modules
    import('solana-privacy-scanner-core/normalizer')
      .then(module => setNormalizeWalletData(() => module.normalizeWalletData))
      .catch(err => console.error('Failed to load normalizer:', err));

    import('solana-privacy-scanner-core/scanner')
      .then(module => setGenerateReport(() => module.generateReport))
      .catch(err => console.error('Failed to load scanner:', err));

    // Import narrative generator
    import('solana-privacy-scanner-core/narrative')
      .then(module => setGenerateNarrative(() => module.generateNarrative))
      .catch(err => console.error('Failed to load narrative:', err));

    // Load known addresses database (78+ addresses)
    fetch('/known-addresses.json')
      .then(res => res.json())
      .then(data => {
        setKnownLabels(data.labels || []);
        console.log(`Loaded ${data.labels?.length || 0} known addresses`);
      })
      .catch(err => console.error('Failed to load known addresses:', err));
  }, []);

  const labelProvider = createLabelProvider(knownLabels);

  const handleNicknameChange = useCallback((addr: string, nickname: string | null) => {
    if (!nicknames) return;
    if (nickname) {
      nicknames.set(addr, nickname);
    } else {
      nicknames.remove(addr);
    }
    forceUpdate(n => n + 1); // Trigger re-render
  }, [nicknames]);

  const handleNicknameUpdate = useCallback(() => {
    forceUpdate(n => n + 1); // Trigger re-render when nicknames change
  }, []);

  // Helper to display an address with nickname/label priority
  const displayAddr = useCallback((addr: string): string => {
    const nickname = nicknames?.get(addr);
    if (nickname) return `${nickname} (${truncateAddress(addr, 4)})`;

    const label = labelProvider.lookup(addr);
    if (label) return label.name;

    return truncateAddress(addr, 4);
  }, [nicknames, labelProvider]);

  const isValidAddress = address.length >= 32 && address.length <= 44;
  const canScan = isValidAddress && !loading && normalizeWalletData && generateReport;

  async function scanAddress() {
    if (!canScan) return;

    setLoading(true);
    setError(null);
    setReport(null);
    setNarrative(null);
    setNarrativeExpanded(false);

    try {
      const rpc = new BrowserRPCClient(DEFAULT_RPC);
      const addr = address.trim();

      // Collect signatures (limit to 20 to avoid rate limits)
      const signaturesData = await rpc.getSignaturesForAddress(addr, { limit: 20 });
      const signatures = Array.isArray(signaturesData) ? signaturesData : [];

      // Collect transactions with rate limiting (one at a time)
      const transactions = [];
      for (let i = 0; i < Math.min(signatures.length, 20); i++) {
        const sig = signatures[i];
        try {
          const tx = await rpc.getTransaction(sig.signature);
          if (tx) {
            // Format as RawTransaction
            transactions.push({
              signature: sig.signature,
              transaction: tx,
              blockTime: tx.blockTime || null
            });
          }
          // Add delay to avoid rate limits
          if (i < signatures.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (err) {
          console.warn(`Failed to fetch transaction ${sig.signature}:`, err);
        }
      }

      console.log('Successfully collected:', transactions.length, 'transactions');

      // Create the RawWalletData structure
      const rawData = JSON.parse(JSON.stringify({
        address: addr,
        signatures: signatures,
        transactions: transactions,
        tokenAccounts: [],
      }));

      // Create label provider with loaded known addresses
      const scanLabelProvider = createLabelProvider(knownLabels);

      // Normalize data
      const context = normalizeWalletData(rawData, scanLabelProvider);

      // Generate report
      const result = generateReport(context);

      setReport(result);

      // Generate narrative if available
      if (generateNarrative && result) {
        try {
          const narrativeResult = generateNarrative(result, { includeLowSeverity: false });
          setNarrative(narrativeResult);
        } catch (err) {
          console.warn('Failed to generate narrative:', err);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan address');
      console.error('Scan error:', err);
    } finally {
      setLoading(false);
    }
  }

  const getRiskColor = (risk: string) => {
    return risk === 'HIGH' ? '#ff3b30'
      : risk === 'MEDIUM' ? '#ff9500'
      : '#34c759';
  };

  const getSeverityColor = (severity: string) => {
    return severity === 'HIGH' ? '#ff3b30'
      : severity === 'MEDIUM' ? '#ff9500'
      : '#86868b';
  };

  return (
    <div className={styles.scannerUI}>
      <div className={styles.scannerHeader}>
        <h1>Solana Privacy Scanner</h1>
        <p className={styles.tagline}>Measure your on-chain privacy exposure</p>
        <p className={styles.poweredBy}>
          Powered by <a href="https://www.quicknode.com/" target="_blank" rel="noopener">QuickNode</a> as a public good
        </p>
        <p className={styles.description}>
          Enter a Solana wallet address to analyze privacy risks.
          All analysis happens in your browser using public blockchain data.
        </p>
      </div>

      <div className={styles.scannerInputs}>
        <div className={styles.inputGroup}>
          <div className={styles.inputLabelRow}>
            <label>Wallet Address</label>
            <button
              onClick={() => setNicknameManagerOpen(true)}
              className={styles.manageNicknamesButton}
              type="button"
            >
              Manage Nicknames {nicknames && nicknames.count() > 0 && `(${nicknames.count()})`}
            </button>
          </div>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            type="text"
            placeholder="e.g., CG2j5yV6XokVsDBgGdgxUSi6jSAq6oq8J83LPivwJwwb"
            onKeyUp={(e) => e.key === 'Enter' && scanAddress()}
            disabled={loading}
          />
          <span className={styles.inputHint}>Enter any Solana wallet address to scan</span>
        </div>

        <button
          onClick={scanAddress}
          disabled={!canScan}
          className={loading ? styles.loading : ''}
        >
          {loading ? 'Scanning...' : 'Scan Address'}
        </button>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {report && (
        <div className={styles.results}>
          <div className={styles.riskScore}>
            <div className={styles.riskBadge} style={{ backgroundColor: getRiskColor(report.overallRisk) }}>
              {report.overallRisk} RISK
            </div>
            <p className={styles.riskSummary}>
              {report.summary.transactionsAnalyzed} transactions analyzed
              {' '}{report.signals.length} {report.signals.length === 1 ? 'risk' : 'risks'} detected
            </p>
            {report.target && (
              <div className={styles.targetAddress}>
                <AddressDisplay
                  address={report.target}
                  nicknames={nicknames}
                  labels={labelProvider}
                  onNicknameChange={handleNicknameChange}
                  showExplorerLink={true}
                />
              </div>
            )}
          </div>

          {/* Adversary Narrative Section */}
          {narrative && narrative.paragraphs.length > 0 && (
            <div className={styles.narrativeSection}>
              <div
                className={styles.narrativeHeader}
                onClick={() => setNarrativeExpanded(!narrativeExpanded)}
              >
                <h3>What Does the Observer Know?</h3>
                <span className={styles.narrativeToggle}>
                  {narrativeExpanded ? 'Hide' : 'Show'} Adversary Perspective
                </span>
              </div>

              {narrativeExpanded && (
                <div className={styles.narrativeContent}>
                  <p className={styles.narrativeIntro}>{narrative.introduction}</p>

                  {narrative.paragraphs.map((para, i) => (
                    <div key={i} className={styles.narrativeParagraph}>
                      <h4>{para.title}</h4>
                      <p className={styles.narrativeOpening}>{para.opening}</p>

                      {para.statements.map((stmt, j) => (
                        <div key={j} className={styles.narrativeStatement}>
                          <span
                            className={styles.severityIcon}
                            style={{ color: getSeverityColor(stmt.severity) }}
                          >
                            {stmt.severity === 'HIGH' ? '[!]' : stmt.severity === 'MEDIUM' ? '[~]' : '[.]'}
                          </span>
                          <span className={styles.statementText}>{stmt.statement}</span>
                        </div>
                      ))}

                      <p className={styles.narrativeClosing}>{para.closing}</p>
                    </div>
                  ))}

                  <div className={styles.narrativeConclusion}>
                    <h4>Conclusion</h4>
                    <p>{narrative.conclusion}</p>
                    <div className={styles.identifiabilityBadge}>
                      Identifiability Level: <strong>{narrative.identifiabilityLevel.toUpperCase()}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {report.knownEntities.length > 0 && (
            <div className={styles.knownEntities}>
              <h3>Known Entities Detected</h3>
              <div className={styles.entityList}>
                {report.knownEntities.map((entity) => (
                  <div key={entity.address} className={styles.entityCard}>
                    <div className={styles.entityType}>{entity.type}</div>
                    <div className={styles.entityName}>{entity.name}</div>
                    <div className={styles.entityDesc}>{entity.description}</div>
                    <div className={styles.entityAddress}>
                      <AddressDisplay
                        address={entity.address}
                        nicknames={nicknames}
                        labels={labelProvider}
                        onNicknameChange={handleNicknameChange}
                        showCopy={true}
                        showEdit={true}
                        showExplorerLink={true}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.signals.length > 0 ? (
            <div className={styles.signals}>
              <h3>Privacy Risks</h3>
              {report.signals.map((signal, i) => (
                <div key={i} className={styles.signalCard}>
                  <div className={styles.signalHeader}>
                    <h4>{signal.name}</h4>
                    <span className={styles.severityBadge} style={{ color: getSeverityColor(signal.severity) }}>
                      {signal.severity}
                    </span>
                  </div>
                  <p className={styles.signalReason}>{signal.reason}</p>

                  <div className={styles.signalSection}>
                    <h5>Why This Matters</h5>
                    <p>{signal.impact}</p>
                  </div>

                  {signal.evidence.length > 0 && (
                    <div className={styles.signalSection}>
                      <h5>Evidence</h5>
                      <ul>
                        {signal.evidence.map((ev, j) => (
                          <li key={j}>
                            {ev.type === 'address' && ev.value ? (
                              <AddressDisplay
                                address={ev.value}
                                nicknames={nicknames}
                                labels={labelProvider}
                                onNicknameChange={handleNicknameChange}
                              />
                            ) : (
                              ev.description
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className={styles.signalSection}>
                    <h5>What You Can Do</h5>
                    <p>{signal.mitigation}</p>
                  </div>

                  <div className={styles.confidence}>
                    Confidence: {(signal.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noRisks}>
              <div className={styles.checkmark}>+</div>
              <h3>No significant privacy risks detected</h3>
              <p>This wallet shows good privacy hygiene based on the analyzed transactions.</p>
            </div>
          )}

          <div className={styles.recommendations}>
            <h3>Recommendations</h3>
            <ul>
              {report.mitigations.map((mitigation, i) => (
                <li key={i}>{mitigation}</li>
              ))}
            </ul>
          </div>

          <div className={styles.educational}>
            <h3>Understanding Blockchain Privacy</h3>
            <div className={styles.eduGrid}>
              <div className={styles.eduCard}>
                <h4>Wallets Are Not Anonymous</h4>
                <p>Solana addresses are pseudonymous, not anonymous. All transactions are public and permanent.</p>
              </div>
              <div className={styles.eduCard}>
                <h4>Public Activity Is Linkable</h4>
                <p>Transaction patterns, amounts, timing, and counterparties can be analyzed to link addresses.</p>
              </div>
              <div className={styles.eduCard}>
                <h4>Selective Privacy Helps</h4>
                <p>Using multiple wallets, varying patterns, and avoiding CEXs can significantly reduce exposure.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.privacyNote}>
        <p><strong>Privacy:</strong> All scanning happens in your browser. Your addresses and nicknames are never sent to our servers.</p>
        <p><strong>Infrastructure:</strong> Powered by <a href="https://www.quicknode.com/" target="_blank" rel="noopener">QuickNode</a> - Enterprise-grade Solana RPC infrastructure provided as a public good. Learn more about <a href="/docs/guide/quicknode">why QuickNode makes this tool better</a>.</p>
      </div>

      {/* Nickname Manager Modal */}
      {nicknames && (
        <NicknameManager
          nicknames={nicknames}
          isOpen={nicknameManagerOpen}
          onClose={() => setNicknameManagerOpen(false)}
          onUpdate={handleNicknameUpdate}
        />
      )}
    </div>
  );
}
