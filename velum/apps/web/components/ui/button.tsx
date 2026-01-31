import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { px } from "@/components/utils";

const buttonVariants = cva(
  "inline-flex relative uppercase border font-mono cursor-pointer items-center font-medium justify-center gap-2 whitespace-nowrap ease-out transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none [clip-path:polygon(var(--poly-roundness)_0,calc(100%_-_var(--poly-roundness))_0,100%_0,100%_calc(100%_-_var(--poly-roundness)),calc(100%_-_var(--poly-roundness))_100%,0_100%,0_calc(100%_-_var(--poly-roundness)),0_var(--poly-roundness))]",
  {
    variants: {
      variant: {
        default:
          "bg-background border-primary text-primary-foreground [&>[data-border]]:bg-primary [box-shadow:inset_0_0_54px_0px_var(--tw-shadow-color)] shadow-[#EBB800] hover:shadow-[#EBB800]/80",
        secondary:
          "bg-[#262626]/50 border-border text-foreground/60 hover:text-foreground hover:border-foreground/40 [&>[data-border]]:bg-border",
        ghost:
          "border-transparent bg-transparent text-foreground/60 hover:text-foreground [&>[data-border]]:bg-transparent",
      },
      size: {
        default: "h-16 px-6 text-base",
        sm: "h-12 px-4 text-sm",
        lg: "h-18 px-8 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

function Button({
  className,
  variant,
  size,
  children,
  isLoading,
  disabled,
  ...props
}: ButtonProps) {
  const polyRoundness = 16;
  const hypotenuse = polyRoundness * 2;
  const hypotenuseHalf = polyRoundness / 2 - 1.5;

  return (
    <button
      style={
        {
          "--poly-roundness": px(polyRoundness),
        } as React.CSSProperties
      }
      data-slot="button"
      disabled={disabled || isLoading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      <span
        data-border="top-left"
        style={
          { "--h": px(hypotenuse), "--hh": px(hypotenuseHalf) } as React.CSSProperties
        }
        className="absolute inline-block w-[var(--h)] top-[var(--hh)] left-[var(--hh)] h-[2px] -rotate-45 origin-top -translate-x-1/2"
      />
      <span
        data-border="bottom-right"
        style={
          { "--h": px(hypotenuse), "--hh": px(hypotenuseHalf) } as React.CSSProperties
        }
        className="absolute w-[var(--h)] bottom-[var(--hh)] right-[var(--hh)] h-[2px] -rotate-45 translate-x-1/2"
      />

      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
