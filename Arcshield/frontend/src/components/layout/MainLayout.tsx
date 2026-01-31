import React from 'react';
import './MainLayout.css';

interface MainLayoutProps {
  children: React.ReactNode;
  sidebarCollapsed?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, sidebarCollapsed = false }) => {
  return (
    <div className="main-layout">
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
