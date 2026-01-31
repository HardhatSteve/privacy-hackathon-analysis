'use client';

import { cn, getScoreColor, getScoreGrade } from '@/lib/utils';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showGrade?: boolean;
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    width: 80,
    height: 80,
    strokeWidth: 6,
    fontSize: 'text-lg',
    gradeSize: 'text-xs',
  },
  md: {
    width: 120,
    height: 120,
    strokeWidth: 8,
    fontSize: 'text-2xl',
    gradeSize: 'text-sm',
  },
  lg: {
    width: 180,
    height: 180,
    strokeWidth: 10,
    fontSize: 'text-4xl',
    gradeSize: 'text-lg',
  },
};

export function ScoreGauge({
  score,
  size = 'md',
  showGrade = true,
  showLabel = false,
  animated = true,
  className,
}: ScoreGaugeProps) {
  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const grade = getScoreGrade(score);
  const colorClass = getScoreColor(score);

  // Get the actual color value for the SVG stroke
  const getStrokeColor = () => {
    if (score >= 80) return 'rgb(22, 163, 74)'; // green-600
    if (score >= 60) return 'rgb(34, 197, 94)'; // green-500
    if (score >= 40) return 'rgb(202, 138, 4)'; // yellow-600
    return 'rgb(220, 38, 38)'; // red-600
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={config.width}
        height={config.height}
        viewBox={`0 0 ${config.width} ${config.height}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.width / 2}
          cy={config.height / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx={config.width / 2}
          cy={config.height / 2}
          r={radius}
          fill="none"
          stroke={getStrokeColor()}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? circumference : offset}
          className={cn(
            animated && 'transition-all duration-1000 ease-out'
          )}
          style={animated ? { strokeDashoffset: offset } : undefined}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={cn('font-bold', config.fontSize, colorClass)}>
          {score}
        </span>
        {showGrade && (
          <span className={cn('font-medium text-muted-foreground', config.gradeSize)}>
            {grade}
          </span>
        )}
      </div>
      {showLabel && (
        <span className="absolute -bottom-6 text-xs text-muted-foreground">
          Privacy Score
        </span>
      )}
    </div>
  );
}
