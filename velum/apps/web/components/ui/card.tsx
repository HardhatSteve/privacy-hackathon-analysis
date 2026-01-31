import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined";
}

function Card({ className, variant = "default", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "transition-all duration-300",
        {
          "bg-[#262626]/30 border border-border backdrop-blur-sm":
            variant === "default",
          "bg-[#262626]/30 border border-border backdrop-blur-sm shadow-2xl shadow-black/50":
            variant === "elevated",
          "border border-border bg-transparent": variant === "outlined",
        },
        className
      )}
      {...props}
    />
  );
}

function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pb-0", className)} {...props} />;
}

function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />;
}

function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardContent, CardFooter };
