"use client";

import { cn } from "@/lib/utils/cn";

interface BalanceDisplayProps {
  balance: string | number;
  token: "SOL" | "USDC" | "USDT";
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
}

const TOKEN_INFO = {
  SOL: { icon: "◎", name: "Solana" },
  USDC: { icon: "$", name: "USD Coin" },
  USDT: { icon: "₮", name: "Tether" },
};

const SIZES = {
  sm: { icon: "text-xl", balance: "text-lg", name: "text-xs" },
  md: { icon: "text-3xl", balance: "text-2xl", name: "text-sm" },
  lg: { icon: "text-4xl", balance: "text-4xl", name: "text-base" },
};

export function BalanceDisplay({
  balance,
  token,
  isLoading = false,
  size = "md",
}: BalanceDisplayProps) {
  const info = TOKEN_INFO[token];
  const sizeClasses = SIZES[size];

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 animate-pulse">
        <div
          className={cn("bg-[#262626]/50 border border-border", {
            "w-8 h-8": size === "sm",
            "w-12 h-12": size === "md",
            "w-16 h-16": size === "lg",
          })}
        />
        <div className="space-y-2">
          <div
            className={cn("bg-[#262626]/50", {
              "h-4 w-16": size === "sm",
              "h-6 w-24": size === "md",
              "h-8 w-32": size === "lg",
            })}
          />
          <div
            className={cn("bg-[#262626]/50", {
              "h-3 w-12": size === "sm",
              "h-4 w-16": size === "md",
              "h-5 w-20": size === "lg",
            })}
          />
        </div>
      </div>
    );
  }

  const formattedBalance =
    typeof balance === "number"
      ? balance.toLocaleString(undefined, { maximumFractionDigits: 6 })
      : balance;

  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          "flex items-center justify-center bg-[#262626]/30 border border-border",
          {
            "w-8 h-8": size === "sm",
            "w-12 h-12": size === "md",
            "w-16 h-16": size === "lg",
          }
        )}
      >
        <span className={cn(sizeClasses.icon, "text-primary")}>{info.icon}</span>
      </div>
      <div>
        <div
          className={cn(
            "font-bold text-foreground font-sentient tracking-tight",
            sizeClasses.balance
          )}
        >
          {formattedBalance}{" "}
          <span className="text-primary font-mono">{token}</span>
        </div>
        <div className={cn("text-foreground/60 font-mono", sizeClasses.name)}>
          {info.name}
        </div>
      </div>
    </div>
  );
}
