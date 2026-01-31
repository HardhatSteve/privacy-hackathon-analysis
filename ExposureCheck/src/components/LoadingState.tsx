import type { AnalysisProgress } from '../types/exposure';

interface LoadingStateProps {
  progress: AnalysisProgress;
}

// Scanning animation component
const ScanningVisual = ({ progress }: { progress: number }) => (
  <div className="scanning-visual">
    <svg viewBox="0 0 200 200" className="scanning-svg">
      <defs>
        <linearGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Outer ring */}
      <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(99, 102, 241, 0.1)" strokeWidth="2" />

      {/* Progress ring */}
      <circle
        cx="100"
        cy="100"
        r="90"
        fill="none"
        stroke="url(#scanGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${progress * 5.65} 565`}
        transform="rotate(-90 100 100)"
        filter="url(#glow)"
        className="progress-ring"
      />

      {/* Inner rings */}
      <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="1" strokeDasharray="4 4" className="rotating-ring" />
      <circle cx="100" cy="100" r="50" fill="none" stroke="rgba(139, 92, 246, 0.2)" strokeWidth="1" className="rotating-ring-reverse" />

      {/* Center shield */}
      <g transform="translate(100, 100)" filter="url(#glow)">
        <path
          d="M0 -30 L-25 -15 L-25 10 C-25 25 0 40 0 40 C0 40 25 25 25 10 L25 -15 Z"
          fill="rgba(99, 102, 241, 0.15)"
          stroke="url(#scanGradient)"
          strokeWidth="2"
        />
        <text y="5" textAnchor="middle" fill="url(#scanGradient)" fontSize="16" fontWeight="bold">
          {progress}%
        </text>
      </g>

      {/* Scanning line */}
      <line
        x1="100"
        y1="20"
        x2="100"
        y2="180"
        stroke="url(#scanGradient)"
        strokeWidth="2"
        opacity="0.5"
        className="scan-line"
      />

      {/* Corner markers */}
      <g stroke="url(#scanGradient)" strokeWidth="2" fill="none">
        <path d="M30 50 L30 30 L50 30" />
        <path d="M170 50 L170 30 L150 30" />
        <path d="M30 150 L30 170 L50 170" />
        <path d="M170 150 L170 170 L150 170" />
      </g>

      {/* Data points */}
      <g className="data-points">
        <circle cx="45" cy="80" r="3" fill="#6366f1" opacity="0.8" className="pulse-dot" />
        <circle cx="155" cy="120" r="3" fill="#8b5cf6" opacity="0.8" className="pulse-dot" style={{ animationDelay: '0.3s' }} />
        <circle cx="80" cy="155" r="3" fill="#a855f7" opacity="0.8" className="pulse-dot" style={{ animationDelay: '0.6s' }} />
        <circle cx="130" cy="60" r="3" fill="#6366f1" opacity="0.8" className="pulse-dot" style={{ animationDelay: '0.9s' }} />
      </g>
    </svg>
  </div>
);

export function LoadingState({ progress }: LoadingStateProps) {
  return (
    <div className="loading-state">
      <ScanningVisual progress={progress.progress} />

      <div className="loading-info">
        <h3 className="loading-title">Analyzing Wallet</h3>
        <p className="loading-step">{progress.step}</p>

        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          <span className="progress-percent">{progress.progress}%</span>
        </div>

        <div className="loading-checklist">
          <div className={`checklist-item ${progress.progress >= 20 ? 'completed' : progress.progress >= 10 ? 'active' : ''}`}>
            <span className="checklist-icon">
              {progress.progress >= 20 ? '✓' : '○'}
            </span>
            <span>Transaction History</span>
          </div>
          <div className={`checklist-item ${progress.progress >= 40 ? 'completed' : progress.progress >= 25 ? 'active' : ''}`}>
            <span className="checklist-icon">
              {progress.progress >= 40 ? '✓' : '○'}
            </span>
            <span>Social Identity Links</span>
          </div>
          <div className={`checklist-item ${progress.progress >= 60 ? 'completed' : progress.progress >= 45 ? 'active' : ''}`}>
            <span className="checklist-icon">
              {progress.progress >= 60 ? '✓' : '○'}
            </span>
            <span>Counterparty Analysis</span>
          </div>
          <div className={`checklist-item ${progress.progress >= 80 ? 'completed' : progress.progress >= 65 ? 'active' : ''}`}>
            <span className="checklist-icon">
              {progress.progress >= 80 ? '✓' : '○'}
            </span>
            <span>Behavioral Patterns</span>
          </div>
          <div className={`checklist-item ${progress.progress >= 100 ? 'completed' : progress.progress >= 85 ? 'active' : ''}`}>
            <span className="checklist-icon">
              {progress.progress >= 100 ? '✓' : '○'}
            </span>
            <span>Risk Calculation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
