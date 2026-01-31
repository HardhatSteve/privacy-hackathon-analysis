import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { ScoreBreakdown as IScoreBreakdown } from '../types/api';
import ScoreBreakdown from './ScoreBreakdown';
import { cn } from '../lib/utils';

interface ExposureGaugeProps {
  score: number;
  breakdown: IScoreBreakdown;
}

const ExposureGauge: React.FC<ExposureGaugeProps> = ({ score, breakdown }) => {
  const getScoreColor = (s: number) => {
    if (s > 60) return '#ef4444'; // Red
    if (s > 30) return '#fbbf24'; // Yellow
    return '#14F195'; // Solana Green
  };

  const scoreData = [{ value: score, fill: getScoreColor(score) }];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      {/* Large Radial Gauge */}
      <div className="relative p-6 rounded-[2.5rem] bg-secondary/20 border border-border flex flex-col items-center justify-center min-h-[400px]">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground absolute top-10">
          Privacy Vulnerability Index
        </h3>
        
        <div className="w-full h-80 relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart 
              innerRadius="80%" 
              outerRadius="100%" 
              data={scoreData} 
              startAngle={225} 
              endAngle={-45}
            >
              <PolarAngleAxis 
                type="number" 
                domain={[0, 100]} 
                angleAxisId={0} 
                tick={false} 
              />
              <RadialBar 
                background={{ fill: 'rgba(255,255,255,0.05)' }} 
                dataKey="value" 
                cornerRadius={20}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
            <span className={cn(
              "text-8xl font-black tabular-nums tracking-tighter drop-shadow-2xl",
              score > 60 ? "text-red-500" : score > 30 ? "text-yellow-500" : "text-solana-green"
            )}>
              {score}
            </span>
            <span className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.4em] mt-2 opacity-60">
              Score
            </span>
          </div>
        </div>

        <div className="mt-4 px-6 py-2 rounded-full border border-white/5 bg-white/5 text-[10px] font-bold text-muted-foreground flex gap-3">
          <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-solana-green" /> Low</div>
          <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Medium</div>
          <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500" /> High</div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="p-8 rounded-[2.5rem] bg-secondary/10 border border-border/50">
        <h3 className="text-sm font-black mb-8 uppercase tracking-widest text-foreground/70">
          Detailed Leak Vectors
        </h3>
        <ScoreBreakdown breakdown={breakdown} />
      </div>
    </div>
  );
};

export default ExposureGauge;