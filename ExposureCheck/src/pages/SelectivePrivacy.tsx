import { Link } from 'react-router-dom';

// Icons
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
    <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
    <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" strokeLinecap="round" />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
    <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DatabaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const NetworkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="24" height="24">
    <circle cx="12" cy="12" r="3" />
    <circle cx="19" cy="5" r="2" />
    <circle cx="5" cy="5" r="2" />
    <circle cx="19" cy="19" r="2" />
    <circle cx="5" cy="19" r="2" />
    <path d="M14.5 10l3-3.5M9.5 10l-3-3.5M14.5 14l3 3.5M9.5 14l-3 3.5" />
  </svg>
);

export function SelectivePrivacy() {
  return (
    <div className="selective-privacy-page">
      {/* Hero Section */}
      <section className="privacy-hero">
        <div className="hero-badge">
          <ShieldIcon />
          <span>Privacy Education</span>
        </div>
        <h1>Why Selective Privacy Matters</h1>
        <p className="hero-subtitle">
          Public blockchains are surveillance systems by design. Every transaction you make is permanently recorded,
          clustered, and analyzed. Learn how selective privacy tools can help you regain control without
          sacrificing usability.
        </p>
        <div className="hero-cta">
          <a href="https://encrypt.trade" target="_blank" rel="noopener noreferrer" className="cta-primary">
            Try encrypt.trade
            <ExternalLinkIcon />
          </a>
          <Link to="/" className="cta-secondary">
            Check Your Exposure
            <ArrowRightIcon />
          </Link>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="content-section">
        <div className="section-header">
          <AlertIcon />
          <h2>The Problem: You're Being Watched</h2>
        </div>
        <div className="problem-grid">
          <div className="problem-card">
            <div className="problem-icon">
              <DatabaseIcon />
            </div>
            <h3>Permanent Public Record</h3>
            <p>
              Every transaction you've ever made on a public blockchain is stored forever. Unlike bank records,
              this data can never be deleted and is accessible to anyone in the world.
            </p>
          </div>
          <div className="problem-card">
            <div className="problem-icon">
              <NetworkIcon />
            </div>
            <h3>Wallet Clustering</h3>
            <p>
              Intelligence platforms use sophisticated algorithms to link wallets together. If you've ever
              transferred between your own wallets, they're likely already connected in surveillance databases.
            </p>
          </div>
          <div className="problem-card">
            <div className="problem-icon">
              <LinkIcon />
            </div>
            <h3>Identity Association</h3>
            <p>
              A single social media post, ENS name, or exchange withdrawal permanently links your real identity
              to your entire on-chain history. This cannot be undone.
            </p>
          </div>
          <div className="problem-card">
            <div className="problem-icon">
              <ClockIcon />
            </div>
            <h3>Behavioral Profiling</h3>
            <p>
              Your transaction timing, frequency, and patterns reveal your timezone, trading habits, and
              financial behavior. This data builds a detailed profile of who you are.
            </p>
          </div>
        </div>
      </section>

      {/* Who's Watching Section */}
      <section className="content-section watchers-section">
        <div className="section-header">
          <EyeOffIcon />
          <h2>Who's Building Profiles on You?</h2>
        </div>
        <div className="watchers-list">
          <div className="watcher-item">
            <span className="watcher-name">Arkham Intelligence</span>
            <span className="watcher-desc">Enterprise blockchain surveillance with entity identification</span>
            <span className="watcher-badge danger">High Risk</span>
          </div>
          <div className="watcher-item">
            <span className="watcher-name">Chainalysis</span>
            <span className="watcher-desc">Government contractor tracking billions in transactions</span>
            <span className="watcher-badge danger">High Risk</span>
          </div>
          <div className="watcher-item">
            <span className="watcher-name">0xPPL</span>
            <span className="watcher-desc">Social wallet tracking with reputation scores</span>
            <span className="watcher-badge warning">Medium Risk</span>
          </div>
          <div className="watcher-item">
            <span className="watcher-name">Nansen</span>
            <span className="watcher-desc">Smart money tracking and wallet labeling</span>
            <span className="watcher-badge warning">Medium Risk</span>
          </div>
          <div className="watcher-item">
            <span className="watcher-name">Block Explorers</span>
            <span className="watcher-desc">Public transaction history for anyone to browse</span>
            <span className="watcher-badge info">Public Data</span>
          </div>
        </div>
        <div className="watchers-warning">
          <AlertIcon />
          <p>
            These platforms don't just track transactions. They build comprehensive profiles linking wallets to
            real identities, trading patterns, and social connections. Once you're in their database, you're there forever.
          </p>
        </div>
      </section>

      {/* Why Privacy Fails Section */}
      <section className="content-section">
        <div className="section-header">
          <AlertIcon />
          <h2>Why Most Privacy Attempts Fail</h2>
        </div>
        <div className="failures-grid">
          <div className="failure-card">
            <div className="failure-number">1</div>
            <div className="failure-content">
              <h4>No Time Delays</h4>
              <p>
                Depositing into a mixer and withdrawing immediately creates an obvious link. Surveillance
                platforms track timing correlations to connect inputs and outputs.
              </p>
              <div className="failure-example">
                <span className="example-bad">Deposit at 14:32 → Withdraw at 14:35</span>
                <span className="example-label">Easily linked</span>
              </div>
            </div>
          </div>
          <div className="failure-card">
            <div className="failure-number">2</div>
            <div className="failure-content">
              <h4>Consistent Amounts</h4>
              <p>
                Using the same amounts repeatedly (e.g., always 1 ETH or 100 SOL) creates a fingerprint
                that links your transactions across privacy tools.
              </p>
              <div className="failure-example">
                <span className="example-bad">Always transfers exactly 1.5 SOL</span>
                <span className="example-label">Pattern detected</span>
              </div>
            </div>
          </div>
          <div className="failure-card">
            <div className="failure-number">3</div>
            <div className="failure-content">
              <h4>Immediate Reuse</h4>
              <p>
                Using a "fresh" wallet immediately after receiving funds from a privacy protocol defeats
                the purpose. The new wallet is instantly linked to the old one.
              </p>
              <div className="failure-example">
                <span className="example-bad">Privacy → New Wallet → Trade in 5 minutes</span>
                <span className="example-label">Linkability preserved</span>
              </div>
            </div>
          </div>
          <div className="failure-card">
            <div className="failure-number">4</div>
            <div className="failure-content">
              <h4>Same Behavioral Patterns</h4>
              <p>
                If you trade the same tokens, at the same times, with similar strategies across wallets,
                behavioral analysis will link them together.
              </p>
              <div className="failure-example">
                <span className="example-bad">Both wallets buy same memecoin at launch</span>
                <span className="example-label">Behavior fingerprinted</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Selective Privacy Solution */}
      <section className="content-section solution-section">
        <div className="section-header">
          <ShieldIcon />
          <h2>The Solution: Selective Privacy</h2>
        </div>
        <p className="solution-intro">
          Total anonymity is often impractical and unnecessary. <strong>Selective privacy</strong> means
          strategically breaking the link between your identity and specific transactions while maintaining
          the ability to prove ownership when needed.
        </p>

        <div className="solution-features">
          <div className="feature-card">
            <div className="feature-icon success">
              <CheckCircleIcon />
            </div>
            <div className="feature-content">
              <h4>Break the Chain</h4>
              <p>
                Interrupt the direct link between your known wallet and new activities. This prevents
                surveillance platforms from extending your profile to new transactions.
              </p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon success">
              <CheckCircleIcon />
            </div>
            <div className="feature-content">
              <h4>Preserve Provenance When Needed</h4>
              <p>
                Unlike total anonymity, selective privacy lets you prove the legitimate source of funds
                for compliance purposes while keeping your trading activity private.
              </p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon success">
              <CheckCircleIcon />
            </div>
            <div className="feature-content">
              <h4>Protect Against Front-Running</h4>
              <p>
                When your trades are visible, others can copy your strategy or front-run your orders.
                Privacy protects your alpha and trading edge.
              </p>
            </div>
          </div>
          <div className="feature-card">
            <div className="feature-icon success">
              <CheckCircleIcon />
            </div>
            <div className="feature-content">
              <h4>Reduce Targeting Risk</h4>
              <p>
                Publicly visible wealth makes you a target for phishing, social engineering, and physical
                threats. Privacy reduces your attack surface.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* encrypt.trade Section */}
      <section className="content-section encrypt-section">
        <div className="encrypt-card">
          <div className="encrypt-header">
            <div className="encrypt-logo">
              <LockIcon />
            </div>
            <div className="encrypt-title">
              <h2>encrypt.trade</h2>
              <p>Selective Privacy for DeFi Trading</p>
            </div>
          </div>

          <div className="encrypt-description">
            <p>
              <strong>encrypt.trade</strong> provides selective privacy for decentralized trading. Instead of
              mixing all your funds (which can raise compliance concerns), it allows you to privately execute
              specific trades while maintaining transparency where you choose.
            </p>
          </div>

          <div className="encrypt-features">
            <div className="encrypt-feature">
              <span className="feature-check">
                <CheckCircleIcon />
              </span>
              <span>Private order execution without public mempool visibility</span>
            </div>
            <div className="encrypt-feature">
              <span className="feature-check">
                <CheckCircleIcon />
              </span>
              <span>Protection against MEV bots and front-runners</span>
            </div>
            <div className="encrypt-feature">
              <span className="feature-check">
                <CheckCircleIcon />
              </span>
              <span>Break wallet clustering without full anonymization</span>
            </div>
            <div className="encrypt-feature">
              <span className="feature-check">
                <CheckCircleIcon />
              </span>
              <span>Maintain compliance-friendly transaction history</span>
            </div>
            <div className="encrypt-feature">
              <span className="feature-check">
                <CheckCircleIcon />
              </span>
              <span>No complex setup or technical knowledge required</span>
            </div>
          </div>

          <div className="encrypt-cta">
            <a href="https://encrypt.trade" target="_blank" rel="noopener noreferrer" className="encrypt-button">
              Start Trading Privately
              <ExternalLinkIcon />
            </a>
            <p className="encrypt-disclaimer">
              Selective privacy for legitimate use cases. Always comply with local regulations.
            </p>
          </div>
        </div>
      </section>

      {/* Best Practices Section */}
      <section className="content-section">
        <div className="section-header">
          <LockIcon />
          <h2>Privacy Best Practices</h2>
        </div>
        <div className="practices-grid">
          <div className="practice-card">
            <div className="practice-number">01</div>
            <h4>Use Time Delays</h4>
            <p>
              Wait hours or days between privacy protocol interactions. The longer the delay, the harder
              it is to correlate transactions.
            </p>
          </div>
          <div className="practice-card">
            <div className="practice-number">02</div>
            <h4>Vary Your Amounts</h4>
            <p>
              Never use round numbers or consistent amounts. Add randomization to break amount-based
              correlation attacks.
            </p>
          </div>
          <div className="practice-card">
            <div className="practice-number">03</div>
            <h4>Separate Identities</h4>
            <p>
              Keep wallets for different purposes completely separate. Don't mix trading, NFTs, and
              personal transactions.
            </p>
          </div>
          <div className="practice-card">
            <div className="practice-number">04</div>
            <h4>Avoid Social Links</h4>
            <p>
              Never post wallet addresses publicly. Avoid ENS/SNS names on wallets you want to keep private.
            </p>
          </div>
          <div className="practice-card">
            <div className="practice-number">05</div>
            <h4>Use Privacy-First Tools</h4>
            <p>
              Platforms like encrypt.trade are designed for privacy from the ground up, rather than
              bolting it on afterward.
            </p>
          </div>
          <div className="practice-card">
            <div className="practice-number">06</div>
            <h4>Check Your Exposure</h4>
            <p>
              Regularly analyze your wallets to understand what's already visible. You can't fix what
              you don't measure.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Take Back Your Privacy?</h2>
          <p>
            Start by understanding your current exposure level, then take action with selective privacy tools.
          </p>
          <div className="cta-buttons">
            <Link to="/" className="cta-primary">
              Check Your Wallet Exposure
              <ArrowRightIcon />
            </Link>
            <a href="https://encrypt.trade" target="_blank" rel="noopener noreferrer" className="cta-secondary">
              Try encrypt.trade
              <ExternalLinkIcon />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
