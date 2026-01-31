"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isValidSolanaAddress } from "@/lib/solana";
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

interface WalletInputProps {
  onAnalyze: (address: string) => void;
}

export function WalletInput({ onAnalyze }: WalletInputProps) {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handleValidation = (value: string) => {
    setAddress(value);
    setError("");
    setIsValid(false);

    if (!value.trim()) {
      return;
    }

    // Simulate validation delay for better UX
    setIsValidating(true);
    setTimeout(() => {
      const valid = isValidSolanaAddress(value);
      setIsValid(valid);
      if (!valid && value.length > 10) {
        setError("Invalid Solana address format");
      }
      setIsValidating(false);
    }, 300);
  };

  const handleAnalyze = () => {
    if (isValid && address) {
      onAnalyze(address);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid) {
      handleAnalyze();
    }
  };

  return (
    <div className="w-full max-w-xl space-y-4">
      <div className="relative">
        <Input
          type="text"
          placeholder="wallet@devnet.solana"
          value={address}
          onChange={(e) => handleValidation(e.target.value)}
          onKeyPress={handleKeyPress}
          error={!!error}
          className="pr-12 text-base"
        />
        
        {/* Status Icon */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <AnimatePresence mode="wait">
            {isValidating && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              </motion.div>
            )}
            {!isValidating && isValid && (
              <motion.div
                key="valid"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
              </motion.div>
            )}
            {!isValidating && error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <AlertCircle className="h-5 w-5 text-red-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-red-500 font-mono"
          >
            → {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Analyze Button */}
      <Button
        variant="terminal"
        size="lg"
        onClick={handleAnalyze}
        disabled={!isValid || isValidating}
        className="w-full group cursor-pointer"
      >
        <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
        Analyze Privacy
      </Button>

      {/* Helper Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs font-mono space-y-1 text-white/50"
      >
        <p>→ Devnet addresses only</p>
        <p>→ Example: 8xR7d...g3Ks</p>
        <p className="text-blue-500/50">→ Privacy analysis powered by ECHO</p>
      </motion.div>
    </div>
  );
}
