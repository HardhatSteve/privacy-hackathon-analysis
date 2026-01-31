import * as React from "react";
import { Button } from "@/components/ui/button";
import { Search, AlertCircle } from "lucide-react";

interface WalletInputProps {
  onSubmit: (wallet: string) => void;
  isLoading?: boolean;
}

export const WalletInput = React.forwardRef<HTMLFormElement, WalletInputProps>(
  ({ onSubmit, isLoading }, ref) => {
  const [wallet, setWallet] = React.useState("");
  const [error, setError] = React.useState("");

  const validateSolanaAddress = (address: string): boolean => {
    // Basic Solana address validation (base58, 32-44 chars)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedWallet = wallet.trim();
    if (!trimmedWallet) {
      setError("Please enter a wallet address");
      return;
    }

    if (!validateSolanaAddress(trimmedWallet)) {
      setError("Invalid Solana wallet address");
      return;
    }

    onSubmit(trimmedWallet);
  };

  return (
    <form ref={ref} onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary/20 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300" />
        <div className="relative flex items-center gap-3 bg-card border border-border rounded-xl p-2">
          <div className="flex-1">
            <input
              type="text"
              value={wallet}
              onChange={(e) => {
                setWallet(e.target.value);
                setError("");
              }}
              placeholder="Enter Solana wallet address..."
              className="w-full bg-transparent px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none font-mono text-sm"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            variant="cyber"
            size="lg"
            disabled={isLoading}
            className="shrink-0"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4" />
                Analyze
              </>
            )}
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="flex items-center gap-2 mt-3 text-destructive text-sm animate-fade-in-up">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <p className="text-center text-muted-foreground text-sm mt-4">
        Analyze any wallet • Optional on-chain anchoring on Devnet
      </p>
    </form>
  );
  },
);

WalletInput.displayName = "WalletInput";


