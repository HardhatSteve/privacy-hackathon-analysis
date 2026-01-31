import type { SolscanLabel } from '../types/exposure';

interface EntityLabelProps {
  solscanLabel: SolscanLabel | undefined;
  address: string;
}

const ShieldCheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
    <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
    <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
    <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
  </svg>
);

const BuildingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" strokeLinecap="round" />
  </svg>
);

const QuestionIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function EntityLabel({ solscanLabel, address }: EntityLabelProps) {
  if (!solscanLabel) return null;

  const { accountLabel, accountTags, accountType, isKnownEntity, entityRiskLevel, fundedBy, activeAgeDays } = solscanLabel;

  const getRiskConfig = () => {
    switch (entityRiskLevel) {
      case 'safe':
        return {
          icon: <ShieldCheckIcon />,
          color: 'var(--success)',
          bgColor: 'rgba(34, 197, 94, 0.1)',
          borderColor: 'rgba(34, 197, 94, 0.3)',
          label: 'Verified Entity',
        };
      case 'caution':
        return {
          icon: <AlertTriangleIcon />,
          color: 'var(--danger)',
          bgColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          label: 'Caution',
        };
      case 'neutral':
        return {
          icon: <BuildingIcon />,
          color: 'var(--accent)',
          bgColor: 'rgba(99, 102, 241, 0.1)',
          borderColor: 'rgba(99, 102, 241, 0.3)',
          label: 'Known Entity',
        };
      default:
        return {
          icon: <QuestionIcon />,
          color: 'var(--text-secondary)',
          bgColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          label: 'Unknown',
        };
    }
  };

  const config = getRiskConfig();

  // If not a known entity and no useful info, show minimal UI
  if (!isKnownEntity && !fundedBy && accountTags.length === 0) {
    return (
      <div className="entity-label-panel minimal">
        <div className="entity-header">
          <div className="entity-icon" style={{ color: config.color }}>
            {config.icon}
          </div>
          <div className="entity-info">
            <span className="entity-status">No Entity Label Found</span>
            <span className="entity-description">This wallet is not labeled in surveillance databases</span>
          </div>
        </div>
        <a
          href={`https://solscan.io/account/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="solscan-link"
        >
          View on Solscan
          <ExternalLinkIcon />
        </a>
      </div>
    );
  }

  return (
    <div
      className="entity-label-panel"
      style={{
        background: config.bgColor,
        borderColor: config.borderColor,
      }}
    >
      <div className="entity-header">
        <div className="entity-icon" style={{ color: config.color }}>
          {config.icon}
        </div>
        <div className="entity-info">
          {accountLabel ? (
            <>
              <span className="entity-name">{accountLabel}</span>
              <span className="entity-status" style={{ color: config.color }}>{config.label}</span>
            </>
          ) : (
            <>
              <span className="entity-status">{config.label}</span>
              <span className="entity-description">
                {accountType ? `Type: ${accountType}` : 'No label available'}
              </span>
            </>
          )}
        </div>
        <a
          href={`https://solscan.io/account/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="solscan-link-badge"
        >
          Solscan
          <ExternalLinkIcon />
        </a>
      </div>

      {accountTags.length > 0 && (
        <div className="entity-tags">
          {accountTags.map((tag, index) => (
            <span key={index} className="entity-tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="entity-details">
        {activeAgeDays !== null && (
          <div className="entity-detail">
            <span className="detail-label">Wallet Age</span>
            <span className="detail-value">{activeAgeDays} days</span>
          </div>
        )}
        {fundedBy && (
          <div className="entity-detail">
            <span className="detail-label">Initially Funded By</span>
            <a
              href={`https://solscan.io/account/${fundedBy.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="detail-value link"
            >
              {fundedBy.address.slice(0, 4)}...{fundedBy.address.slice(-4)}
              <ExternalLinkIcon />
            </a>
          </div>
        )}
      </div>

      {entityRiskLevel === 'caution' && (
        <div className="entity-warning">
          <AlertTriangleIcon />
          <span>This address may be associated with high-risk activity. Exercise caution.</span>
        </div>
      )}
    </div>
  );
}
