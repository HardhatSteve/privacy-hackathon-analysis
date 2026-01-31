import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Image
      src="/velum-logo-raw-with-text.svg"
      alt="Velum"
      width={120}
      height={32}
      className={cn("h-7 md:h-8 w-auto", className)}
      priority
    />
  );
}
