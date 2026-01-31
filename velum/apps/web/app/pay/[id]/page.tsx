"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useVelum } from "../../../lib/hooks/use-velum";
import { useDeposit, DepositToken } from "../../../lib/hooks/use-deposit";
import { Header } from "../../../components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProofProgressBar } from "@/components/ui/proof-progress-bar";
import { TokenIcon } from "@/components/ui/token-icons";
import { cn } from "@/lib/utils/cn";
import { createPrefetchHint } from "@/lib/circuit-loader";
import { CircuitSyncOverlay } from "@/components/features/circuit-sync-overlay";

type Token = "ANY" | "SOL" | "USDC" | "USDT";

interface PaylinkData {
  id: string;
  recipientUtxoPubkey: string;
  recipientEncryptionKey: string;
  token: Token;
  amountLamports: string | null;
  memo: string | null;
  expired: boolean;
}

const TOKEN_INFO: Record<
  Token,
  { label: string; icon: string; decimals: number }
> = {
  ANY: { label: "Any Token", icon: "◈", decimals: 6 },
  SOL: { label: "SOL", icon: "◎", decimals: 9 },
  USDC: { label: "USDC", icon: "$", decimals: 6 },
  USDT: { label: "USDT", icon: "₮", decimals: 6 },
};

export default function PayPage() {
  const params = useParams();
  const id = params.id as string;

  const [paylink, setPaylink] = useState<PaylinkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<Token>("SOL");
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { isInitialized, isLoading: sdkLoading, error: sdkError, initialize } = useVelum();
  const {
    deposit,
    isLoading: isPaying,
    isLoadingCircuits,
    circuitProgress,
    proofProgressState,
    resetProofProgress,
    error: depositError,
  } = useDeposit();

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

  useEffect(() => {
    async function fetchPaylink() {
      try {
        const response = await fetch(`/api/paylinks/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Payment link not found");
          }
          throw new Error("Failed to load payment link");
        }
        const data = await response.json();
        setPaylink(data);

        // Set amount if fixed
        if (data.amountLamports) {
          const decimals = TOKEN_INFO[data.token as Token]?.decimals ?? 9;
          setAmount(
            (parseInt(data.amountLamports, 10) / Math.pow(10, decimals)).toString()
          );
        }

        // Set token if specified
        if (data.token !== "ANY") {
          setSelectedToken(data.token);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPaylink();
  }, [id]);

  // Validate amount input
  const validateAmount = (amountStr: string): { valid: boolean; error?: string; value?: number } => {
    if (!amountStr || amountStr.trim() === "") {
      return { valid: false, error: "Amount is required" };
    }

    const parsed = parseFloat(amountStr);

    if (isNaN(parsed)) {
      return { valid: false, error: "Invalid amount format" };
    }

    if (parsed <= 0) {
      return { valid: false, error: "Amount must be greater than zero" };
    }

    // Max reasonable amounts per token (prevents overflow and accidental huge payments)
    const tokenToUse = paylink?.token === "ANY" ? selectedToken : paylink?.token;
    const maxAmounts: Record<string, number> = {
      SOL: 100000,   // 100k SOL
      USDC: 10000000, // 10M USDC
      USDT: 10000000, // 10M USDT
    };
    const maxAmount = maxAmounts[tokenToUse ?? "SOL"] ?? 100000;

    if (parsed > maxAmount) {
      return { valid: false, error: `Amount exceeds maximum (${maxAmount.toLocaleString()})` };
    }

    return { valid: true, value: parsed };
  };

  const amountValidation = validateAmount(amount);

  const handlePay = async () => {
    if (!paylink || !isInitialized || isSubmitting) return;

    const tokenToUse = paylink.token === "ANY" ? selectedToken : paylink.token;
    if (tokenToUse === "ANY") return;

    // Validate amount before proceeding
    const validation = validateAmount(amount);
    if (!validation.valid) {
      setError(validation.error ?? "Invalid amount");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const decimals = TOKEN_INFO[tokenToUse].decimals;
      const amountBigInt = BigInt(
        Math.floor(validation.value! * Math.pow(10, decimals))
      );

      const result = await deposit({
        amount: amountBigInt,
        token: tokenToUse as DepositToken,
        recipientUtxoPubkey: paylink.recipientUtxoPubkey,
        recipientEncryptionKey: paylink.recipientEncryptionKey,
      });

      if (result?.success) {
        setPaymentSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse font-mono text-foreground/50">
          Loading payment link...
        </div>
      </div>
    );
  }

  // Error State
  if (error && !paylink) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-error/10 border border-error/20 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-error"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="text-xl font-sentient font-extralight tracking-tight mb-2">Link Not Found</h1>
        <p className="text-foreground/60 font-mono text-sm mb-6">{error}</p>
        <Link href="/" className="text-primary font-mono hover:underline">
          Go to homepage
        </Link>
      </div>
    );
  }

  // Expired State
  if (paylink?.expired) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-warning/10 border border-warning/20 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-warning"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-sentient font-extralight tracking-tight mb-2">Link Expired</h1>
        <p className="text-foreground/60 font-mono text-sm mb-6">
          This payment link is no longer valid
        </p>
        <Link href="/" className="text-primary font-mono hover:underline">
          Go to homepage
        </Link>
      </div>
    );
  }

  // Success State
  if (paymentSuccess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 bg-success/10 border border-success/20 flex items-center justify-center mb-4 shadow-glow shadow-success/30">
          <svg
            className="w-8 h-8 text-success"
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
        <h1 className="text-xl font-sentient font-extralight tracking-tight mb-2">Payment Sent!</h1>
        <p className="text-foreground/60 font-mono text-sm text-center mb-6">
          Your payment has been sent privately.
          <br />
          The recipient will see it in their shielded balance.
        </p>
        <Link href="/" className="text-primary font-mono hover:underline">
          Go to homepage
        </Link>
      </div>
    );
  }

  const isFixedAmount = paylink?.amountLamports !== null;

  return (
    <div className="flex-1 flex flex-col">
      <Header />
      <CircuitSyncOverlay isVisible={isLoadingCircuits} progress={circuitProgress} />

      <main id="main-content" className="flex-1 flex items-center justify-center p-6 pt-32">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-sentient font-extralight tracking-tight mb-3 tracking-tight">
              Send Private Payment
            </h1>
            <p className="text-foreground/60 font-mono text-sm text-balance">
              {paylink?.memo || "Complete this payment privately on Solana"}
            </p>
          </div>

          <Card className="p-6 sm:p-8 mb-6">
            {/* Amount Display / Input */}
            <div className="text-center mb-8">
              {isFixedAmount ? (
                <>
                  <p className="text-sm font-mono text-foreground/50 mb-2 uppercase tracking-wider">
                    Amount Requested
                  </p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-mono tracking-tight text-foreground">
                      {amount}
                    </span>
                    <span className="text-2xl font-mono text-primary">
                      {paylink?.token}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-mono text-foreground/50 mb-4 uppercase tracking-wider">
                    Enter Amount
                  </p>
                  <div className="relative inline-block w-full max-w-[200px]">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-5xl font-mono tracking-tight text-center bg-transparent border-b-2 border-border focus:border-primary outline-none transition-colors pb-2 placeholder:text-foreground/10"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Token Selector (only if ANY) */}
            {paylink?.token === "ANY" && (
              <div className="mb-8">
                <p
                  id="token-selector-label"
                  className="text-sm font-mono text-foreground/50 mb-3 text-center uppercase tracking-wider"
                >
                  Pay with
                </p>
                <div
                  className="grid grid-cols-3 gap-3"
                  role="radiogroup"
                  aria-labelledby="token-selector-label"
                >
                  {(["SOL", "USDC", "USDT"] as Token[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={selectedToken === t}
                      aria-label={`Pay with ${t}`}
                      onClick={() => setSelectedToken(t)}
                      className={cn(
                        "group relative p-3 border transition-all duration-200 flex flex-col items-center",
                        selectedToken === t
                          ? "border-primary/50 bg-primary/10 text-primary shadow-glow shadow-primary/20"
                          : "border-border bg-[#262626]/30 hover:bg-[#262626]/50 text-foreground/60 hover:text-foreground"
                      )}
                    >
                      <TokenIcon token={t} size={22} className="mb-1" aria-hidden="true" />
                      <span className="text-xs font-mono">{t}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Privacy Notice */}
            <div className="flex items-start gap-4 p-4 bg-primary/5 border border-primary/10">
              <div className="p-2 bg-primary/10 text-primary">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-primary text-sm font-mono mb-0.5">
                  Private Payment
                </p>
                <p className="text-xs font-mono text-foreground/60 leading-relaxed text-balance">
                  This payment is shielded using zero-knowledge proofs. The
                  recipient&apos;s address won&apos;t appear on-chain.
                </p>
              </div>
            </div>
          </Card>

          {error && (
            <div className="p-4 bg-error/10 border border-error/20 text-error text-sm font-mono mb-6 text-center">
              {error}
            </div>
          )}

          {/* Proof Generation Progress */}
          {(proofProgressState.isGenerating || proofProgressState.error) && (
            <ProofProgressBar
              state={proofProgressState}
              onRetry={() => {
                resetProofProgress();
                handlePay();
              }}
              className="mb-6"
            />
          )}

          <Button
            onClick={isInitialized ? handlePay : () => setVisible(true)}
            disabled={isPaying || isSubmitting || (isInitialized && !amountValidation.valid)}
            className="w-full"
          >
            {proofProgressState.isGenerating
              ? `[${proofProgressState.phaseLabel}]`
              : isPaying || isSubmitting
                ? "[Processing...]"
                : isInitialized
                  ? `[Pay ${amount || "0"} ${
                      paylink?.token === "ANY"
                        ? selectedToken
                        : (paylink?.token ?? "")
                    }]`
                  : "[Connect Wallet to Pay]"}
          </Button>
        </div>
      </main>
    </div>
  );
}
