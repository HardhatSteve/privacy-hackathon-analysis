import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Landing from './components/Landing';
import PrivacyScoreExplanation from './components/PrivacyScoreExplanation';
import Dashboard from './components/Dashboard';
import Header from './components/Header';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <div className="min-h-screen bg-background text-foreground selection:bg-solana-purple/30 flex flex-col">
          <Header />

          <main className="max-w-7xl mx-auto p-4 md:p-12 w-full flex-grow">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/scan/:address" element={<Dashboard />} />
              <Route path="/privacy-score" element={<PrivacyScoreExplanation />} />
            </Routes>
          </main>

          <footer className="border-t border-border mt-20 py-12 px-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-black tracking-tighter text-sm uppercase">
                  <div className="w-5 h-5 rounded bg-gradient-to-br from-solana-green to-solana-purple flex items-center justify-center text-[10px]">S</div>
                  Solana Exposure Scanner
                </div>
                <p className="text-xs text-muted-foreground max-w-sm">
                  The ultimate privacy auditing tool for the Solana ecosystem. Powered by AI and on-chain intelligence.
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex gap-4 items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Network</span>
                  <div className="flex items-center gap-2 px-3 py-1 bg-solana-green/10 text-solana-green rounded-full text-[10px] font-bold border border-solana-green/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-solana-green animate-pulse"></div>
                    Mainnet Beta
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground font-medium">
                  © {new Date().getFullYear()} SES Labs. All rights reserved.
                </div>
              </div>
            </div>
          </footer>
        </div>
      </HashRouter>
    </QueryClientProvider>
  );
};

export default App;