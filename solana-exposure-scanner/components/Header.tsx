import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, ExternalLink, Globe } from 'lucide-react';

type Network = 'mainnet' | 'devnet';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [network, setNetwork] = useState<Network>('mainnet');
  const [switching, setSwitching] = useState(false);

  // Fetch current network on mount
  useEffect(() => {
    fetch('/api/network')
      .then(res => res.json())
      .then(data => setNetwork(data.network))
      .catch(() => { }); // Ignore errors, default to mainnet
  }, []);

  const toggleNetwork = async () => {
    const newNetwork: Network = network === 'mainnet' ? 'devnet' : 'mainnet';
    setSwitching(true);
    try {
      const res = await fetch('/api/network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ network: newNetwork })
      });
      if (res.ok) {
        setNetwork(newNetwork);
      }
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header className="border-b border-border py-4 px-6 sticky top-0 bg-background/80 backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-solana-green to-solana-purple flex items-center justify-center font-black text-white shadow-lg shadow-solana-purple/20 group-hover:scale-110 transition-transform">
            S
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black tracking-tighter solana-text-gradient">
              SOLANA EXPOSURE SCANNER
            </h1>
          </div>
        </div>

        <nav className="flex items-center gap-4 md:gap-6">
          {/* Network Toggle */}
          <button
            onClick={toggleNetwork}
            disabled={switching}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${network === 'devnet'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-solana-green/20 text-solana-green border border-solana-green/30'
              } ${switching ? 'opacity-50' : 'hover:scale-105'}`}
          >
            <Globe className="w-3 h-3" />
            <span>{network}</span>
          </button>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all hover:scale-105"
          >
            <Github className="w-4 h-4" />
            <span className="hidden md:inline">Source</span>
          </a>
          <a
            href="https://app.encifher.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-solana-purple/10 text-solana-purple rounded-full hover:bg-solana-purple/20 transition-all text-[11px] font-black uppercase tracking-[0.2em]"
          >
            Encrypt Trade
            <ExternalLink className="w-3 h-3" />
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;