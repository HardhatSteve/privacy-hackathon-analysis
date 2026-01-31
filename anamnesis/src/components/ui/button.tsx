import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-primary-glow hover:from-indigo-700 hover:to-purple-700 hover:shadow-primary-glow-lg hover:scale-[1.02] active:scale-[0.98]",
        destructive:
          "bg-gradient-to-br from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700 hover:scale-[1.02] active:scale-[0.98]",
        outline:
          "border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm active:scale-[0.98]",
        secondary:
          "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-900 hover:from-slate-200 hover:to-slate-300 hover:shadow-sm active:scale-[0.98]",
        ghost: "hover:bg-slate-100 hover:text-indigo-600 active:scale-[0.95]",
        link: "text-indigo-600 underline-offset-4 hover:underline hover:text-indigo-700",
        gradient:
          "bg-gradient-animated text-white shadow-primary-glow hover:shadow-primary-glow-lg hover:scale-[1.02] active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
