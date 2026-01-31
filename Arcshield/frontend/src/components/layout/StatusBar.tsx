import React from 'react';
import { Activity, Clock, Wifi } from 'lucide-react';
import { useArcium } from '../../hooks/useArciumClient';
import './StatusBar.css';

const StatusBar: React.FC = () => {
  const { isInitialized } = useArcium();
  const [lastUpdate] = React.useState(new Date());

  return (
    <footer className="status-bar">
      <div className="status-bar-left">
        <div className="status-item">
          <Activity className="status-icon" size={14} />
          <span className="status-label">System:</span>
          <span className={`status-value ${isInitialized ? 'status-online' : 'status-offline'}`}>
            {isInitialized ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="status-item">
          <Wifi className="status-icon" size={14} />
          <span className="status-label">Connections:</span>
          <span className="status-value">2 Active</span>
        </div>
      </div>

      <div className="status-bar-right">
        <div className="status-item">
          <Clock className="status-icon" size={14} />
          <span className="status-label">Last Update:</span>
          <span className="status-value mono">
            {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;
