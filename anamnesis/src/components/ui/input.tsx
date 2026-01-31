import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean
  success?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border-2 bg-white px-3 py-2 text-base transition-all duration-200 md:text-sm",
          "placeholder:text-slate-400",
          "file:text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none",
          "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-50",
          error && "border-red-500 focus:border-red-500 focus:ring-red-100",
          success &&
            "border-green-500 focus:border-green-500 focus:ring-green-100",
          !error && !success && "border-slate-200",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

export { Input }
