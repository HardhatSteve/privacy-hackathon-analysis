import { useState } from 'react';
import { isValidSolanaAddress } from '../services/apiService';

interface WalletInputProps {
  onSubmit: (address: string) => void;
  isLoading: boolean;
}

// Search/scan icon
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
  </svg>
);

// Shield scan icon for button
const ScanIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
    <path d="M12 8v4M12 16v.01" strokeLinecap="round" />
  </svg>
);

// Loading spinner
const SpinnerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" className="spin">
    <circle cx="12" cy="12" r="10" opacity="0.25" />
    <path d="M12 2a10 10 0 019.17 6" strokeLinecap="round" />
  </svg>
);

// Error icon
const ErrorIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16v.01" strokeLinecap="round" />
  </svg>
);

export function WalletInput({ onSubmit, isLoading }: WalletInputProps) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = address.trim();
    if (!trimmed) {
      setError('Please enter a wallet address');
      return;
    }

    if (!isValidSolanaAddress(trimmed)) {
      setError('Invalid Solana address format');
      return;
    }

    onSubmit(trimmed);
  };

  return (
    <form className="wallet-input" onSubmit={handleSubmit}>
      <div className="input-wrapper">
        <div className="input-container">
          <span className="input-icon">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter Solana wallet address (e.g., 7xKXtg...)"
            disabled={isLoading}
            className={error ? 'error' : ''}
          />
        </div>
        <button type="submit" disabled={isLoading || !address.trim()}>
          {isLoading ? (
            <>
              <SpinnerIcon />
              <span>Scanning...</span>
            </>
          ) : (
            <>
              <ScanIcon />
              <span>Analyze Exposure</span>
            </>
          )}
        </button>
      </div>
      {error && (
        <p className="error-message">
          <ErrorIcon />
          <span>{error}</span>
        </p>
      )}
    </form>
  );
}
