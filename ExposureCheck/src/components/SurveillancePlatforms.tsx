interface SurveillancePlatformsProps {
  address: string;
  solBalance: number;
  txCount: number;
  hasSocialLinks: boolean;
}

interface Platform {
  name: string;
  description: string;
  whatTheyKnow: string[];
  url: string;
  icon: JSX.Element;
  color: string;
  riskLevel: 'info' | 'warning' | 'danger';
}

// Platform icons
const icons = {
  arkham: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  oxppl: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
      <circle cx="19" cy="8" r="2" />
      <circle cx="5" cy="8" r="2" />
    </svg>
  ),
  solscan: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  solanaFm: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M7 12h10M7 8h6M7 16h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  debank: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
      <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
    </svg>
  ),
  bubblemaps: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <circle cx="12" cy="12" r="4" />
      <circle cx="6" cy="8" r="2" />
      <circle cx="18" cy="8" r="2" />
      <circle cx="6" cy="16" r="2" />
      <circle cx="18" cy="16" r="2" />
      <line x1="9" y1="10" x2="7" y2="9" stroke="currentColor" strokeWidth="1" />
      <line x1="15" y1="10" x2="17" y2="9" stroke="currentColor" strokeWidth="1" />
      <line x1="9" y1="14" x2="7" y2="15" stroke="currentColor" strokeWidth="1" />
      <line x1="15" y1="14" x2="17" y2="15" stroke="currentColor" strokeWidth="1" />
    </svg>
  ),
  nansen: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
      <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M7 14l4-4 4 4 5-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export function SurveillancePlatforms({ address, solBalance, txCount, hasSocialLinks }: SurveillancePlatformsProps) {
  // Build platform list with context-aware descriptions
  const platforms: Platform[] = [
    {
      name: 'Arkham Intel',
      description: 'Enterprise-grade blockchain intelligence',
      whatTheyKnow: [
        'Entity identification & labels',
        'Wallet clustering algorithms',
        'Cross-chain activity tracking',
        'Real-world identity associations',
        solBalance > 100 ? 'High-value wallet flagged' : 'Transaction patterns analyzed',
      ],
      url: `https://platform.arkhamintelligence.com/explorer/address/${address}`,
      icon: icons.arkham,
      color: '#6366f1',
      riskLevel: 'danger',
    },
    {
      name: '0xPPL',
      description: 'Social layer for crypto wallets',
      whatTheyKnow: [
        'Social connections & followers',
        'Wallet reputation scores',
        'Community associations',
        hasSocialLinks ? 'Linked social profiles detected' : 'Anonymous wallet profile',
        'Transaction social graph',
      ],
      url: `https://0xppl.com/profiles/${address}`,
      icon: icons.oxppl,
      color: '#a855f7',
      riskLevel: hasSocialLinks ? 'danger' : 'warning',
    },
    {
      name: 'Solscan',
      description: 'Solana block explorer',
      whatTheyKnow: [
        'Complete transaction history',
        'All token holdings',
        'NFT collections owned',
        'DeFi positions & interactions',
        `${txCount} transactions publicly visible`,
      ],
      url: `https://solscan.io/account/${address}`,
      icon: icons.solscan,
      color: '#22c55e',
      riskLevel: 'info',
    },
    {
      name: 'Solana FM',
      description: 'Advanced Solana analytics',
      whatTheyKnow: [
        'Decoded transaction data',
        'Program interaction history',
        'Account relationships',
        'Historical balance changes',
      ],
      url: `https://solana.fm/address/${address}`,
      icon: icons.solanaFm,
      color: '#06b6d4',
      riskLevel: 'info',
    },
    {
      name: 'Bubblemaps',
      description: 'Visual wallet clustering',
      whatTheyKnow: [
        'Connected wallet clusters',
        'Token holder relationships',
        'Whale wallet identification',
        'Supply concentration analysis',
      ],
      url: `https://app.bubblemaps.io/sol/token/${address}`,
      icon: icons.bubblemaps,
      color: '#f59e0b',
      riskLevel: 'warning',
    },
  ];

  return (
    <div className="surveillance-platforms">
      <div className="surveillance-header">
        <div className="surveillance-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeLinecap="round" />
          </svg>
          Who's Watching You
        </div>
        <p className="surveillance-subtitle">
          These platforms track and label wallets. Click to see what they know about you.
        </p>
      </div>

      <div className="platforms-grid">
        {platforms.map((platform) => (
          <a
            key={platform.name}
            href={platform.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`platform-card risk-${platform.riskLevel}`}
            style={{ '--platform-color': platform.color } as React.CSSProperties}
          >
            <div className="platform-header">
              <div className="platform-icon" style={{ color: platform.color }}>
                {platform.icon}
              </div>
              <div className="platform-info">
                <span className="platform-name">{platform.name}</span>
                <span className="platform-desc">{platform.description}</span>
              </div>
              <div className={`platform-risk-badge ${platform.riskLevel}`}>
                {platform.riskLevel === 'danger' ? 'High Risk' : platform.riskLevel === 'warning' ? 'Medium' : 'Public'}
              </div>
            </div>
            <ul className="platform-knows">
              {platform.whatTheyKnow.slice(0, 4).map((item, i) => (
                <li key={i}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <div className="platform-cta">
              <span>View your profile</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </a>
        ))}
      </div>

      <div className="surveillance-warning">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
          <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <div className="warning-content">
          <strong>Your wallet is permanently public.</strong>
          <p>
            Every transaction you've ever made is visible to anyone. Intelligence platforms like Arkham
            use advanced clustering algorithms to link wallets and identify real-world entities.
            Once linked, this association cannot be undone.
          </p>
        </div>
      </div>
    </div>
  );
}
