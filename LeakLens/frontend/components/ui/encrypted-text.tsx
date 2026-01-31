"use client";
import React, { useEffect, useRef, useState, useCallback, memo } from "react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";

type EncryptedTextProps = {
  text: string;
  className?: string;
  revealDelayMs?: number;
  charset?: string;
  flipDelayMs?: number;
  encryptedClassName?: string;
  revealedClassName?: string;
};

const DEFAULT_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[];:,.<>/?";

function generateRandomCharacter(charset: string): string {
  const index = Math.floor(Math.random() * charset.length);
  return charset.charAt(index);
}

function generateGibberishPreservingSpaces(
  original: string,
  charset: string,
): string {
  if (!original) return "";
  let result = "";
  for (let i = 0; i < original.length; i += 1) {
    const ch = original[i];
    result += ch === " " ? " " : generateRandomCharacter(charset);
  }
  return result;
}

export const EncryptedText = memo(function EncryptedText({
  text,
  className,
  revealDelayMs = 35,
  charset = DEFAULT_CHARSET,
  flipDelayMs = 50,
  encryptedClassName,
  revealedClassName,
}: EncryptedTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [mounted, setMounted] = useState(false);
  const [revealCount, setRevealCount] = useState<number>(0);
  const [scrambleChars, setScrambleChars] = useState<string[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const lastFlipTimeRef = useRef<number>(0);

  // Only mount after hydration to prevent mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isInView) return;

    // Initialize scramble characters only after mount
    const initial = text
      ? generateGibberishPreservingSpaces(text, charset)
      : "";
    setScrambleChars(initial.split(""));
    startTimeRef.current = performance.now();
    lastFlipTimeRef.current = startTimeRef.current;
    setRevealCount(0);

    let isCancelled = false;
    let localScrambleChars = initial.split("");

    const update = (now: number) => {
      if (isCancelled) return;

      const elapsedMs = now - startTimeRef.current;
      const totalLength = text.length;
      const currentRevealCount = Math.min(
        totalLength,
        Math.floor(elapsedMs / Math.max(1, revealDelayMs)),
      );

      setRevealCount(currentRevealCount);

      if (currentRevealCount >= totalLength) {
        return;
      }

      const timeSinceLastFlip = now - lastFlipTimeRef.current;
      if (timeSinceLastFlip >= Math.max(0, flipDelayMs)) {
        for (let index = 0; index < totalLength; index += 1) {
          if (index >= currentRevealCount) {
            if (text[index] !== " ") {
              localScrambleChars[index] = generateRandomCharacter(charset);
            } else {
              localScrambleChars[index] = " ";
            }
          }
        }
        setScrambleChars([...localScrambleChars]);
        lastFlipTimeRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(update);
    };

    animationFrameRef.current = requestAnimationFrame(update);

    return () => {
      isCancelled = true;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mounted, isInView, text, revealDelayMs, charset, flipDelayMs]);

  if (!text) return null;

  // Show plain text on server / before mount to prevent hydration mismatch
  if (!mounted) {
    return (
      <span className={cn("inline-block", className)} aria-label={text} role="text">
        {text}
      </span>
    );
  }

  return (
    <motion.span
      ref={ref}
      className={cn("inline-block", className)}
      aria-label={text}
      role="text"
    >
      {text.split("").map((char, index) => {
        const isRevealed = index < revealCount;
        const displayChar = isRevealed
          ? char
          : char === " "
            ? " "
            : (scrambleChars[index] ?? char);

        return (
          <span
            key={index}
            className={cn(
              isRevealed ? revealedClassName : cn("font-mono", encryptedClassName)
            )}
          >
            {displayChar}
          </span>
        );
      })}
    </motion.span>
  );
});
