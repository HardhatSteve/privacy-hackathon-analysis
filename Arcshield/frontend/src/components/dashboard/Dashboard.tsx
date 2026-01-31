import React from 'react';
import Card from '../ui/Card';
import PortfolioOverview from './PortfolioOverview';
import RecentActivity from './RecentActivity';
import SystemStatus from './SystemStatus';
import QuickActions from './QuickActions';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <div className="dashboard-panel">
          <PortfolioOverview />
        </div>
        <div className="dashboard-panel">
          <RecentActivity />
        </div>
        <div className="dashboard-panel">
          <SystemStatus />
        </div>
        <div className="dashboard-panel">
          <QuickActions />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
