import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import numeral from 'numeral';
import './PortfolioOverview.css';

const PortfolioOverview: React.FC = () => {
  // Mock data - replace with real data
  const portfolioValue = 125000;
  const portfolioChange24h = 2.5;
  const isPositive = portfolioChange24h >= 0;

  const assetData = [
    { name: 'SOL', value: 45000, color: '#3B82F6' },
    { name: 'USDC', value: 35000, color: '#10B981' },
    { name: 'ETH', value: 25000, color: '#8B5CF6' },
    { name: 'BTC', value: 20000, color: '#F59E0B' },
  ];

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card title="Portfolio Overview" className="portfolio-overview">
      <div className="portfolio-content">
        <div className="portfolio-header">
          <div className="portfolio-value">
            <span className="portfolio-label">Total Value</span>
            <span className="portfolio-amount">
              ${numeral(portfolioValue).format('0,0.00')}
            </span>
          </div>
          <div className="portfolio-change">
            <Badge variant={isPositive ? 'success' : 'error'}>
              {isPositive ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              <span>{isPositive ? '+' : ''}{portfolioChange24h}%</span>
            </Badge>
            <span className="change-label">24h</span>
          </div>
        </div>

        <div className="portfolio-chart">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={assetData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {assetData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | undefined) => {
                  if (value === undefined) return '';
                  return `$${numeral(value).format('0,0.00')}`;
                }}
              />
              <Legend
                formatter={(value) => {
                  const asset = assetData.find((a) => a.name === value);
                  return `${value} ($${numeral(asset?.value || 0).format('0,0')})`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="portfolio-breakdown">
          {assetData.map((asset) => (
            <div key={asset.name} className="asset-item">
              <div className="asset-info">
                <div
                  className="asset-color"
                  style={{ backgroundColor: asset.color }}
                />
                <span className="asset-name">{asset.name}</span>
              </div>
              <div className="asset-value">
                ${numeral(asset.value).format('0,0.00')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default PortfolioOverview;
