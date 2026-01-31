import type { IncomeAnalysis, NetWorthAnalysis, PnLAnalysis } from '../types/exposure';

interface FinancialInsightsProps {
  netWorth?: NetWorthAnalysis;
  incomeAnalysis?: IncomeAnalysis;
  pnlAnalysis?: PnLAnalysis;
}

// Icons
const Icons = {
  netWorth: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  income: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
      <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 16l4-4 4 4 5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  pnl: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
      <path d="M16 8l-4-4-4 4M12 4v12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 16l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
};

// Income source icons
const incomeIcons: Record<string, JSX.Element> = {
  cex_deposit: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z" />
    </svg>
  ),
  dex_swap: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z" />
    </svg>
  ),
  airdrop: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  staking_reward: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  ),
  nft_sale: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM5 15h14v3H5z" />
    </svg>
  ),
  transfer: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
    </svg>
  ),
  contract: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
    </svg>
  ),
  unknown: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
    </svg>
  ),
};

function formatUsd(value: number | null): string {
  if (value === null) return 'N/A';
  if (value < 0.01) return '<$0.01';
  if (value < 1) return `$${value.toFixed(2)}`;
  if (value < 1000) return `$${value.toFixed(2)}`;
  if (value < 10000) return `$${(value / 1000).toFixed(2)}K`;
  if (value < 1000000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${(value / 1000000).toFixed(2)}M`;
}

function formatSol(value: number): string {
  if (value < 0.01) return '<0.01';
  if (value < 1) return value.toFixed(3);
  if (value < 100) return value.toFixed(2);
  return value.toFixed(1);
}

export function FinancialInsights({ netWorth, incomeAnalysis, pnlAnalysis }: FinancialInsightsProps) {
  const hasNetWorth = netWorth && netWorth.totalValueUsd !== null;
  const hasIncome = incomeAnalysis && incomeAnalysis.sources.length > 0;
  const hasPnL = pnlAnalysis && pnlAnalysis.tokens.length > 0;

  if (!hasNetWorth && !hasIncome && !hasPnL) {
    return null;
  }

  return (
    <div className="financial-insights">
      {/* Net Worth Section */}
      {hasNetWorth && (
        <div className="financial-section net-worth-section">
          <h3 className="section-title">
            {Icons.netWorth}
            Estimated Net Worth
          </h3>
          <div className="net-worth-display">
            <span className="net-worth-value">{netWorth.valueRange}</span>
            <span className="net-worth-detail">
              {formatUsd(netWorth.totalValueUsd)} total
            </span>
          </div>
          <div className="net-worth-breakdown">
            <div className="breakdown-item">
              <span className="breakdown-label">SOL</span>
              <span className="breakdown-value">{formatUsd(netWorth.solValueUsd)}</span>
            </div>
            <div className="breakdown-item">
              <span className="breakdown-label">Tokens</span>
              <span className="breakdown-value">{formatUsd(netWorth.tokenValueUsd)}</span>
            </div>
          </div>
          <div className="privacy-warning">
            {Icons.warning}
            <span>Your holdings are publicly visible on-chain</span>
          </div>
        </div>
      )}

      {/* Income Sources Section */}
      {hasIncome && (
        <div className="financial-section income-section">
          <h3 className="section-title">
            {Icons.income}
            Income Sources
          </h3>
          <div className="income-list">
            {incomeAnalysis.sources.slice(0, 5).map((source) => (
              <div key={source.type} className="income-item">
                <div className="income-icon">
                  {incomeIcons[source.type] || incomeIcons.unknown}
                </div>
                <div className="income-info">
                  <span className="income-label">{source.label}</span>
                  <span className="income-count">{source.count} txs</span>
                </div>
                <div className="income-values">
                  <span className="income-amount">{formatSol(source.amount)} SOL</span>
                  <span className="income-percent">{source.percentage.toFixed(1)}%</span>
                </div>
                <div className="income-bar">
                  <div
                    className="income-bar-fill"
                    style={{ width: `${Math.min(source.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {incomeAnalysis.primarySource === 'cex_deposit' && (
            <div className="privacy-warning danger">
              {Icons.warning}
              <span>CEX deposits are KYC-linked to your identity</span>
            </div>
          )}
        </div>
      )}

      {/* P&L Section */}
      {hasPnL && (
        <div className="financial-section pnl-section">
          <h3 className="section-title">
            {Icons.pnl}
            Token Holdings (Volatile/Meme)
          </h3>
          <div className="pnl-summary">
            <div className="pnl-stat">
              <span className="pnl-stat-value">{pnlAnalysis.tokens.length}</span>
              <span className="pnl-stat-label">Tokens Tracked</span>
            </div>
            <div className="pnl-stat">
              <span className="pnl-stat-value positive">{pnlAnalysis.winCount}</span>
              <span className="pnl-stat-label">In Profit</span>
            </div>
            <div className="pnl-stat">
              <span className="pnl-stat-value negative">{pnlAnalysis.lossCount}</span>
              <span className="pnl-stat-label">At Loss</span>
            </div>
          </div>
          {pnlAnalysis.totalUnrealizedPnL !== null && (
            <div className="pnl-total">
              <span className="pnl-total-label">Current Holdings Value</span>
              <span className={`pnl-total-value ${pnlAnalysis.totalUnrealizedPnL >= 0 ? 'positive' : 'negative'}`}>
                {formatUsd(pnlAnalysis.totalUnrealizedPnL)}
              </span>
            </div>
          )}
          <div className="pnl-tokens">
            {pnlAnalysis.tokens.slice(0, 5).map((token) => (
              <div key={token.mint} className="pnl-token">
                <div className="token-info">
                  <span className={`token-category ${token.category}`}>{token.category}</span>
                  <span className="token-holding">{token.currentHolding.toLocaleString()} held</span>
                </div>
                <div className="token-value">
                  {token.currentPrice !== null ? (
                    <span className="token-price">{formatUsd(token.unrealizedPnL)}</span>
                  ) : (
                    <span className="token-price unknown">Price N/A</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="privacy-warning">
            {Icons.warning}
            <span>Trading patterns reveal risk tolerance and financial profile</span>
          </div>
        </div>
      )}
    </div>
  );
}
