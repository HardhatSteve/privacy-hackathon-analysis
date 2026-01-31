'use client';

/**
 * PrivacyTicker - Live threat feed with scrolling messages
 * Simple scrolling text matching page theme
 */

interface PrivacyTickerProps {
  darkMode: boolean;
}

const TICKER_MESSAGES = [
  "SCANNING BLOCK #241,512,110...",
  "[ALERT] Wallet 8x...22 FLAG: DIRECT CEX INTERACTION",
  "[INFO] Indexing SPL Token transfers via Helius RPC...",
  "[WARNING] Clustering detected in Pool #4A...",
  "[TIP] Did you know? POAPs reveal your physical location history.",
  "[EDU] Centralized Exchanges (CEX) link your on-chain identity to your government ID.",
  "[SEC] Range Protocol helps institutions screen wallets for sanctions compliance.",
  "[TIP] Use Privacy Cash or Radr Labs to break transaction links.",
  "[INFO] Public RPCs can log your IP address. Always use a VPN.",
  "[EDU] Address clustering can link multiple wallets to a single identity.",
];

export function PrivacyTicker({ darkMode }: PrivacyTickerProps) {
  const messages = [...TICKER_MESSAGES, ...TICKER_MESSAGES];
  
  return (
    <div className={`w-full overflow-hidden border-t ${darkMode ? 'border-white/10 bg-black' : 'border-black/10 bg-white'}`}>
      <div className="animate-marquee whitespace-nowrap py-3">
        {messages.map((msg, i) => (
          <span 
            key={i} 
            className={`inline-block mx-6 font-mono text-xs tracking-wide ${darkMode ? 'text-white/60' : 'text-black/60'}`}
          >
            {msg}
          </span>
        ))}
      </div>
    </div>
  );
}
