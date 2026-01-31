import type { RiskLevel } from '../types/exposure';

interface ExposureScoreProps {
  score: number;
  level: RiskLevel;
}

export function ExposureScore({ score, level }: ExposureScoreProps) {
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const levelColors = {
    Low: '#22c55e',
    Medium: '#f59e0b',
    High: '#ef4444',
  };

  const color = levelColors[level];

  return (
    <div className="exposure-score">
      <div className="score-circle">
        <svg viewBox="0 0 120 120">
          <circle
            className="score-bg"
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="#2a2a3e"
            strokeWidth="8"
          />
          <circle
            className="score-ring"
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="score-value">
          <span className="score-number">{score}</span>
          <span className="score-label">/ 100</span>
        </div>
      </div>
      <div className="score-level" style={{ color }}>
        {level} Exposure
      </div>
      <p className="score-description">
        {level === 'Low' && 'This wallet has minimal on-chain exposure.'}
        {level === 'Medium' && 'This wallet has moderate privacy exposure.'}
        {level === 'High' && 'This wallet is highly exposed to on-chain surveillance.'}
      </p>
    </div>
  );
}
