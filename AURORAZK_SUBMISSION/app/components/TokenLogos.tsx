'use client';

// Solana Logo SVG Component
export function SolanaLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 397.7 311.7" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="solGradA" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
        <linearGradient id="solGradB" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#19FB9B" />
          <stop offset="100%" stopColor="#8752F3" />
        </linearGradient>
        <linearGradient id="solGradC" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#DC1FFF" />
          <stop offset="100%" stopColor="#8752F3" />
        </linearGradient>
      </defs>
      <path fill="url(#solGradA)" d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z"/>
      <path fill="url(#solGradB)" d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z"/>
      <path fill="url(#solGradC)" d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4c5.8,0,8.7-7,4.6-11.1L333.1,120.1z"/>
    </svg>
  );
}

// USDC Logo SVG Component
export function UsdcLogo({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#2775CA"/>
      <path fill="#FFFFFF" d="M20.5 18.2c0-2-1.2-2.7-3.6-3-.8-.1-1.6-.3-2.4-.5-.8-.2-1.4-.5-1.4-1.1 0-.6.5-1 1.4-1.1 1.3-.1 2.6.2 3.8.7l.5-1.6c-1.3-.5-2.7-.8-4.2-.7v-2h-1.5v2c-1.8.2-3 1.2-3 2.7 0 1.9 1.2 2.6 3.6 2.9.8.1 1.6.3 2.4.5.8.2 1.4.5 1.4 1.2 0 .7-.6 1.1-1.7 1.2-1.5.1-3-.3-4.3-.9l-.5 1.6c1.4.6 2.9.9 4.5.9v2.1h1.5v-2.1c1.9-.2 3.5-1.2 3.5-2.8z"/>
      <path fill="#FFFFFF" d="M12.2 23.5c-3.8-1.5-5.7-5.8-4.2-9.6s5.8-5.7 9.6-4.2c1 .4 1.9 1 2.6 1.7l1.2-1.2c-3.2-3.2-8.4-3.2-11.6 0s-3.2 8.4 0 11.6c1.5 1.5 3.5 2.4 5.6 2.5v-1.7c-1.2-.1-2.3-.5-3.2-1.1z"/>
      <path fill="#FFFFFF" d="M22.4 8.3c3.2 3.2 3.2 8.4 0 11.6-1.5 1.5-3.5 2.4-5.6 2.5v1.7c5.2-.3 9.2-4.6 8.9-9.8-.1-2.4-1.1-4.6-2.8-6.3l-1.2 1.2c.4.3.6.7.7 1.1z"/>
    </svg>
  );
}
