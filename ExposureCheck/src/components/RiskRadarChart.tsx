import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { CategoryScore, RiskLevel } from '../types/exposure';

interface RiskRadarChartProps {
  categories: CategoryScore[];
  overallLevel: RiskLevel;
}

export function RiskRadarChart({ categories, overallLevel }: RiskRadarChartProps) {
  // Map categories to chart data with shortened names
  const chartData = categories.map((cat) => ({
    category: shortenCategoryName(cat.name),
    fullName: cat.name,
    score: cat.score,
    level: cat.level,
    description: cat.description,
  }));

  // Color based on overall risk level
  const getColor = () => {
    switch (overallLevel) {
      case 'Low':
        return { fill: 'rgba(34, 197, 94, 0.3)', stroke: '#22c55e' };
      case 'Medium':
        return { fill: 'rgba(245, 158, 11, 0.3)', stroke: '#f59e0b' };
      case 'High':
        return { fill: 'rgba(239, 68, 68, 0.3)', stroke: '#ef4444' };
    }
  };

  const colors = getColor();

  return (
    <div className="risk-radar-chart">
      <h3 className="panel-title">Risk Breakdown</h3>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="#2a2a3e" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: '#9090a0', fontSize: 11 }}
            tickLine={{ stroke: '#2a2a3e' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#6b6b7b', fontSize: 10 }}
            tickCount={5}
            axisLine={false}
          />
          <Radar
            name="Exposure Score"
            dataKey="score"
            stroke={colors.stroke}
            fill={colors.fill}
            strokeWidth={2}
            dot={{ r: 4, fill: colors.stroke }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length > 0) {
                const data = payload[0].payload;
                return (
                  <div className="radar-tooltip">
                    <div className="tooltip-title">{data.fullName}</div>
                    <div className="tooltip-score">Score: {data.score}/100</div>
                    <div className="tooltip-level" data-level={data.level}>
                      {data.level} Exposure
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function shortenCategoryName(name: string): string {
  const mapping: Record<string, string> = {
    'Wallet Activity': 'Activity',
    'Address Linkability': 'Linkability',
    'Social Exposure': 'Social',
    'Behavioral Profiling': 'Behavioral',
    'Financial Footprint': 'Financial',
    'Privacy Hygiene': 'Privacy',
  };
  return mapping[name] || name;
}
