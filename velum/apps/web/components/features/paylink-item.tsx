"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { TokenIcon, type TokenType } from "@/components/ui/token-icons";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaylinkWithStatus } from "@/lib/hooks/use-paylink-history";
import type { PaylinkToken } from "@/lib/paylink-history";

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;

  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    if (hours === 0) {
      const minutes = Math.floor(diff / (60 * 1000));
      return minutes <= 1 ? "Just now" : `${minutes}m ago`;
    }
    return `${hours}h ago`;
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDecimals(token: PaylinkToken): number {
  switch (token) {
    case "SOL":
      return 9;
    case "USDC":
    case "USDT":
      return 6;
    case "ANY":
    default:
      return 6;
  }
}

function getDisplayDecimals(token: PaylinkToken): number {
  switch (token) {
    case "SOL":
      return 4;
    case "USDC":
    case "USDT":
      return 2;
    case "ANY":
    default:
      return 2;
  }
}

function formatAmount(amountLamports: string, token: PaylinkToken): string {
  const decimals = getDecimals(token);
  const displayDecimals = getDisplayDecimals(token);
  const amount = Number(amountLamports) / Math.pow(10, decimals);
  return amount.toFixed(displayDecimals);
}

function truncateMemo(memo: string | null): string {
  if (!memo) return "No memo";
  if (memo.length <= 30) return memo;
  return memo.slice(0, 30) + "...";
}

type PaylinkStatus = "active" | "paid" | "expired";

function getStatus(paylink: PaylinkWithStatus): PaylinkStatus | null {
  if (!paylink.status) return null;
  if (paylink.status.expired) return "expired";
  if (paylink.status.transactionCount > 0) return "paid";
  return "active";
}

interface PaylinkItemProps {
  paylink: PaylinkWithStatus;
}

export function PaylinkItem({ paylink }: PaylinkItemProps) {
  const [copied, setCopied] = useState(false);

  const status = getStatus(paylink);
  const tokenType: TokenType = paylink.token as TokenType;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(paylink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="p-4 bg-[#262626]/30 border border-border hover:bg-[#262626]/50 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 bg-primary/10 border border-primary/20">
            <TokenIcon token={tokenType} size={20} className="text-primary" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-medium text-foreground">
                {paylink.token}
              </span>
              <span className="text-foreground/20 font-mono text-sm">&middot;</span>
              <span className="font-mono text-sm text-foreground/80">
                {paylink.amountLamports
                  ? formatAmount(paylink.amountLamports, paylink.token)
                  : "Open amount"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs text-foreground/40 truncate max-w-[180px]">
                {truncateMemo(paylink.memo)}
              </span>
              <span className="text-foreground/20">&middot;</span>
              <span className="font-mono text-xs text-foreground/40 flex-shrink-0">
                {formatDate(paylink.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* View count */}
          {paylink.statusLoading ? (
            <Skeleton className="h-4 w-14" />
          ) : paylink.status ? (
            <span className="font-mono text-xs text-foreground/40">
              {paylink.status.viewCount} {paylink.status.viewCount === 1 ? "view" : "views"}
            </span>
          ) : null}

          {/* Status badge */}
          {paylink.statusLoading ? (
            <Skeleton className="h-5 w-14" />
          ) : status === "active" ? (
            <span className="px-2 py-0.5 text-xs font-mono uppercase border border-primary/50 text-primary bg-primary/10">
              Active
            </span>
          ) : status === "paid" ? (
            <span className="px-2 py-0.5 text-xs font-mono uppercase border border-success/50 text-success bg-success/10">
              Paid
            </span>
          ) : status === "expired" ? (
            <span className="px-2 py-0.5 text-xs font-mono uppercase border border-border text-foreground/40 bg-foreground/5">
              Expired
            </span>
          ) : null}

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className={cn(
              "font-mono text-xs px-2 py-1 border transition-colors",
              copied
                ? "border-success/50 text-success bg-success/10"
                : "border-border text-foreground/60 hover:text-foreground hover:bg-[#262626]/50"
            )}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
