import type { RiskLevel } from '../types/exposure';

interface RiskGaugeProps {
  score: number;
  level: RiskLevel;
}

export function RiskGauge({ score, level }: RiskGaugeProps) {
  // Semi-circular gauge parameters
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2 - 10;
  const centerX = size / 2;
  const centerY = size / 2 + 15;

  // Arc parameters (180 degrees = semicircle)
  const startAngle = 180;
  const circumference = Math.PI * radius;

  // Calculate the arc position based on score (0-100)
  const normalizedScore = Math.min(100, Math.max(0, score));
  const progress = normalizedScore / 100;
  const progressOffset = circumference * (1 - progress);

  // Needle angle (0 is left, 180 is right for a top semicircle)
  const needleAngle = startAngle - (progress * 180);
  const needleLength = radius - 12;
  const needleX = centerX + needleLength * Math.cos((needleAngle * Math.PI) / 180);
  const needleY = centerY - needleLength * Math.sin((needleAngle * Math.PI) / 180);

  // Color based on risk level
  const getColor = () => {
    switch (level) {
      case 'Low': return '#22c55e';
      case 'Medium': return '#f59e0b';
      case 'High': return '#ef4444';
    }
  };

  const getGlow = () => {
    switch (level) {
      case 'Low': return 'rgba(34, 197, 94, 0.4)';
      case 'Medium': return 'rgba(245, 158, 11, 0.4)';
      case 'High': return 'rgba(239, 68, 68, 0.4)';
    }
  };

  // Create arc path
  const createArc = (startAngle: number, endAngle: number, r: number = radius) => {
    const start = {
      x: centerX + r * Math.cos((startAngle * Math.PI) / 180),
      y: centerY + r * Math.sin((startAngle * Math.PI) / 180),
    };
    const end = {
      x: centerX + r * Math.cos((endAngle * Math.PI) / 180),
      y: centerY + r * Math.sin((endAngle * Math.PI) / 180),
    };
    return `M ${start.x} ${start.y} A ${r} ${r} 0 0 1 ${end.x} ${end.y}`;
  };

  const color = getColor();
  const glow = getGlow();

  // Risk level icon path
  const getLevelIcon = () => {
    switch (level) {
      case 'Low':
        return <path d="M-6 0 L-2 4 L6 -4" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />;
      case 'Medium':
        return <path d="M0 -5 L0 2 M0 5 L0 5.5" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />;
      case 'High':
        return <path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />;
    }
  };

  return (
    <div className="risk-gauge">
      <svg width={size} height={size / 2 + 45} viewBox={`0 0 ${size} ${size / 2 + 45}`}>
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <filter id="gaugeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="needleGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer decorative ring */}
        <path
          d={createArc(180, 0, radius + 18)}
          fill="none"
          stroke="rgba(99, 102, 241, 0.1)"
          strokeWidth="1"
          strokeDasharray="4 6"
        />

        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = 180 - (tick / 100) * 180;
          const innerR = radius + 2;
          const outerR = radius + 8;
          const x1 = centerX + innerR * Math.cos((angle * Math.PI) / 180);
          const y1 = centerY + innerR * Math.sin((angle * Math.PI) / 180);
          const x2 = centerX + outerR * Math.cos((angle * Math.PI) / 180);
          const y2 = centerY + outerR * Math.sin((angle * Math.PI) / 180);
          return (
            <line
              key={tick}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={tick === 50 ? '#6366f1' : 'rgba(255,255,255,0.2)'}
              strokeWidth={tick === 50 ? 2 : 1}
            />
          );
        })}

        {/* Background arc */}
        <path
          d={createArc(180, 0)}
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Progress arc with gradient */}
        <path
          d={createArc(180, 0)}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          filter="url(#gaugeGlow)"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />

        {/* Needle */}
        <g filter="url(#needleGlow)">
          <line
            x1={centerX}
            y1={centerY}
            x2={needleX}
            y2={needleY}
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            style={{ transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </g>

        {/* Center dot with icon */}
        <circle cx={centerX} cy={centerY} r={14} fill="rgba(0,0,0,0.5)" />
        <circle cx={centerX} cy={centerY} r={12} fill={color} style={{ filter: `drop-shadow(0 0 8px ${glow})` }} />
        <g transform={`translate(${centerX}, ${centerY})`}>
          {getLevelIcon()}
        </g>

        {/* Scale labels */}
        <text x={25} y={centerY + 20} fill="#6b7280" fontSize="10" fontWeight="500">0</text>
        <text x={size / 2} y={12} fill="#6b7280" fontSize="10" fontWeight="500" textAnchor="middle">50</text>
        <text x={size - 25} y={centerY + 20} fill="#6b7280" fontSize="10" fontWeight="500" textAnchor="end">100</text>
      </svg>

      <div className="gauge-value">
        <span className="gauge-score" style={{ color }}>{Math.round(score)}</span>
        <span className="gauge-level" style={{ color, backgroundColor: `${color}15`, borderColor: `${color}30` }}>
          {level} Risk
        </span>
      </div>
    </div>
  );
}
