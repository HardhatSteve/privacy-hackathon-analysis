import React from 'react';
import { LayoutDashboard, Lock, BarChart3, List, Settings } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'operations', label: 'Private Operations', icon: Lock },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'history', label: 'Transaction History', icon: List },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  collapsed = false,
  onToggleCollapse,
}) => {
  return (
    <aside className={`enterprise-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => onViewChange(item.id)}
              aria-label={item.label}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="sidebar-icon" size={20} />
              {!collapsed && <span className="sidebar-label">{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
