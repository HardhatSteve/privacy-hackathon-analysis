import { useState } from 'react';

export default function DonationBox() {
  const [copied, setCopied] = useState(false);
  const walletAddress = "DqSci9pg4PKj3bTK5vuWPSkfpA3Thw3TkN6kzs9oVJD7";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="donation-box w-full max-w-md p-6 mt-12 text-center">
      <h2 className="text-2xl font-bold mb-4 uppercase tracking-widest">
        Support Gaming Lounge
      </h2>
      
      <p className="mb-4 text-sm">
        Help us build the next-generation gaming lounge at{' '}
        <a 
          href="https://hardhattechbones.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-lime-500 glow-text hover:underline"
        >
          hardhattechbones.com
        </a>
      </p>

      <p className="mb-4 text-xs">
        Every donation helps us create innovative gaming experiences with cutting-edge technology.
      </p>

      <p className="text-xs mb-6 font-bold uppercase">Send SOL to:</p>

      <div className="wallet-address">
        {walletAddress}
      </div>

      <button
        onClick={copyToClipboard}
        className="copy-button w-full mb-4"
      >
        {copied ? '✓ COPIED' : 'COPY ADDRESS'}
      </button>

      <p className="text-xs text-lime-500">
        // All donations go towards building the future of gaming
      </p>
    </div>
  );
}
