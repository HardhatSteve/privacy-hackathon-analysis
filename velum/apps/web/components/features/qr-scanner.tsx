"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Camera, X, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQRScanner, type ScannerStatus } from "@/lib/hooks/use-qr-scanner";

interface QRScannerProps {
  className?: string;
  buttonVariant?: "default" | "secondary" | "ghost";
  buttonSize?: "default" | "sm" | "lg";
  buttonLabel?: string;
}

export function QRScanner({
  className,
  buttonVariant = "secondary",
  buttonSize = "default",
  buttonLabel = "[Scan QR]",
}: QRScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const scannerId = useId();
  const scannerElementId = `qr-scanner-${scannerId.replace(/:/g, "-")}`;
  const router = useRouter();

  const {
    status,
    error,
    scannedResult,
    startScanning,
    stopScanning,
    reset,
    validatePaylinkUrl,
  } = useQRScanner({
    onSuccess: (result) => {
      // Small delay to show success state before redirect
      setTimeout(() => {
        setIsOpen(false);
        router.push(`/pay/${result.paylinkId}`);
      }, 800);
    },
  });

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      stopScanning();
      reset();
      setManualUrl("");
      setManualError(null);
    }
  }, [stopScanning, reset]);

  // Start scanning when dialog opens
  useEffect(() => {
    if (isOpen && status === "idle") {
      // Small delay to ensure the DOM element exists
      const timer = setTimeout(() => {
        startScanning(scannerElementId);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, status, startScanning, scannerElementId]);

  const handleManualSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    const trimmedUrl = manualUrl.trim();
    if (!trimmedUrl) {
      setManualError("Please enter a URL");
      return;
    }

    const result = validatePaylinkUrl(trimmedUrl);
    if (result) {
      setIsOpen(false);
      router.push(`/pay/${result.paylinkId}`);
    } else {
      setManualError("Invalid Paylink URL. Please enter a valid payment link.");
    }
  }, [manualUrl, validatePaylinkUrl, router]);

  const handleRetry = useCallback(() => {
    reset();
    startScanning(scannerElementId);
  }, [reset, startScanning, scannerElementId]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <Button variant={buttonVariant} size={buttonSize} className={className}>
          <Camera className="w-4 h-4 mr-2" />
          {buttonLabel}
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" />

        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md">
          <div className="bg-[#1a1a1a] border border-border p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-lg font-sentient font-extralight tracking-tight text-foreground">
                Scan Paylink QR Code
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="p-2 text-foreground/60 hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            {/* Scanner Area */}
            <div className="relative mb-6">
              <ScannerView
                elementId={scannerElementId}
                status={status}
                error={error}
                onRetry={handleRetry}
              />
            </div>

            {/* Success Message */}
            {status === "success" && scannedResult && (
              <div className="flex items-center gap-3 p-4 bg-primary/10 border border-primary/20 mb-6">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-mono text-foreground">
                    Paylink detected! Redirecting...
                  </p>
                </div>
              </div>
            )}

            {/* Permission Denied / Error - Manual Input Fallback */}
            {(status === "permission_denied" || status === "error") && (
              <div className="border-t border-border pt-6">
                <p className="text-sm font-mono text-foreground/60 mb-4">
                  Or enter the Paylink URL manually:
                </p>
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <Input
                    value={manualUrl}
                    onChange={(e) => {
                      setManualUrl(e.target.value);
                      setManualError(null);
                    }}
                    placeholder="https://..."
                    error={manualError || undefined}
                    autoComplete="url"
                  />
                  <Button type="submit" variant="default" size="sm" className="w-full">
                    [Open Paylink]
                  </Button>
                </form>
              </div>
            )}

            {/* Instructions */}
            {status === "scanning" && (
              <p className="text-xs font-mono text-foreground/40 text-center">
                Position the QR code within the frame to scan
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface ScannerViewProps {
  elementId: string;
  status: ScannerStatus;
  error: string | null;
  onRetry: () => void;
}

function ScannerView({ elementId, status, error, onRetry }: ScannerViewProps) {
  return (
    <div className="relative aspect-square bg-black/50 border border-border overflow-hidden">
      {/* Scanner element - html5-qrcode renders here */}
      <div
        id={elementId}
        className={cn(
          "w-full h-full",
          status !== "scanning" && "hidden"
        )}
      />

      {/* Guidance Overlay */}
      {status === "scanning" && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner brackets */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px]">
            {/* Top-left corner */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-primary" />
            {/* Top-right corner */}
            <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-primary" />
            {/* Bottom-left corner */}
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-primary" />
            {/* Bottom-right corner */}
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-primary" />
          </div>

          {/* Scanning line animation */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] overflow-hidden">
            <div className="absolute inset-x-0 h-0.5 bg-primary/60 animate-scan-line" />
          </div>
        </div>
      )}

      {/* Loading State */}
      {status === "requesting_permission" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a1a]">
          <Camera className="w-12 h-12 text-primary mb-4 animate-pulse" />
          <p className="text-sm font-mono text-foreground/60 text-center px-4">
            Requesting camera access...
          </p>
          <p className="text-xs font-mono text-foreground/40 text-center px-4 mt-2">
            Please allow camera permission when prompted
          </p>
        </div>
      )}

      {/* Permission Denied State */}
      {status === "permission_denied" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a1a] p-6">
          <AlertCircle className="w-12 h-12 text-error mb-4" />
          <p className="text-sm font-mono text-foreground text-center mb-2">
            Camera Access Denied
          </p>
          <p className="text-xs font-mono text-foreground/60 text-center mb-4">
            {error || "Please enable camera access in your browser settings to scan QR codes."}
          </p>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            [Try Again]
          </Button>
        </div>
      )}

      {/* Error State */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a1a] p-6">
          <AlertCircle className="w-12 h-12 text-error mb-4" />
          <p className="text-sm font-mono text-foreground text-center mb-2">
            Invalid QR Code
          </p>
          <p className="text-xs font-mono text-foreground/60 text-center mb-4">
            {error || "The scanned QR code is not a valid Paylink."}
          </p>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            [Scan Again]
          </Button>
        </div>
      )}

      {/* Success State */}
      {status === "success" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a1a]">
          <CheckCircle className="w-12 h-12 text-primary mb-4" />
          <p className="text-sm font-mono text-foreground">
            QR Code Detected!
          </p>
        </div>
      )}
    </div>
  );
}
