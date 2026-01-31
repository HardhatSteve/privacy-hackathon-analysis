"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useVelum } from "../../lib/hooks/use-velum";
import { usePaylink } from "../../lib/hooks/use-paylink";
import { usePaylinkHistory } from "@/lib/hooks/use-paylink-history";
import { Header } from "../../components/layout/header";
import {
  TokenSelector,
  Token,
} from "../../components/features/token-selector";
import { AmountInput } from "../../components/features/amount-input";
import { CopyButton } from "../../components/features/copy-button";
import { QRCode, useQRCodeDownload, useShare } from "../../components/features/qr-code";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { cn } from "../../lib/utils/cn";

export default function ReceivePage() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { isInitialized, isLoading: sdkLoading, error: sdkError, shieldedKeys, initialize } = useVelum();

  // Initialize SDK when wallet is connected (don't retry on failure)
  useEffect(() => {
    if (publicKey && !isInitialized && !sdkLoading && !sdkError) {
      initialize();
    }
  }, [publicKey, isInitialized, sdkLoading, sdkError, initialize]);
  const { createPaylink, isLoading, error: hookError } = usePaylink();
  const { addPaylink: savePaylinkLocally } = usePaylinkHistory();
  const { downloadQR } = useQRCodeDownload();
  const { canShare, share } = useShare();

  const [token, setToken] = useState<Token>("ANY");
  const [amount, setAmount] = useState("");

  // Clear amount when token changes to ANY (sender decides amount)
  useEffect(() => {
    if (token === "ANY") setAmount("");
  }, [token]);
  const [memo, setMemo] = useState("");
  const [expiryDays, setExpiryDays] = useState<number | null>(null);
  const [createdLink, setCreatedLink] = useState<{
    id: string;
    url: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateLink = async () => {
    if (!isInitialized || !shieldedKeys || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const expiresAt = expiryDays
        ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
        : undefined;

      const amountLamports = amount
        ? BigInt(Math.floor(parseFloat(amount) * (token === "SOL" ? 1e9 : 1e6)))
        : undefined;

      const result = await createPaylink({
        recipientUtxoPubkey: shieldedKeys.utxoPubkey,
        recipientEncryptionKey: shieldedKeys.encryptionPubkey,
        token,
        amountLamports,
        memo: memo || undefined,
        expiresAt,
      });

      if (result) {
        setCreatedLink(result);
        try {
          await savePaylinkLocally({
            id: result.id,
            token,
            amountLamports: amountLamports?.toString() ?? null,
            memo: memo || null,
            createdAt: Date.now(),
            expiresAt: expiresAt ? expiresAt.getTime() : null,
            url: result.url,
          });
        } catch (err) {
          console.warn("Failed to save paylink locally:", err);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadQR = () => {
    if (createdLink) {
      downloadQR(createdLink.url, `velum-paylink-${createdLink.id}.png`);
    }
  };

  const handleShare = async () => {
    if (createdLink) {
      await share({
        title: "Velum Payment Link",
        text: memo ? `Pay me via Velum: ${memo}` : "Pay me privately via Velum",
        url: createdLink.url,
      });
    }
  };

  // Success State
  if (createdLink) {
    return (
      <div className="flex-1 flex flex-col">
        <Header />

        <main id="main-content" className="flex-1 flex items-center justify-center p-6 pt-32">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 shadow-glow shadow-primary/30">
                <svg
                  className="w-8 h-8 text-primary"
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
                Paylink Created!
              </h1>
              <p className="text-foreground/60 font-mono text-sm">
                Share this link or QR code to receive payments privately
              </p>
            </div>

            {/* QR Code Display */}
            <div className="flex justify-center mb-8">
              <QRCode
                value={createdLink.url}
                size={240}
                showLogo={true}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <CopyButton text={createdLink.url} className="flex-1 min-w-[140px]">
                [Copy Link]
              </CopyButton>
              <Button
                onClick={handleDownloadQR}
                className="flex-1 min-w-[140px] gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                [Download QR]
              </Button>
              {canShare && (
                <Button
                  onClick={handleShare}
                  className="flex-1 min-w-[140px] gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  [Share]
                </Button>
              )}
            </div>

            <div className="mt-6 text-center">
              <Button variant="secondary" onClick={() => setCreatedLink(null)}>
                [Create Another Link]
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

      <main id="main-content" className="flex-1 flex items-center justify-center p-6 pt-32">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-sentient font-extralight tracking-tight mb-2 text-foreground">
              Create Link
            </h1>
            <p className="text-foreground/60 font-mono text-sm">
              Generate a private link to receive payments
            </p>
          </div>

          <Card className="p-6 sm:p-8">
            <div className="space-y-6">
              {/* Token Selection */}
              <div className="space-y-3">
                <label className="text-sm font-mono text-foreground/60 uppercase tracking-wider">
                  Accept Token
                </label>
                <TokenSelector
                  value={token}
                  onChange={setToken}
                  showAny={true}
                />
              </div>

              {/* Amount Input */}
              {token !== "ANY" ? (
                <>
                  <AmountInput
                    value={amount}
                    onChange={setAmount}
                    token={token}
                    label="Amount (Optional)"
                    placeholder="0.00"
                  />
                  <p className="text-xs font-mono text-foreground/50 -mt-4">
                    Leave empty to let sender decide
                  </p>
                </>
              ) : (
                <div className="p-3 bg-primary/5 border border-primary/10 text-sm font-mono text-foreground/60">
                  Sender chooses the token and amount
                </div>
              )}

              {/* Memo */}
              <div className="space-y-2">
                <label className="text-sm font-mono text-foreground/60 uppercase tracking-wider">
                  Memo{" "}
                  <span className="text-foreground/50 normal-case">
                    (optional)
                  </span>
                </label>
                <Input
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="What's this for?"
                  maxLength={140}
                />
              </div>

              {/* Expiry */}
              <div className="space-y-3">
                <label
                  id="expiry-label"
                  className="text-sm font-mono text-foreground/60 uppercase tracking-wider"
                >
                  Expires After
                </label>
                <div
                  className="grid grid-cols-4 gap-2"
                  role="radiogroup"
                  aria-labelledby="expiry-label"
                >
                  {[null, 7, 30, 90].map((days) => (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={expiryDays === days}
                      aria-label={days ? `Expires in ${days} days` : "Never expires"}
                      key={days ?? "never"}
                      onClick={() => setExpiryDays(days)}
                      className={cn(
                        "py-2 px-1 text-sm font-mono transition-all duration-200 border",
                        expiryDays === days
                          ? "border-primary/50 bg-primary/10 text-primary shadow-glow shadow-primary/20"
                          : "border-border bg-[#262626]/30 text-foreground/60 hover:bg-[#262626]/50 hover:text-foreground"
                      )}
                    >
                      {days ? `${days}d` : "Never"}
                    </button>
                  ))}
                </div>
              </div>

              {sdkError && (
                <div className="p-3 bg-error/10 border border-error/20 text-error text-sm font-mono">
                  SDK Error: {sdkError.message}
                </div>
              )}

              {hookError && (
                <div className="p-3 bg-error/10 border border-error/20 text-error text-sm font-mono">
                  {hookError.message}
                </div>
              )}

              {/* Create Button */}
              <Button
                onClick={isInitialized ? handleCreateLink : () => setVisible(true)}
                disabled={isLoading || isSubmitting}
                className="w-full"
              >
                {isLoading || isSubmitting
                  ? "[Creating...]"
                  : isInitialized
                    ? "[Create Payment Link]"
                    : "[Connect Wallet to Continue]"}
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
