import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { 
  Anchor, 
  ExternalLink, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Copy,
  Coins,
  Shield,
  Wallet
} from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import type { AnalysisResult } from "@/lib/api";
import { createHashPayload, computeReportHash } from "@/lib/report-hash";
import { 
  checkDevnetBalance, 
  requestDevnetAirdrop,
} from "@/lib/anchor-service";
import {
  anchorReportWithProgram,
  ANCHOR_PROGRAM_ID,
} from "@/lib/anchor-program";

interface AnchorReportProps {
  data: AnalysisResult;
}

type AnchorState = "idle" | "connecting" | "signing" | "confirming" | "success" | "error";

interface ExtendedAnchorResult {
  signature: string;
  explorerUrl: string;
  timestamp: number;
  hash: string;
  slot: number;
  usedCustomProgram?: boolean;
  pda?: string;
}

export const AnchorReport = ({ data }: AnchorReportProps) => {
  const { publicKey, signTransaction, connected, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [state, setState] = useState<AnchorState>("idle");
  const [result, setResult] = useState<ExtendedAnchorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hashHex, setHashHex] = useState<string | null>(null);
  const [isRequestingAirdrop, setIsRequestingAirdrop] = useState(false);

  const handleConnectClick = () => {
    setVisible(true);
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const handleAnchor = async () => {
    if (!connected || !publicKey || !signTransaction) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setState("signing");
      setError(null);

      // Check balance first
      const { sufficient, balance } = await checkDevnetBalance(publicKey);
      if (!sufficient) {
        setState("idle");
        toast.error(`Insufficient devnet SOL (${balance.toFixed(4)} SOL). Request an airdrop first.`);
        return;
      }

      // Generate hash
      const payload = createHashPayload(data);
      const { hashHex: computedHash, hash: hashBytes } = await computeReportHash(payload);
      setHashHex(computedHash);

      setState("confirming");
      
      // Anchor on-chain (uses custom program if deployed, otherwise SPL Memo)
      const anchorResult = await anchorReportWithProgram(
        { publicKey, signTransaction, connected },
        data.wallet,
        computedHash,
        hashBytes
      );
      setResult(anchorResult);
      
      if (anchorResult.usedCustomProgram) {
        toast.success("Report anchored via custom Anchor program!");
      } else {
        toast.success("Report anchored on Solana Devnet!");
      }
      setState("success");
    } catch (err) {
      console.error("Anchor error:", err);
      setError(err instanceof Error ? err.message : "Failed to anchor report");
      setState("error");
      toast.error("Failed to anchor report");
    }
  };

  const handleAirdrop = async () => {
    if (!publicKey) return;
    
    setIsRequestingAirdrop(true);
    try {
      await requestDevnetAirdrop(publicKey);
      toast.success("Received 0.1 SOL on Devnet!");
    } catch (err) {
      console.error("Airdrop error:", err);
      toast.error("Airdrop failed. Try again or use Solana faucet.");
    } finally {
      setIsRequestingAirdrop(false);
    }
  };

  const copyHash = () => {
    if (hashHex) {
      navigator.clipboard.writeText(hashHex);
      toast.success("Hash copied to clipboard");
    }
  };

  const copySignature = () => {
    if (result?.signature) {
      navigator.clipboard.writeText(result.signature);
      toast.success("Signature copied to clipboard");
    }
  };

  // Success state
  if (state === "success" && result) {
    return (
      <div className="card-cyber rounded-xl p-6 border border-success/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-success/10">
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Report Anchored on Devnet</h3>
            {result.usedCustomProgram && (
              <div className="flex items-center gap-1.5 mt-1">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-primary">Custom Anchor Program</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          {result.pda && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 space-y-2">
              <span className="text-sm font-medium text-primary">Report PDA Account</span>
              <code className="text-xs font-mono text-foreground break-all block">
                {result.pda}
              </code>
            </div>
          )}

          <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Report Hash</span>
              <Button variant="ghost" size="sm" className="h-6 px-2" onClick={copyHash}>
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
            </div>
            <code className="text-xs font-mono text-foreground break-all block">
              {result.hash}
            </code>
          </div>

          <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Transaction Signature</span>
              <Button variant="ghost" size="sm" className="h-6 px-2" onClick={copySignature}>
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
            </div>
            <code className="text-xs font-mono text-foreground break-all block">
              {result.signature}
            </code>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">
              Slot #{result.slot}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open(result.explorerUrl, "_blank")}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View on Explorer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Signing/Confirming state
  if (state === "signing" || state === "confirming") {
    return (
      <div className="card-cyber rounded-xl p-6">
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <div className="text-center">
            <p className="font-medium text-foreground">
              {state === "signing" ? "Sign the transaction in your wallet" : "Confirming on Devnet..."}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {state === "signing" 
                ? "This will anchor your report hash on Solana Devnet" 
                : "Waiting for network confirmation"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (state === "error") {
    return (
      <div className="card-cyber rounded-xl p-6 border border-destructive/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-destructive/10">
            <AlertCircle className="w-5 h-5 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Anchoring Failed</h3>
        </div>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => setState("idle")} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  // Idle state - prompt to anchor
  return (
    <div className="card-cyber rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Anchor className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Anchor on Solana Devnet</h3>
      </div>
      
      <p className="text-muted-foreground mb-6">
        Create a tamper-evident proof of this privacy report by anchoring its cryptographic 
        hash on Solana Devnet. This provides verifiable integrity without exposing any data.
      </p>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {!connected ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
            <Button onClick={handleConnectClick} className="gap-2">
              <Wallet className="w-4 h-4" />
              Connect
            </Button>
            <span className="text-sm text-muted-foreground text-center sm:text-left">
              Connect wallet to anchor report
            </span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
            <Button onClick={handleAnchor} className="gap-2">
              <Anchor className="w-4 h-4" />
              Anchor Report
            </Button>
            <Button 
              variant="outline" 
              onClick={handleAirdrop}
              disabled={isRequestingAirdrop}
              className="gap-2"
            >
              {isRequestingAirdrop ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Coins className="w-4 h-4" />
              )}
              Request Devnet SOL
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleDisconnect}
              className="gap-2"
            >
              <Wallet className="w-4 h-4" />
              {wallet?.adapter.name || "Disconnect"}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
        <strong>Note:</strong> Anchoring uses Solana Devnet and requires a small amount of devnet SOL 
        for transaction fees. Use the airdrop button to get free devnet tokens.
      </div>
    </div>
  );
};
