"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useVelum } from "../../lib/hooks/use-velum";
import { useWithdraw, WithdrawToken } from "../../lib/hooks/use-withdraw";
import { Header } from "../../components/layout/header";
import { AmountInput } from "../../components/features/amount-input";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ProofProgressBar } from "@/components/ui/proof-progress-bar";
import { cn } from "../../lib/utils/cn";
import { TokenIcon } from "@/components/ui/token-icons";
import { createPrefetchHint } from "../../lib/circuit-loader";
import { CircuitSyncOverlay } from "@/components/features/circuit-sync-overlay";

type Token = "SOL" | "USDC" | "USDT";

export default function WithdrawPage() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [selectedToken, setSelectedToken] = useState<Token>("SOL");
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const { isInitialized, isLoading: sdkLoading, error: sdkError, privateBalance, initialize } = useVelum();

  // Validate Solana address
  const addressValidation = useMemo(() => {
    if (!destination) {
      return { valid: false, error: null }; // Empty is not an error, just not valid
    }

    // Basic length check (Solana addresses are typically 32-44 characters)
    if (destination.length < 32 || destination.length > 44) {
      return { valid: false, error: "Invalid address length" };
    }

    try {
      const pubkey = new PublicKey(destination);
      // Additional check: ensure it's not a zero address
      if (pubkey.equals(PublicKey.default)) {
        return { valid: false, error: "Cannot use zero address" };
      }
      return { valid: true, error: null };
    } catch {
      return { valid: false, error: "Invalid Solana address format" };
    }
  }, [destination]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prefetch circuit files after 5s idle
  useEffect(() => {
    const cleanup = createPrefetchHint();
    return cleanup;
  }, []);

  // Initialize SDK when wallet is connected (don't retry on failure)
  useEffect(() => {
    if (publicKey && !isInitialized && !sdkLoading && !sdkError) {
      initialize();
    }
  }, [publicKey, isInitialized, sdkLoading, sdkError, initialize]);
  const {
    withdraw,
    isLoading: isWithdrawing,
    isLoadingCircuits,
    circuitProgress,
    proofProgressState,
    resetProofProgress,
    error: withdrawError,
  } = useWithdraw();

  const handleWithdraw = async () => {
    if (!isInitialized || !amount || !destination) return;

    try {
      const decimals = selectedToken === "SOL" ? 9 : 6;
      const amountBigInt = BigInt(
        Math.floor(parseFloat(amount) * Math.pow(10, decimals))
      );

      const result = await withdraw({
        amount: amountBigInt,
        token: selectedToken as WithdrawToken,
        destinationAddress: destination,
      });

      if (result?.success) {
        setWithdrawSuccess(true);
      }
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const getMaxAmount = (): number => {
    if (!privateBalance) return 0;
    const balance =
      privateBalance[
        selectedToken.toLowerCase() as keyof typeof privateBalance
      ];
    const decimals = selectedToken === "SOL" ? 9 : 6;
    return Number(balance) / Math.pow(10, decimals);
  };

  // Prevent SSR/prerendering - only render on client
  if (!isMounted) {
    return null;
  }

  // Success State
  if (withdrawSuccess) {
    return (
      <div className="flex-1 flex flex-col">
        <Header />

        <main id="main-content" className="flex-1 flex items-center justify-center p-6 pt-32">
          <div className="w-full max-w-md text-center">
            <div className="w-20 h-20 bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-6 shadow-glow shadow-success/30">
              <svg
                className="w-10 h-10 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-sentient font-extralight tracking-tight mb-2 text-foreground">
              Withdrawal Complete!
            </h1>
            <p className="text-foreground/60 font-mono text-sm mb-8 leading-relaxed">
              <span className="font-medium text-foreground">
                {amount} {selectedToken}
              </span>{" "}
              has been sent to
              <br />
              <span className="font-mono text-xs bg-[#262626]/50 px-2 py-1 inline-block mt-2">
                {destination.slice(0, 8)}...{destination.slice(-8)}
              </span>
            </p>

            <div className="flex gap-3 justify-center">
              <Link href="/dashboard">
                <Button>[Back to Dashboard]</Button>
              </Link>
              <Button
                variant="secondary"
                onClick={() => {
                  setWithdrawSuccess(false);
                  setAmount("");
                  setDestination("");
                }}
              >
                [Withdraw More]
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <CircuitSyncOverlay isVisible={isLoadingCircuits} progress={circuitProgress} />

      <main id="main-content" className="flex-1 flex items-center justify-center p-6 pt-32">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-sentient font-extralight tracking-tight mb-2 text-foreground">
              Withdraw Funds
            </h1>
            <p className="text-foreground/60 font-mono text-sm">
              Send your private balance to any Solana address
            </p>
          </div>

          <Card className="p-6 sm:p-8">
            <div className="space-y-6">
              {/* Private Balances / Token Selector */}
              <div className="space-y-3">
                <label
                  id="asset-selector-label"
                  className="text-sm font-mono text-foreground/60 uppercase tracking-wider"
                >
                  Select Asset
                </label>
                <div
                  className="grid grid-cols-3 gap-3"
                  role="radiogroup"
                  aria-labelledby="asset-selector-label"
                >
                  {(["SOL", "USDC", "USDT"] as Token[]).map((token) => (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selectedToken === token}
                      aria-label={`Select ${token}`}
                      key={token}
                      onClick={() => setSelectedToken(token)}
                      className={cn(
                        "relative p-3 border transition-all duration-200 text-center group",
                        selectedToken === token
                          ? "border-primary/50 bg-primary/10 shadow-glow shadow-primary/20"
                          : "border-border bg-[#262626]/30 hover:bg-[#262626]/50"
                      )}
                    >
                      <TokenIcon
                        token={token}
                        size={20}
                        aria-hidden="true"
                        className={cn(
                          "mx-auto mb-1 transition-colors",
                          selectedToken === token
                            ? "text-primary"
                            : "text-foreground/60 group-hover:text-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          "block text-sm font-sentient font-extralight tracking-tight mb-0.5",
                          selectedToken === token
                            ? "text-foreground"
                            : "text-foreground/60 group-hover:text-foreground"
                        )}
                      >
                        {privateBalance
                          ? (
                              Number(
                                privateBalance[
                                  token.toLowerCase() as keyof typeof privateBalance
                                ]
                              ) / Math.pow(10, token === "SOL" ? 9 : 6)
                            ).toFixed(2)
                          : "0.00"}
                      </span>
                      <span className="block text-[10px] uppercase tracking-wider font-mono text-foreground/50">
                        {token}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <AmountInput
                value={amount}
                onChange={setAmount}
                token={selectedToken}
                maxAmount={getMaxAmount()}
                label="Amount"
                placeholder="0.00"
              />

              {/* Destination Address */}
              <div className="space-y-2">
                <label className="text-sm font-mono text-foreground/60 uppercase tracking-wider">
                  Destination Address
                </label>
                <Input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Solana wallet address"
                  className={cn(
                    "font-mono text-sm",
                    destination && !addressValidation.valid && "border-error focus:border-error"
                  )}
                  aria-invalid={destination ? !addressValidation.valid : undefined}
                  aria-describedby={addressValidation.error ? "address-error" : undefined}
                />
                {addressValidation.error ? (
                  <p id="address-error" className="text-xs font-mono text-error">
                    {addressValidation.error}
                  </p>
                ) : (
                  <p className="text-xs font-mono text-foreground/50">
                    {addressValidation.valid ? (
                      <span className="text-success">Valid address</span>
                    ) : (
                      "Tip: Use a fresh wallet for maximum privacy"
                    )}
                  </p>
                )}
              </div>

              {/* Privacy Notice */}
              <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/10">
                <svg
                  className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-mono text-foreground/60 leading-relaxed">
                  For maximum privacy: wait before
                  withdrawing and consider withdrawing smaller chunks over time.
                </p>
              </div>

              {sdkError && (
                <div className="p-3 bg-error/10 border border-error/20 text-error text-sm font-mono">
                  SDK Error: {sdkError.message}
                </div>
              )}

              {withdrawError && (
                <div className="p-3 bg-error/10 border border-error/20 text-error text-sm font-mono">
                  {withdrawError.message}
                </div>
              )}

              {/* Proof Generation Progress */}
              {(proofProgressState.isGenerating || proofProgressState.error) && (
                <ProofProgressBar
                  state={proofProgressState}
                  onRetry={() => {
                    resetProofProgress();
                    handleWithdraw();
                  }}
                />
              )}

              {/* Withdraw Button */}
              <Button
                onClick={isInitialized ? handleWithdraw : () => setVisible(true)}
                disabled={
                  isWithdrawing || (isInitialized && (!amount || !addressValidation.valid))
                }
                className="w-full"
              >
                {proofProgressState.isGenerating
                  ? `[${proofProgressState.phaseLabel}]`
                  : isWithdrawing
                    ? "[Processing...]"
                    : isInitialized
                      ? `[Withdraw ${amount || "0"} ${selectedToken}]`
                      : "[Connect Wallet to Withdraw]"}
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
