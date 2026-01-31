import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { Shield, Wifi, Cpu, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useArcium } from '../../hooks/useArciumClient';
import './SystemStatus.css';

const SystemStatus: React.FC = () => {
  const { isInitialized } = useArcium();

  const statusItems = [
    {
      label: 'Arcium Cluster',
      status: isInitialized ? 'online' : 'offline',
      icon: Shield,
    },
    {
      label: 'Network Connection',
      status: 'online',
      icon: Wifi,
    },
    {
      label: 'Active Computations',
      status: 'online',
      value: '3',
      icon: Cpu,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle size={16} className="status-icon-online" />;
      case 'offline':
        return <XCircle size={16} className="status-icon-offline" />;
      default:
        return <AlertCircle size={16} className="status-icon-warning" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge variant="success" size="sm">Online</Badge>;
      case 'offline':
        return <Badge variant="error" size="sm">Offline</Badge>;
      default:
        return <Badge variant="warning" size="sm">Warning</Badge>;
    }
  };

  return (
    <Card title="System Status" className="system-status">
      <div className="status-list">
        {statusItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="status-item">
              <div className="status-item-header">
                <div className="status-item-info">
                  <Icon className="status-item-icon" size={18} />
                  <span className="status-item-label">{item.label}</span>
                </div>
                {getStatusBadge(item.status)}
              </div>
              <div className="status-item-details">
                {getStatusIcon(item.status)}
                {item.value && (
                  <span className="status-item-value">{item.value}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="status-footer">
        <div className="status-metric">
          <span className="metric-label">Uptime</span>
          <span className="metric-value">99.9%</span>
        </div>
        <div className="status-metric">
          <span className="metric-label">Latency</span>
          <span className="metric-value">45ms</span>
        </div>
      </div>
    </Card>
  );
};

export default SystemStatus;
