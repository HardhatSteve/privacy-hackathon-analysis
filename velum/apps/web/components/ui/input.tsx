import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  suffix?: string;
}

function Input({
  className,
  label,
  hint,
  error,
  suffix,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-mono text-foreground/60 uppercase tracking-wider mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          className={cn(
            "w-full px-4 py-3 border bg-[#262626]/50 text-foreground font-mono",
            "placeholder:text-foreground/30 focus:outline-none transition-all duration-200",
            error
              ? "border-error/50 focus:border-error focus:ring-1 focus:ring-error/20"
              : "border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/20",
            suffix && "pr-16",
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 text-sm font-mono">
            {suffix}
          </span>
        )}
      </div>
      {(hint || error) && (
        <p
          className={cn(
            "text-xs mt-1 font-mono",
            error ? "text-error" : "text-foreground/40"
          )}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}

export { Input };
