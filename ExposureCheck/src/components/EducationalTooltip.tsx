import { useState } from 'react';

interface EducationalTooltipProps {
  signal: string;
  children: React.ReactNode;
}

// Educational content for common signals
const signalEducation: Record<string, { why: string; recommendation?: string; level: 'info' | 'warning' | 'danger' }> = {
  // Wallet Activity signals
  'High transaction frequency': {
    why: 'Frequent transactions create a detailed behavioral fingerprint that can be used to track your activity patterns and link wallets.',
    recommendation: 'Consider batching transactions or using different wallets for different purposes.',
    level: 'warning',
  },
  'Established wallet': {
    why: 'Long wallet history provides more data points for behavioral analysis and pattern recognition.',
    level: 'info',
  },
  'Diverse token portfolio': {
    why: 'Holding many different tokens reveals your interests, trading style, and can link you to specific communities.',
    level: 'warning',
  },

  // Address Linkability signals
  'Funded from centralized exchange (KYC-linked)': {
    why: 'Centralized exchanges require identity verification. Any funds withdrawn can be permanently traced back to your real identity.',
    recommendation: 'Consider using DEXs or privacy tools for sensitive transactions.',
    level: 'danger',
  },
  'Multiple funding sources': {
    why: 'Multiple funding sources create a web of connections that can be analyzed to cluster your wallets together.',
    level: 'warning',
  },
  'Many unique interactions': {
    why: 'Each address you interact with is a potential link. Counterparties may be labeled or identified, revealing your connections.',
    level: 'warning',
  },

  // Social Exposure signals
  'Twitter/X linked': {
    why: 'Social media links permanently connect your on-chain activity to your public identity. This cannot be undone.',
    recommendation: 'Consider using a separate wallet for public-facing activities.',
    level: 'danger',
  },
  'Multiple social profiles linked': {
    why: 'Each linked social profile increases the attack surface for doxing and social engineering.',
    level: 'danger',
  },
  'SNS/ENS domain registered': {
    why: 'Human-readable names make your wallet easier to find and remember, increasing exposure.',
    level: 'warning',
  },

  // Behavioral Profiling signals
  'Consistent timezone pattern detected': {
    why: 'Regular activity times reveal your timezone and daily schedule, narrowing down your geographic location.',
    recommendation: 'Vary transaction times or use scheduling tools.',
    level: 'warning',
  },
  'Highly concentrated activity pattern': {
    why: 'Predictable activity windows make it easier to profile your behavior and identify you across wallets.',
    level: 'warning',
  },
  'Bursty transaction pattern': {
    why: 'Distinctive activity patterns (bursts followed by silence) create a unique fingerprint.',
    level: 'info',
  },

  // Financial Footprint signals
  'Large holdings': {
    why: 'Significant holdings attract attention from hackers, scammers, and surveillance services like Arkham Intel.',
    recommendation: 'Consider splitting holdings across multiple wallets.',
    level: 'warning',
  },
  'Token profile: Speculative': {
    why: 'Memecoin trading reveals your risk tolerance and can be used to profile you as a "degen" trader.',
    level: 'info',
  },
  'High transaction volume trackable': {
    why: 'High volume makes your wallet a high-value target for analysis and labeling by services like Nansen or Arkham.',
    level: 'warning',
  },

  // Privacy Hygiene signals
  'Funds moved within 1 minute of receiving': {
    why: 'Immediate fund movement creates clear timing links between transactions, making them trivial to connect.',
    recommendation: 'Wait at least a few hours between receiving and sending funds.',
    level: 'danger',
  },
  'Privacy attempt detected but wallet reused immediately': {
    why: 'Using privacy tools then immediately reusing the wallet completely negates any privacy benefits.',
    recommendation: 'Use fresh wallets after privacy tool interactions.',
    level: 'danger',
  },
  'Repeated transaction amounts create linkability': {
    why: 'Sending the same amount multiple times (e.g., exactly 1 SOL) makes it easy to link transactions.',
    recommendation: 'Add small random amounts to transactions to break patterns.',
    level: 'warning',
  },
};

// Fuzzy match for signal education
function findEducation(signal: string): { why: string; recommendation?: string; level: 'info' | 'warning' | 'danger' } | null {
  // Exact match
  if (signalEducation[signal]) {
    return signalEducation[signal];
  }

  // Partial match
  const signalLower = signal.toLowerCase();
  for (const [key, value] of Object.entries(signalEducation)) {
    if (signalLower.includes(key.toLowerCase()) || key.toLowerCase().includes(signalLower.slice(0, 20))) {
      return value;
    }
  }

  // Keyword-based matching
  if (signalLower.includes('cex') || signalLower.includes('exchange') || signalLower.includes('kyc')) {
    return signalEducation['Funded from centralized exchange (KYC-linked)'];
  }
  if (signalLower.includes('twitter') || signalLower.includes('x.com')) {
    return signalEducation['Twitter/X linked'];
  }
  if (signalLower.includes('timezone') || signalLower.includes('time zone')) {
    return signalEducation['Consistent timezone pattern detected'];
  }
  if (signalLower.includes('privacy') && signalLower.includes('reuse')) {
    return signalEducation['Privacy attempt detected but wallet reused immediately'];
  }

  return null;
}

export function EducationalTooltip({ signal, children }: EducationalTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const education = findEducation(signal);

  if (!education) {
    return <>{children}</>;
  }

  return (
    <div className="educational-tooltip-wrapper">
      <div
        className="educational-trigger"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
      >
        {children}
        <span className={`education-indicator ${education.level}`}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
        </span>
      </div>
      {isOpen && (
        <div className={`educational-tooltip ${education.level}`}>
          <div className="tooltip-header">
            <span className="tooltip-level">{education.level === 'danger' ? 'High Risk' : education.level === 'warning' ? 'Moderate Risk' : 'Info'}</span>
          </div>
          <p className="tooltip-why">{education.why}</p>
          {education.recommendation && (
            <p className="tooltip-recommendation">
              <strong>Tip:</strong> {education.recommendation}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Export the education data for use elsewhere
export { signalEducation, findEducation };
