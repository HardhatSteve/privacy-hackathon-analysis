import React, { useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { ArciumProvider } from './hooks/useArciumClient';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import MainLayout from './components/layout/MainLayout';
import StatusBar from './components/layout/StatusBar';
import Dashboard from './components/dashboard/Dashboard';
import PrivateTransfer from './components/PrivateTransfer';
import PrivateSwap from './components/PrivateSwap';
import PrivateLending from './components/PrivateLending';
import PrivateStaking from './components/PrivateStaking';
import PrivatePayment from './components/PrivatePayment';
import TransactionTracker from './components/TransactionTracker';
import './App.css';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

function App() {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = React.useMemo(() => clusterApiUrl(network), [network]);
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const wallets = React.useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'operations':
        return (
          <div className="operations-view">
            <div className="operations-grid">
              <PrivateTransfer />
              <PrivateSwap />
              <PrivateLending />
              <PrivateStaking />
              <PrivatePayment />
            </div>
            <TransactionTracker />
          </div>
        );
      case 'analytics':
        return <div className="analytics-view">Analytics Panel - Coming Soon</div>;
      case 'history':
        return <div className="history-view">Transaction History - Coming Soon</div>;
      case 'settings':
        return <div className="settings-view">Settings - Coming Soon</div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <ArciumProvider>
            <div className="enterprise-app">
              <Header network={network === WalletAdapterNetwork.Devnet ? 'Devnet' : 'Mainnet'} />
              <div className="app-body">
                <Sidebar
                  activeView={activeView}
                  onViewChange={setActiveView}
                  collapsed={sidebarCollapsed}
                  onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                />
                <MainLayout sidebarCollapsed={sidebarCollapsed}>
                  {renderView()}
                </MainLayout>
              </div>
              <StatusBar />
            </div>
          </ArciumProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
