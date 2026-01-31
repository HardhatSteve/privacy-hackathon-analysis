import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { ArrowRight, ArrowLeft, RefreshCw, Lock, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import './RecentActivity.css';

interface Activity {
  id: string;
  type: 'transfer' | 'swap' | 'lending' | 'staking' | 'payment';
  status: 'completed' | 'pending' | 'failed';
  amount: string;
  timestamp: Date;
  from?: string;
  to?: string;
}

const RecentActivity: React.FC = () => {
  // Mock data - replace with real data
  const activities: Activity[] = [
    {
      id: '1',
      type: 'transfer',
      status: 'completed',
      amount: '1,250 SOL',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      from: '7xKX...9mNp',
      to: '4vR8...2kLm',
    },
    {
      id: '2',
      type: 'swap',
      status: 'completed',
      amount: '500 USDC → SOL',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
    },
    {
      id: '3',
      type: 'lending',
      status: 'pending',
      amount: '2,000 USDC',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: '4',
      type: 'staking',
      status: 'completed',
      amount: '5,000 SOL',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
  ];

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'transfer':
        return <ArrowRight size={16} />;
      case 'swap':
        return <RefreshCw size={16} />;
      case 'lending':
        return <Lock size={16} />;
      case 'staking':
        return <Zap size={16} />;
      case 'payment':
        return <ArrowLeft size={16} />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: Activity['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" size="sm">Completed</Badge>;
      case 'pending':
        return <Badge variant="warning" size="sm">Pending</Badge>;
      case 'failed':
        return <Badge variant="error" size="sm">Failed</Badge>;
    }
  };

  return (
    <Card title="Recent Activity" className="recent-activity">
      <div className="activity-list">
        {activities.length === 0 ? (
          <div className="activity-empty">No recent activity</div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">
                {getActivityIcon(activity.type)}
              </div>
              <div className="activity-details">
                <div className="activity-header">
                  <span className="activity-type">{activity.type}</span>
                  {getStatusBadge(activity.status)}
                </div>
                <div className="activity-info">
                  <span className="activity-amount">{activity.amount}</span>
                  {activity.from && activity.to && (
                    <span className="activity-addresses">
                      {activity.from} → {activity.to}
                    </span>
                  )}
                </div>
                <div className="activity-time">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default RecentActivity;
