import type { ExposureResult } from '../types/exposure';
import { RiskGauge } from './RiskGauge';
import { RiskRadarChart } from './RiskRadarChart';
import { NetworkGraph } from './NetworkGraph';
import { SocialIdentityPanel } from './SocialIdentityPanel';
import { ExposureCategory } from './ExposureCategory';
import { ActivityHeatmap } from './ActivityHeatmap';
import { FinancialInsights } from './FinancialInsights';
import { SurveillancePlatforms } from './SurveillancePlatforms';
import { EntityLabel } from './EntityLabel';

interface AnalyticsDashboardProps {
  result: ExposureResult;
  onReset: () => void;
}

// Premium icons for dashboard
const Icons = {
  wallet: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M22 10H18a2 2 0 000 4h4" />
      <circle cx="18" cy="12" r="1" fill="currentColor" />
      <path d="M6 6V4a2 2 0 012-2h8a2 2 0 012 2v2" />
    </svg>
  ),
  transactions: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <path d="M7 17L17 7M17 7H8M17 7v9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 17L7 7M7 7h9M7 7v9" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  ),
  tokens: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
  balance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  age: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" strokeLinecap="round" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <path d="M1 4v6h6M23 20v-6h-6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
      <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
    </svg>
  ),
  externalLink: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export function AnalyticsDashboard({ result, onReset }: AnalyticsDashboardProps) {
  const shortAddress = `${result.address.slice(0, 8)}...${result.address.slice(-8)}`;

  // Format wallet age
  const getWalletAgeText = () => {
    if (!result.walletAge.ageInDays) return 'Unknown';
    if (result.walletAge.ageInDays < 30) return `${result.walletAge.ageInDays}d`;
    if (result.walletAge.ageInDays < 365) return `${Math.floor(result.walletAge.ageInDays / 30)}mo`;
    return `${Math.floor(result.walletAge.ageInDays / 365)}y+`;
  };

  // Convert SOL balance to range for privacy
  const getSolBalanceRange = () => {
    const sol = result.solBalance;
    if (sol < 0.1) return '<0.1';
    if (sol < 1) return '0.1-1';
    if (sol < 5) return '1-5';
    if (sol < 10) return '5-10';
    if (sol < 50) return '10-50';
    if (sol < 100) return '50-100';
    if (sol < 500) return '100-500';
    if (sol < 1000) return '500-1K';
    return '1K+';
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(result.address);
  };

  // Get status color based on overall level
  const getStatusColor = () => {
    switch (result.overallLevel) {
      case 'Low': return '#22c55e';
      case 'Medium': return '#f59e0b';
      case 'High': return '#ef4444';
    }
  };

  return (
    <div className="analytics-dashboard">
      {/* Header Section */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="wallet-badge">
            <div className="wallet-icon" style={{ color: getStatusColor() }}>
              {Icons.wallet}
            </div>
            <div className="wallet-info-block">
              <span className="wallet-label">Wallet Analysis</span>
              <div className="wallet-address-row">
                <code className="wallet-address" title={result.address}>
                  {shortAddress}
                </code>
                <button className="copy-btn" onClick={copyAddress} title="Copy address">
                  {Icons.copy}
                </button>
                <a
                  href={`https://solscan.io/account/${result.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="explorer-link"
                  title="View on Solscan"
                >
                  {Icons.externalLink}
                </a>
              </div>
            </div>
          </div>
          <div className="header-stats">
            <div className="header-stat">
              <div className="stat-icon">{Icons.transactions}</div>
              <div className="stat-content">
                <span className="stat-value">{result.txCount.toLocaleString()}</span>
                <span className="stat-label">Transactions</span>
              </div>
            </div>
            <div className="header-stat">
              <div className="stat-icon">{Icons.tokens}</div>
              <div className="stat-content">
                <span className="stat-value">{result.tokenCount}</span>
                <span className="stat-label">Tokens</span>
              </div>
            </div>
            <div className="header-stat">
              <div className="stat-icon">{Icons.balance}</div>
              <div className="stat-content">
                <span className="stat-value">{getSolBalanceRange()}</span>
                <span className="stat-label">SOL Range</span>
              </div>
            </div>
            <div className="header-stat">
              <div className="stat-icon">{Icons.age}</div>
              <div className="stat-content">
                <span className="stat-value">{getWalletAgeText()}</span>
                <span className="stat-label">Wallet Age</span>
              </div>
            </div>
          </div>
        </div>
        <div className="header-center">
          <RiskGauge score={result.overallScore} level={result.overallLevel} />
        </div>
        <div className="header-right">
          <button className="reset-button" onClick={onReset}>
            {Icons.refresh}
            <span>New Analysis</span>
          </button>
        </div>
      </header>

      {/* Entity Label (Solscan Integration) */}
      <EntityLabel solscanLabel={result.solscanLabel} address={result.address} />

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Network Graph - Left Column */}
        <div className="grid-panel network-panel">
          <NetworkGraph
            address={result.address}
            counterparties={result.counterparties}
          />
        </div>

        {/* Social Identity - Right Column Top */}
        <div className="grid-panel social-panel">
          <SocialIdentityPanel socialLinks={result.socialLinks} />
        </div>

        {/* Risk Radar - Left Column Bottom */}
        <div className="grid-panel radar-panel">
          <RiskRadarChart
            categories={result.categories}
            overallLevel={result.overallLevel}
          />
        </div>

        {/* Activity Heatmap - Right Column Bottom */}
        <div className="grid-panel activity-panel">
          <ActivityHeatmap timeAnalysis={result.timeOfDayAnalysis} />
        </div>
      </div>

      {/* Financial Insights Section - only show if there's data */}
      {((result.netWorth && result.netWorth.totalValueUsd != null) ||
        (result.incomeAnalysis?.sources && result.incomeAnalysis.sources.length > 0) ||
        (result.pnlAnalysis?.tokens && result.pnlAnalysis.tokens.length > 0)) && (
        <div className="financial-section-wrapper">
          <h3 className="section-title-standalone">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Financial Profile
          </h3>
          <FinancialInsights
            netWorth={result.netWorth}
            incomeAnalysis={result.incomeAnalysis}
            pnlAnalysis={result.pnlAnalysis}
          />
        </div>
      )}

      {/* Risk Breakdown Panel */}
      <div className="signals-section">
        <h3 className="section-title-standalone warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
            <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
          </svg>
          Risk Breakdown
        </h3>
        <div className="categories-grid">
          {result.categories.map((category) => (
            <ExposureCategory key={category.name} category={category} />
          ))}
        </div>
      </div>

      {/* Privacy Recommendations */}
      <div className="recommendations-section">
        <h3 className="section-title-standalone green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
            <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="10" />
          </svg>
          Reduce Your Exposure
        </h3>
        <div className="recommendations-grid">
          <div className="recommendation-card">
            <div className="rec-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <div className="rec-content">
              <h4>Use Fresh Wallets</h4>
              <p>Create new wallets for sensitive activities. Don't reuse wallets after privacy tool interactions.</p>
            </div>
          </div>
          <div className="recommendation-card">
            <div className="rec-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" strokeLinecap="round" />
              </svg>
            </div>
            <div className="rec-content">
              <h4>Add Time Delays</h4>
              <p>Wait hours or days between receiving and sending funds. Immediate movements are trivially linkable.</p>
            </div>
          </div>
          <div className="recommendation-card">
            <div className="rec-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
                <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
              </svg>
            </div>
            <div className="rec-content">
              <h4>Use Privacy Tools</h4>
              <p>Consider selective privacy solutions for sensitive transactions while maintaining compliance.</p>
            </div>
          </div>
          <div className="recommendation-card">
            <div className="rec-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="18" y1="8" x2="23" y2="13" />
                <line x1="23" y1="8" x2="18" y2="13" />
              </svg>
            </div>
            <div className="rec-content">
              <h4>Separate Identities</h4>
              <p>Don't link social accounts to wallets with sensitive activity. Use separate wallets for public profiles.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Surveillance Platforms - Who's Watching */}
      <SurveillancePlatforms
        address={result.address}
        solBalance={result.solBalance}
        txCount={result.txCount}
        hasSocialLinks={
          !!(result.socialLinks.twitter ||
             result.socialLinks.farcaster ||
             result.socialLinks.lens ||
             result.socialLinks.snsNames.length > 0)
        }
      />

      {/* Footer */}
      <footer className="dashboard-footer">
        <div className="footer-stats">
          <div className="footer-stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" strokeLinecap="round" />
            </svg>
            <span>Analyzed {result.analyzedAt.toLocaleString()}</span>
          </div>
          {result.cached && (
            <div className="cached-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
              </svg>
              <span>Cached Result</span>
            </div>
          )}
        </div>
        <div className="footer-disclaimer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v.01M12 8v4" strokeLinecap="round" />
          </svg>
          <span>Privacy scores are estimates based on public on-chain data.</span>
        </div>
      </footer>
    </div>
  );
}
