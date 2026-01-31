"use client";

import { memo } from "react";
import { cn } from "@/lib/utils/cn";
import { TokenIcon, type TokenType } from "@/components/ui/token-icons";
import { SUPPORTED_TOKENS } from "@/lib/config/tokens";

export type Token = TokenType;

interface TokenSelectorProps {
  value: Token;
  onChange: (token: Token) => void;
  showAny?: boolean;
  className?: string;
}

export const TokenSelector = memo(function TokenSelector({
  value,
  onChange,
  showAny = true,
  className,
}: TokenSelectorProps) {
  const tokens: Token[] = showAny
    ? ["ANY", ...SUPPORTED_TOKENS.map(t => t.symbol as Token)]
    : SUPPORTED_TOKENS.map(t => t.symbol as Token);

  return (
    <div
      className={cn("flex gap-2", className)}
      role="radiogroup"
      aria-label="Select token"
    >
      {tokens.map((token) => {
        const isSelected = value === token;

        return (
          <button
            key={token}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`Select ${token === "ANY" ? "any token" : token}`}
            onClick={() => onChange(token)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-3 px-2 border transition-all duration-200 font-mono",
              isSelected
                ? "border-primary/50 bg-primary/10 text-primary shadow-glow shadow-primary/20"
                : "border-border bg-[#262626]/30 text-foreground/60 hover:bg-[#262626]/50 hover:text-foreground"
            )}
          >
            <TokenIcon token={token} size={20} aria-hidden="true" />
            <span className="text-xs uppercase">{token}</span>
          </button>
        );
      })}
    </div>
  );
});
