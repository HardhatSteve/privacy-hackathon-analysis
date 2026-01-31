import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import type { ExposureResult, AnalysisProgress } from './types/exposure';
import { analyzeWalletViaApi } from './services/apiService';
import { WalletInput } from './components/WalletInput';
import { LoadingState } from './components/LoadingState';
import { ExposureDashboard } from './components/ExposureDashboard';
import { SelectivePrivacy } from './pages/SelectivePrivacy';

type AppState = 'input' | 'loading' | 'result' | 'error';

// Shield icon component for branding
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="brand-icon">
    <defs>
      <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>
    </defs>
    <path
      d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"
      stroke="url(#shieldGradient)"
      strokeWidth="1.5"
      fill="rgba(99, 102, 241, 0.1)"
    />
    <path
      d="M12 8v4m0 2v.01"
      stroke="url(#shieldGradient)"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// Lock scan icon for security theme
const ScanIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="scan-icon">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
);

// Book icon for education
const BookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
  </svg>
);

function HomePage() {
  const [state, setState] = useState<AppState>('input');
  const [result, setResult] = useState<ExposureResult | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress>({ step: '', progress: 0 });
  const [error, setError] = useState<string>('');

  const handleAnalyze = async (address: string) => {
    setState('loading');
    setError('');
    setProgress({ step: 'Starting analysis...', progress: 0 });

    try {
      const analysisResult = await analyzeWalletViaApi(address, setProgress);
      setResult(analysisResult);
      setState('result');
    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
      setState('error');
    }
  };

  const handleReset = () => {
    setState('input');
    setResult(null);
    setError('');
  };

  return (
    <main className="main">
      {state === 'input' && (
        <div className="intro">
          <div className="intro-hero">
            <ScanIcon />
            <h2 className="intro-title">Analyze Your Privacy Exposure</h2>
          </div>
          <p className="intro-text">
            Discover how visible your wallet is to on-chain surveillance. We analyze transaction patterns,
            social linkages, behavioral signals, and counterparty relationships.
          </p>
          <div className="feature-badges">
            <span className="feature-badge">
              <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 12.5a5.5 5.5 0 110-11 5.5 5.5 0 010 11z"/>
                <path d="M8 4v4l3 1.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              </svg>
              Real-time Analysis
            </span>
            <span className="feature-badge">
              <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                <path d="M8 1L2 4v4c0 4.4 2.6 8.5 6 10 3.4-1.5 6-5.6 6-10V4L8 1zm0 2l4 2v3c0 3.3-2 6.5-4 7.8-2-1.3-4-4.5-4-7.8V5l4-2z"/>
              </svg>
              Privacy Scoring
            </span>
            <span className="feature-badge">
              <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
                <circle cx="4" cy="8" r="2"/>
                <circle cx="12" cy="4" r="2"/>
                <circle cx="12" cy="12" r="2"/>
                <path d="M6 8h4M10 5l-4 2.5M10 11l-4-2.5" stroke="currentColor" strokeWidth="1"/>
              </svg>
              Network Mapping
            </span>
          </div>
          <WalletInput onSubmit={handleAnalyze} isLoading={false} />

          <div className="learn-more-cta">
            <Link to="/privacy" className="learn-more-link">
              <BookIcon />
              <span>Learn about selective privacy and why it matters</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {state === 'loading' && <LoadingState progress={progress} />}

      {state === 'result' && result && (
        <ExposureDashboard result={result} onReset={handleReset} />
      )}

      {state === 'error' && (
        <div className="error-state">
          <div className="error-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16v.01" strokeLinecap="round" />
            </svg>
          </div>
          <p className="error-text">{error}</p>
          <button className="retry-button" onClick={handleReset}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M1 4v6h6M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
            </svg>
            Try Again
          </button>
        </div>
      )}
    </main>
  );
}

function Header() {
  const location = useLocation();
  const isPrivacyPage = location.pathname === '/privacy';

  return (
    <header className="header">
      <Link to="/" className="brand">
        <ShieldIcon />
        <div className="brand-text">
          <h1>ExposureCheck</h1>
          <p className="tagline">Privacy Intelligence Protocol</p>
        </div>
      </Link>
      <nav className="header-nav">
        <Link
          to="/"
          className={`nav-link ${!isPrivacyPage ? 'active' : ''}`}
        >
          Check Exposure
        </Link>
        <Link
          to="/privacy"
          className={`nav-link ${isPrivacyPage ? 'active' : ''}`}
        >
          Why Privacy?
        </Link>
        <div className="header-badge">
          <span className="badge-dot"></span>
          <span>Solana Network</span>
        </div>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <ShieldIcon />
          <span>ExposureCheck</span>
        </div>
        <p>Privacy-first wallet analysis. Your data is processed securely and cached temporarily.</p>
        <div className="footer-links">
          <Link to="/privacy" className="footer-link">Why Privacy?</Link>
          <span className="footer-divider">|</span>
          <a href="https://encrypt.trade" target="_blank" rel="noopener noreferrer" className="footer-link">encrypt.trade</a>
          <span className="footer-divider">|</span>
          <a href="#" className="footer-link">GitHub</a>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/privacy" element={<SelectivePrivacy />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
