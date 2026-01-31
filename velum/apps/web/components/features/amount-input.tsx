"use client";

import { useState, useEffect, useId } from "react";
import { cn } from "@/lib/utils/cn";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  token: "SOL" | "USDC" | "USDT" | "ANY";
  maxAmount?: number;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  showUsdPreview?: boolean;
  id?: string;
}

// Mock prices - in production, fetch from API
const TOKEN_PRICES: Record<string, number> = {
  SOL: 180,
  USDC: 1,
  USDT: 1,
  ANY: 1,
};

const TOKEN_DECIMALS: Record<string, number> = {
  SOL: 9,
  USDC: 6,
  USDT: 6,
  ANY: 6,
};

export function AmountInput({
  value,
  onChange,
  token,
  maxAmount,
  disabled = false,
  placeholder = "0.00",
  label,
  showUsdPreview = true,
  id: providedId,
}: AmountInputProps) {
  const generatedId = useId();
  const inputId = providedId || generatedId;
  const [focused, setFocused] = useState(false);
  const [usdValue, setUsdValue] = useState<string>("");

  useEffect(() => {
    const numValue = parseFloat(value) || 0;
    const price = TOKEN_PRICES[token] || 1;
    const usd = numValue * price;
    setUsdValue(usd > 0 ? `≈ $${usd.toFixed(2)} USD` : "");
  }, [value, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow empty, numbers, and one decimal point
    if (inputValue === "" || /^\d*\.?\d*$/.test(inputValue)) {
      // Limit decimal places based on token
      const parts = inputValue.split(".");
      if (parts[1] && parts[1].length > TOKEN_DECIMALS[token]) {
        return;
      }
      onChange(inputValue);
    }
  };

  const handleMax = () => {
    if (maxAmount !== undefined) {
      onChange(maxAmount.toString());
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-mono text-foreground/60 uppercase tracking-wider"
        >
          {label}
        </label>
      )}

      <div
        className={cn(
          "relative flex items-center border transition-all duration-200",
          "bg-[#262626]/30",
          focused
            ? "border-primary/50 shadow-glow shadow-primary/10"
            : "border-border hover:border-border/80",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          placeholder={placeholder}
          aria-label={label || `Amount in ${token}`}
          className={cn(
            "w-full px-4 py-4 bg-transparent text-2xl font-mono",
            "text-foreground placeholder:text-foreground/20",
            "focus:outline-none",
            "disabled:cursor-not-allowed"
          )}
        />

        <div className="flex items-center gap-2 pr-4">
          {maxAmount !== undefined && (
            <button
              type="button"
              onClick={handleMax}
              disabled={disabled}
              className={cn(
                "px-2 py-1 text-xs font-mono uppercase transition-colors",
                "bg-primary/10 text-primary hover:bg-primary/20",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Max
            </button>
          )}
          <span className="text-sm font-mono text-foreground/40 uppercase">
            {token}
          </span>
        </div>
      </div>

      {showUsdPreview && usdValue && (
        <p className="text-xs font-mono text-foreground/40 pl-1">{usdValue}</p>
      )}
    </div>
  );
}
