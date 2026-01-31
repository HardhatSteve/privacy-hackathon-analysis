import { useEffect, useState } from "react";

interface ScoreGaugeProps {
  score: number;
  size?: number;
}

export const ScoreGauge = ({ score, size = 200 }: ScoreGaugeProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    const duration = 1500;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(score * easeOut));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [score]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return { stroke: "hsl(142 72% 45%)", glow: "glow-success", label: "Strong" };
    if (s >= 60) return { stroke: "hsl(175 84% 45%)", glow: "glow-primary", label: "Moderate" };
    if (s >= 40) return { stroke: "hsl(38 92% 55%)", glow: "glow-warning", label: "Elevated" };
    return { stroke: "hsl(0 72% 55%)", glow: "glow-danger", label: "Critical" };
  };

  const { stroke, glow, label } = getScoreColor(score);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className={`transform -rotate-90 ${glow}`}
        style={{ borderRadius: "50%" }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(222 30% 15%)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300"
        />
      </svg>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold text-foreground tabular-nums">
          {animatedScore}
        </span>
        <span className="text-sm text-muted-foreground mt-1">Privacy Score</span>
        <span 
          className="text-xs font-semibold uppercase tracking-wider mt-2 px-3 py-1 rounded-full"
          style={{ 
            backgroundColor: `${stroke}20`,
            color: stroke 
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
};
