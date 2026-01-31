"use client";

import { useState, useRef, useEffect, memo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface WalletButtonProps {
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const WalletButton = memo(function WalletButton({
  className,
  onMouseEnter,
  onMouseLeave,
}: WalletButtonProps) {
  const { connected, publicKey, disconnect, select, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (connected && publicKey) {
    const address = publicKey.toBase58();
    const shortAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;

    return (
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className={cn("font-mono", className)}
        >
          [{shortAddress}]
        </Button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-background border border-border shadow-lg z-50">
            <button
              onClick={() => {
                navigator.clipboard.writeText(address);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left text-sm font-mono text-foreground/80 hover:bg-primary/10 hover:text-foreground transition-colors"
            >
              Copy Address
            </button>
            <button
              onClick={async () => {
                await disconnect();
                select(null as unknown as import("@solana/wallet-adapter-base").WalletName);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left text-sm font-mono text-red-400 hover:bg-red-500/10 transition-colors border-t border-border"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Button
      size="sm"
      onClick={() => setVisible(true)}
      isLoading={connecting}
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {connecting ? "[Connecting...]" : "[Connect Wallet]"}
    </Button>
  );
});
