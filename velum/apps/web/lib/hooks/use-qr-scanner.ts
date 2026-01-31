"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";

export type ScannerStatus =
  | "idle"
  | "requesting_permission"
  | "scanning"
  | "success"
  | "error"
  | "permission_denied";

export interface QRScannerResult {
  url: string;
  paylinkId: string;
}

export interface UseQRScannerOptions {
  onSuccess?: (result: QRScannerResult) => void;
  onError?: (error: string) => void;
}

export function useQRScanner(options: UseQRScannerOptions = {}) {
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<QRScannerResult | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementIdRef = useRef<string>("");

  const getAppUrl = useCallback(() => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_APP_URL || "";
  }, []);

  const validatePaylinkUrl = useCallback((url: string): QRScannerResult | null => {
    const appUrl = getAppUrl();

    // Create URL patterns to match
    // Format: {APP_URL}/pay/{id}
    const patterns = [
      new RegExp(`^${escapeRegExp(appUrl)}/pay/([a-zA-Z0-9_-]+)$`),
      // Also allow URLs without trailing slash variations
      new RegExp(`^${escapeRegExp(appUrl.replace(/\/$/, ""))}/pay/([a-zA-Z0-9_-]+)$`),
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return {
          url,
          paylinkId: match[1],
        };
      }
    }

    return null;
  }, [getAppUrl]);

  const startScanning = useCallback(async (elementId: string) => {
    if (scannerRef.current) {
      const state = scannerRef.current.getState();
      if (state === Html5QrcodeScannerState.SCANNING) {
        return;
      }
    }

    setStatus("requesting_permission");
    setError(null);
    setScannedResult(null);
    elementIdRef.current = elementId;

    try {
      const html5Qrcode = new Html5Qrcode(elementId);
      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          const result = validatePaylinkUrl(decodedText);

          if (result) {
            setScannedResult(result);
            setStatus("success");
            options.onSuccess?.(result);

            // Stop scanning after successful detection
            html5Qrcode.stop().catch(console.error);
          } else {
            setError("Invalid QR code. Please scan a valid Paylink QR code.");
            setStatus("error");
            options.onError?.("Invalid QR code format");
          }
        },
        () => {
          // QR code not detected - this is normal during scanning
        }
      );

      setStatus("scanning");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to access camera";

      if (errorMessage.includes("Permission") || errorMessage.includes("NotAllowedError")) {
        setStatus("permission_denied");
        setError("Camera access denied. Please allow camera access to scan QR codes.");
      } else {
        setStatus("error");
        setError(errorMessage);
      }

      options.onError?.(errorMessage);
    }
  }, [validatePaylinkUrl, options]);

  const stopScanning = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
      } catch {
        // Ignore stop errors
      }
      scannerRef.current = null;
    }
    setStatus("idle");
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setScannedResult(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return {
    status,
    error,
    scannedResult,
    startScanning,
    stopScanning,
    reset,
    validatePaylinkUrl,
  };
}

// Helper function to escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
