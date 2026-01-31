import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useArcium } from '../../hooks/useArciumClient';
import { 
  Bell, 
  Settings, 
  LogOut, 
  ChevronDown,
  Wifi,
  WifiOff,
  Shield,
  ShieldCheck
} from 'lucide-react';
import './Header.css';

interface HeaderProps {
  network: string;
}

const Header: React.FC<HeaderProps> = ({ network }) => {
  const { publicKey, disconnect } = useWallet();
  const { isInitialized } = useArcium();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <header className="enterprise-header">
      <div className="header-left">
        <div className="logo">
          <Shield className="logo-icon" />
          <div className="logo-text">
            <span className="logo-title">ArcShield Finance</span>
            <span className="logo-subtitle">Private DeFi Platform</span>
          </div>
        </div>
      </div>

      <div className="header-center">
        <div className="status-indicators">
          <div className="status-item">
            <span className="status-label">Network:</span>
            <span className={`status-value network-${network.toLowerCase()}`}>
              {network}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Arcium:</span>
            {isInitialized ? (
              <span className="status-value status-connected">
                <ShieldCheck className="status-icon" size={14} />
                Connected
              </span>
            ) : (
              <span className="status-value status-disconnected">
                <WifiOff className="status-icon" size={14} />
                Disconnected
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="header-right">
        <button
          className="header-button notification-button"
          onClick={() => setShowNotifications(!showNotifications)}
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="notification-badge">3</span>
        </button>

        {publicKey && (
          <div className="user-menu-container">
            <button
              className="header-button user-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="wallet-address">
                <Wifi className="wallet-icon" size={14} />
                <span className="mono">{truncateAddress(publicKey.toString())}</span>
              </div>
              <ChevronDown size={16} className={showUserMenu ? 'rotated' : ''} />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="backdrop"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="user-menu">
                  <div className="user-menu-header">
                    <div className="wallet-address-full">
                      <span className="mono">{publicKey.toString()}</span>
                    </div>
                  </div>
                  <div className="user-menu-divider" />
                  <button
                    className="user-menu-item"
                    onClick={() => {
                      setShowUserMenu(false);
                      // Navigate to settings
                    }}
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                  <button
                    className="user-menu-item"
                    onClick={() => {
                      disconnect();
                      setShowUserMenu(false);
                    }}
                  >
                    <LogOut size={16} />
                    <span>Disconnect</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
