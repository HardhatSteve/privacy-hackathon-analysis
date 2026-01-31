import type { SocialLinks } from '../types/exposure';

interface SocialIdentityPanelProps {
  socialLinks: SocialLinks;
}

interface SocialBadgeProps {
  platform: string;
  handle: string;
  icon: React.ReactNode;
  url?: string;
}

function SocialBadge({ platform, handle, icon, url }: SocialBadgeProps) {
  const content = (
    <div className="social-badge">
      <span className="social-icon">{icon}</span>
      <span className="social-handle">{handle}</span>
    </div>
  );

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="social-badge-link"
        title={`View on ${platform}`}
      >
        {content}
      </a>
    );
  }

  return content;
}

// Platform icons as SVG components
const icons = {
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  farcaster: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M3 5h18v14H3V5zm2 2v10h14V7H5zm2 2h3v2H7V9zm4 0h3v2h-3V9zm4 0h2v2h-2V9zM7 13h10v2H7v-2z" />
    </svg>
  ),
  lens: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  ),
  ens: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  solana: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M4 17.5l3.5-3.5H20l-3.5 3.5H4zm0-5.5l3.5-3.5H20L16.5 12H4zm16-6H7.5L4 9.5h12.5L20 6z" />
    </svg>
  ),
  discord: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  ),
  backpack: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M20 8V6c0-1.1-.9-2-2-2h-3V2h-2v2h-2V2H9v2H6c-1.1 0-2 .9-2 2v2c-1.1 0-2 .9-2 2v10h20V10c0-1.1-.9-2-2-2zM6 6h12v2H6V6zm12 14H6v-8h12v8zm-6-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  ),
  basename: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.09 5.1 7.63 12 4.18zM4 8.82l7 3.5v6.86l-7-3.5V8.82zm9 10.36v-6.86l7-3.5v6.86l-7 3.5z" />
    </svg>
  ),
  web3bio: (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">W3</text>
    </svg>
  ),
};

export function SocialIdentityPanel({ socialLinks }: SocialIdentityPanelProps) {
  const linkedAccounts: Array<{
    platform: string;
    handle: string;
    icon: React.ReactNode;
    url?: string;
  }> = [];

  // Collect all linked accounts
  if (socialLinks.twitter) {
    linkedAccounts.push({
      platform: 'X (Twitter)',
      handle: `@${socialLinks.twitter}`,
      icon: icons.twitter,
      url: `https://x.com/${socialLinks.twitter}`,
    });
  }

  if (socialLinks.farcaster) {
    linkedAccounts.push({
      platform: 'Farcaster',
      handle: socialLinks.farcaster,
      icon: icons.farcaster,
      url: `https://warpcast.com/${socialLinks.farcaster}`,
    });
  }

  if (socialLinks.lens) {
    linkedAccounts.push({
      platform: 'Lens',
      handle: socialLinks.lens,
      icon: icons.lens,
      url: `https://lenster.xyz/u/${socialLinks.lens}`,
    });
  }

  if (socialLinks.ens) {
    linkedAccounts.push({
      platform: 'ENS',
      handle: socialLinks.ens,
      icon: icons.ens,
      url: `https://app.ens.domains/${socialLinks.ens}`,
    });
  }

  if (socialLinks.basename) {
    linkedAccounts.push({
      platform: 'Basename',
      handle: socialLinks.basename,
      icon: icons.basename,
    });
  }

  if (socialLinks.discord) {
    linkedAccounts.push({
      platform: 'Discord',
      handle: socialLinks.discord,
      icon: icons.discord,
    });
  }

  if (socialLinks.telegram) {
    linkedAccounts.push({
      platform: 'Telegram',
      handle: socialLinks.telegram,
      icon: icons.telegram,
      url: `https://t.me/${socialLinks.telegram}`,
    });
  }

  if (socialLinks.github) {
    linkedAccounts.push({
      platform: 'GitHub',
      handle: socialLinks.github,
      icon: icons.github,
      url: `https://github.com/${socialLinks.github}`,
    });
  }

  if (socialLinks.backpack) {
    linkedAccounts.push({
      platform: 'Backpack',
      handle: socialLinks.backpack,
      icon: icons.backpack,
    });
  }

  // Add SNS domains
  socialLinks.snsNames.forEach((name) => {
    linkedAccounts.push({
      platform: 'Solana Domain',
      handle: name,
      icon: icons.solana,
    });
  });

  // Add other domains from AllDomains (that aren't already in SNS)
  socialLinks.allDomains.forEach((domain) => {
    if (!socialLinks.snsNames.includes(domain)) {
      linkedAccounts.push({
        platform: 'Domain',
        handle: domain,
        icon: icons.solana,
      });
    }
  });

  // Add web3bio profiles that aren't already captured
  socialLinks.web3BioProfiles.forEach((profile) => {
    const [platform, identity] = profile.split(':');
    const platformLower = platform?.toLowerCase();

    // Skip if already added
    if (
      (platformLower === 'twitter' && socialLinks.twitter) ||
      (platformLower === 'farcaster' && socialLinks.farcaster) ||
      (platformLower === 'lens' && socialLinks.lens) ||
      (platformLower === 'ens' && socialLinks.ens)
    ) {
      return;
    }

    if (identity) {
      linkedAccounts.push({
        platform: platform,
        handle: identity,
        icon: icons.web3bio,
      });
    }
  });

  const hasAccounts = linkedAccounts.length > 0;

  return (
    <div className="social-identity-panel">
      <h3 className="panel-title">Linked Identities</h3>

      {hasAccounts ? (
        <div className="social-accounts-list">
          {linkedAccounts.map((account, index) => (
            <SocialBadge
              key={`${account.platform}-${account.handle}-${index}`}
              platform={account.platform}
              handle={account.handle}
              icon={account.icon}
              url={account.url}
            />
          ))}
        </div>
      ) : (
        <div className="no-social-accounts">
          <div className="no-accounts-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2" />
            </svg>
          </div>
          <p className="no-accounts-text">No linked accounts found</p>
          <p className="no-accounts-subtext">This wallet has no discoverable social identity</p>
        </div>
      )}

      {hasAccounts && (
        <div className="social-summary">
          <span className="summary-count">{linkedAccounts.length}</span>
          <span className="summary-label">
            {linkedAccounts.length === 1 ? 'identity linked' : 'identities linked'}
          </span>
        </div>
      )}
    </div>
  );
}
