"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import QRCodeLib from "qrcode";
import { cn } from "@/lib/utils/cn";

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
  showLogo?: boolean;
  onDownload?: () => void;
}

const QR_COLOR = "#e5e5e5"; // Light gray/white tone
const LOGO_SIZE_RATIO = 0.22; // ~22% of QR code area

export function QRCode({
  value,
  size = 200,
  className,
  showLogo = false,
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const logoRef = useRef<HTMLImageElement | null>(null);

  // Preload logo
  useEffect(() => {
    if (showLogo && !logoRef.current) {
      const img = new Image();
      img.onload = () => {
        logoRef.current = img;
        setLogoLoaded(true);
      };
      img.onerror = () => {
        console.warn("Failed to load Velum logo for QR code");
        setLogoLoaded(true); // Continue without logo
      };
      img.src = "/velum-logo-raw.svg";
    }
  }, [showLogo]);

  // Draw QR code with optional logo overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;

    const drawQR = async () => {
      try {
        await QRCodeLib.toCanvas(canvas, value, {
          width: size,
          margin: 2,
          errorCorrectionLevel: showLogo ? "H" : "M", // High error correction when logo is used
          color: {
            dark: QR_COLOR,
            light: "#00000000", // Transparent background
          },
        });

        // Draw logo overlay if enabled and loaded
        if (showLogo && logoRef.current) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const logoSize = Math.floor(size * LOGO_SIZE_RATIO);
            const logoX = (size - logoSize) / 2;
            const logoY = (size - logoSize) / 2;

            // Clear area for logo (transparent)
            ctx.clearRect(logoX - 6, logoY - 6, logoSize + 12, logoSize + 12);

            // Draw gold glow behind logo
            ctx.save();
            ctx.shadowColor = "rgba(254, 199, 53, 0.4)";
            ctx.shadowBlur = 12;
            ctx.drawImage(logoRef.current, logoX, logoY, logoSize, logoSize);
            ctx.restore();

            // Draw logo again without shadow for crisp rendering
            ctx.drawImage(logoRef.current, logoX, logoY, logoSize, logoSize);
          }
        }
      } catch (error) {
        console.error("Failed to generate QR code:", error);
      }
    };

    drawQR();
  }, [value, size, showLogo, logoLoaded]);

  return (
    <div
      className={cn(
        "inline-block p-5 bg-[#262626]/20 border border-primary/20 backdrop-blur-sm",
        "shadow-[0_0_30px_-5px_rgba(254,199,53,0.15),inset_0_0_40px_-10px_rgba(254,199,53,0.05)]",
        className
      )}
    >
      <canvas
        ref={canvasRef}
        style={{ minWidth: 200, minHeight: 200 }}
      />
    </div>
  );
}

// Hook for QR code download functionality
export function useQRCodeDownload() {
  const downloadQR = useCallback(
    async (value: string, filename: string = "velum-paylink-qr.png") => {
      // Generate high-resolution QR code for download (400px)
      const downloadSize = 400;
      const canvas = document.createElement("canvas");
      canvas.width = downloadSize;
      canvas.height = downloadSize;

      try {
        await QRCodeLib.toCanvas(canvas, value, {
          width: downloadSize,
          margin: 2,
          errorCorrectionLevel: "H",
          color: {
            dark: QR_COLOR,
            light: "#1a1a1a", // Dark background for download
          },
        });

        // Load and draw logo (no background)
        const logo = new Image();
        logo.crossOrigin = "anonymous";

        await new Promise<void>((resolve, reject) => {
          logo.onload = () => {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              const logoSize = Math.floor(downloadSize * LOGO_SIZE_RATIO);
              const logoX = (downloadSize - logoSize) / 2;
              const logoY = (downloadSize - logoSize) / 2;

              // Clear area for logo with dark background
              ctx.fillStyle = "#1a1a1a";
              ctx.beginPath();
              ctx.roundRect(logoX - 8, logoY - 8, logoSize + 16, logoSize + 16, 12);
              ctx.fill();

              // Draw gold glow behind logo
              ctx.save();
              ctx.shadowColor = "rgba(254, 199, 53, 0.35)";
              ctx.shadowBlur = 16;
              ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
              ctx.restore();

              // Draw logo again for crisp rendering
              ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
            }
            resolve();
          };
          logo.onerror = () => reject(new Error("Failed to load logo"));
          logo.src = "/velum-logo-raw.svg";
        });

        // Trigger download
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = filename;
        link.href = dataUrl;
        link.click();

        return true;
      } catch (error) {
        console.error("Failed to download QR code:", error);
        return false;
      }
    },
    []
  );

  return { downloadQR };
}

// Hook for Web Share API
export function useShare() {
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const share = useCallback(
    async (data: { title: string; text: string; url: string }) => {
      if (!canShare) return false;

      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        // User cancelled or share failed
        if ((error as Error).name !== "AbortError") {
          console.error("Share failed:", error);
        }
        return false;
      }
    },
    [canShare]
  );

  return { canShare, share };
}
