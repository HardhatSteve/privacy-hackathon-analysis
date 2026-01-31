"use client";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import React, { useState, useEffect, useMemo, memo } from "react";

// Seeded pseudo-random number generator for consistent values
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

export const Meteors = memo(function Meteors({
  number,
  className,
}: {
  number?: number;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const meteorCount = number || 20;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-compute meteor data with deterministic values
  const meteorsData = useMemo(() => {
    return Array.from({ length: meteorCount }, (_, idx) => ({
      position: idx * (800 / meteorCount) - 400,
      delay: seededRandom(idx + 1) * 5,
      duration: Math.floor(seededRandom(idx + 100) * 5 + 5),
    }));
  }, [meteorCount]);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {meteorsData.map((meteor, idx) => (
        <span
          key={`meteor-${idx}`}
          className={cn(
            "animate-meteor-effect absolute h-0.5 w-0.5 rotate-[45deg] rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10]",
            "before:absolute before:top-1/2 before:h-[1px] before:w-[50px] before:-translate-y-[50%] before:transform before:bg-gradient-to-r before:from-[#64748b] before:to-transparent before:content-['']",
            className,
          )}
          style={{
            top: "-40px",
            left: `${meteor.position}px`,
            animationDelay: `${meteor.delay}s`,
            animationDuration: `${meteor.duration}s`,
          }}
        />
      ))}
    </motion.div>
  );
});
