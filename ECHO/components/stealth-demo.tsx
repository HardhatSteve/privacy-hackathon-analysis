"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Ghost,
  Wallet,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  Lock
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

// ShadowWire token types
type ShadowWireToken = "SOL" | "USDC" | "BONK" | "RADR" | "ORE" | "WIF" | "JUP" | "PYTH";

interface StealthDemoProps {
  walletAddress: string;
}

type DemoStep = "intro" | "connect" | "generate" | "simulate" | "result";

export function StealthDemo({ walletAddress }: StealthDemoProps) {
  const [step, setStep] = useState<DemoStep>("intro");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState<ShadowWireToken>("SOL");
  
  // Results
  const [balance, setBalance] = useState<{ available: number; poolAddress: string } | null>(null);
  const [simulationResult, setSimulationResult] = useState<{
    possible: boolean;
    reason?: string;
    estimatedFee: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate a demo stealth address (in production, this would use real cryptography)
  const generateStealthAddress = () => {
    const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let result = "";
    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const [stealthAddress] = useState(generateStealthAddress());

  const checkBalance = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/shadowwire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getBalance",
          address: walletAddress,
          token,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to check balance");
      }
      
      const bal = await response.json();
      setBalance(bal);
      setStep("generate");
    } catch (err: any) {
      setError(err.message || "Failed to check balance");
    } finally {
      setIsLoading(false);
    }
  };

  const runSimulation = async () => {
    if (!recipientAddress || !amount) {
      setError("Please enter recipient and amount");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/shadowwire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "simulate",
          sender: walletAddress,
          recipient: recipientAddress,
          amount: parseFloat(amount),
          token,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Simulation failed");
      }
      
      const result = await response.json();
      setSimulationResult(result);
      setStep("result");
    } catch (err: any) {
      setError(err.message || "Simulation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetDemo = () => {
    setStep("intro");
    setBalance(null);
    setSimulationResult(null);
    setRecipientAddress("");
    setAmount("");
    setError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/60 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/40">
          <Ghost className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-mono font-bold text-purple-400">
              ShadowWire Stealth
            </h3>
            <span className="px-1.5 py-0.5 text-[10px] font-mono bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30">
              DEMO MODE
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Preview private transfers with zero-knowledge proofs
          </p>
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step: Intro */}
      {step === "intro" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-mono text-purple-400 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              What is ShadowWire?
            </h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              ShadowWire enables <strong>private transfers</strong> on Solana using zero-knowledge proofs. 
              Your transactions become unlinkable, protecting your financial privacy.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="text-center p-2 bg-black/40 rounded-lg">
                <EyeOff className="h-4 w-4 text-purple-400 mx-auto mb-1" />
                <span className="text-xs text-gray-400">Unlinkable</span>
              </div>
              <div className="text-center p-2 bg-black/40 rounded-lg">
                <Lock className="h-4 w-4 text-purple-400 mx-auto mb-1" />
                <span className="text-xs text-gray-400">Zero-Knowledge</span>
              </div>
              <div className="text-center p-2 bg-black/40 rounded-lg">
                <Sparkles className="h-4 w-4 text-purple-400 mx-auto mb-1" />
                <span className="text-xs text-gray-400">On-Chain</span>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setStep("connect")}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Wallet className="h-4 w-4 mr-2" />
            Start Demo
          </Button>
        </motion.div>
      )}

      {/* Step: Connect */}
      {step === "connect" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="bg-black/40 rounded-lg p-4 border border-purple-500/20">
            <div className="text-xs text-gray-400 font-mono mb-2">Your Wallet</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm font-mono text-purple-400 truncate">
                {walletAddress}
              </code>
              <button
                onClick={() => copyAddress(walletAddress)}
                className="p-2 rounded hover:bg-white/10"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-gray-400">Select Token</label>
            <div className="grid grid-cols-3 gap-2">
              {(["SOL", "USDC", "BONK"] as ShadowWireToken[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setToken(t)}
                  className={`p-2 rounded-lg border text-sm font-mono transition-colors ${
                    token === t
                      ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                      : "bg-black/40 border-gray-700 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={checkBalance}
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Check ShadowWire Balance
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Step: Generate Stealth Address */}
      {step === "generate" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Balance Display */}
          <div className="bg-black/40 rounded-lg p-4 border border-purple-500/20">
            <div className="text-xs text-gray-400 font-mono mb-2">ShadowWire Balance</div>
            <div className="text-2xl font-bold text-purple-400 font-mono">
              {balance?.available.toFixed(4) || "0.0000"} {token}
            </div>
            {balance?.poolAddress && (
              <div className="mt-2 text-xs text-gray-500 font-mono truncate">
                Pool: {balance.poolAddress.slice(0, 20)}...
              </div>
            )}
          </div>

          {/* Stealth Address */}
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Ghost className="h-4 w-4 text-purple-400" />
              <span className="text-xs font-mono text-purple-400">Generated Stealth Address</span>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-white bg-black/40 p-2 rounded truncate">
                {stealthAddress}
              </code>
              <button
                onClick={() => copyAddress(stealthAddress)}
                className="p-2 rounded hover:bg-white/10"
              >
                <Copy className="h-4 w-4 text-gray-400" />
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              This one-time address is unlinkable to your main wallet
            </p>
          </div>

          {/* Transfer Form */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono text-gray-400 mb-1 block">Recipient Address</label>
              <Input
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="Enter Solana address..."
                className="bg-black/40 border-purple-500/30 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-gray-400 mb-1 block">Amount ({token})</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                step="0.001"
                className="bg-black/40 border-purple-500/30 text-white font-mono"
              />
            </div>
          </div>

          <Button
            onClick={runSimulation}
            disabled={isLoading || !recipientAddress || !amount}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Simulating...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Simulate Private Transfer
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Step: Result */}
      {step === "result" && simulationResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className={`rounded-lg p-4 border ${
            simulationResult.possible
              ? "bg-green-500/10 border-green-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}>
            <div className="flex items-center gap-3 mb-3">
              {simulationResult.possible ? (
                <>
                  <div className="p-2 rounded-full bg-green-500/20">
                    <Check className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-green-400">Transfer Possible</h4>
                    <p className="text-xs text-gray-400">Simulation successful</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-2 rounded-full bg-red-500/20">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-red-400">Transfer Not Possible</h4>
                    <p className="text-xs text-gray-400">{simulationResult.reason}</p>
                  </div>
                </>
              )}
            </div>

            {simulationResult.possible && (
              <div className="space-y-2 pt-3 border-t border-white/10">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-white font-mono">{amount} {token}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Relayer Fee (1%)</span>
                  <span className="text-yellow-400 font-mono">
                    {(simulationResult.estimatedFee / 1e9).toFixed(6)} {token}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                  <span className="text-gray-400">Privacy Gain</span>
                  <span className="text-green-400 font-mono">+25 pts</span>
                </div>
              </div>
            )}
          </div>

          {/* Privacy Comparison */}
          <div className="bg-black/40 rounded-lg p-4 border border-purple-500/20">
            <h4 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">
              Privacy Comparison
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <Eye className="h-6 w-6 text-red-400 mx-auto mb-2" />
                <div className="text-xs text-gray-400 mb-1">Normal Transfer</div>
                <div className="text-xs text-red-400">Fully traceable</div>
              </div>
              <div className="text-center">
                <EyeOff className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <div className="text-xs text-gray-400 mb-1">ShadowWire</div>
                <div className="text-xs text-green-400">Unlinkable</div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={resetDemo}
              variant="outline"
              className="flex-1 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              Try Again
            </Button>
            <Button
              disabled
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white opacity-50"
            >
              <Lock className="h-4 w-4 mr-2" />
              Execute (Devnet Only)
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
