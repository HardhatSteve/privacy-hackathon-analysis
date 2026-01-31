"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Check,
  Loader2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { sendFormSchema, type SendFormData } from "@/lib/validation/sendSchema";
import { useBalance } from "@/hooks/useBalance";
import { toast } from "@/hooks/useToast";
import { useTransactionStore } from "@/stores/transactionStore";
import { getPrivacyService } from "@/lib/privacy/privacyService";
import type { PrivacyLevel, Currency, FeeBreakdown } from "@/types";
import { cn, formatAmount, formatAddress, generateId } from "@/lib/utils";

const STEPS = ["Amount", "Recipient", "Privacy", "Review", "Complete"];

const privacyOptions = [
  {
    level: "none" as PrivacyLevel,
    name: "No Privacy",
    description: "Standard transfer, all details visible on-chain",
    icon: Shield,
    fee: "~$0.001",
    time: "~5s",
    color: "text-muted-foreground",
  },
  {
    level: "medium" as PrivacyLevel,
    name: "Amount Privacy",
    description: "Hide transaction amounts using zero-knowledge proofs",
    icon: ShieldCheck,
    fee: "~$0.01",
    time: "~15s",
    color: "text-warning",
    recommended: true,
  },
  {
    level: "high" as PrivacyLevel,
    name: "Full Anonymity",
    description: "Complete obfuscation through multi-hop routing",
    icon: ShieldAlert,
    fee: "~0.5%",
    time: "~2min",
    color: "text-success",
  },
];

export default function SendPage() {
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const wallet = useWallet();
  const { connection } = useConnection();
  const { balance } = useBalance();
  const { addTransaction } = useTransactionStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feeEstimate, setFeeEstimate] = useState<FeeBreakdown | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const form = useForm<SendFormData>({
    resolver: zodResolver(sendFormSchema),
    defaultValues: {
      amount: 0,
      currency: "USDC",
      recipient: "",
      privacyLevel: "medium",
      memo: "",
      acceptTerms: false,
    },
    mode: "onChange",
  });

  const { watch, setValue, trigger, getValues } = form;
  const watchedValues = watch();

  // Redirect if not connected
  useEffect(() => {
    if (!connected) {
      router.push("/");
    }
  }, [connected, router]);

  // Update fee estimate when privacy level or amount changes
  useEffect(() => {
    const updateFees = async () => {
      if (watchedValues.amount > 0 && watchedValues.privacyLevel) {
        const privacyService = getPrivacyService(connection);
        const fees = await privacyService.estimateTotalFees({
          recipient: watchedValues.recipient || "",
          amount: watchedValues.amount,
          currency: watchedValues.currency,
          privacyLevel: watchedValues.privacyLevel as PrivacyLevel,
        });
        setFeeEstimate(fees);
      }
    };
    updateFees();
  }, [
    watchedValues.amount,
    watchedValues.privacyLevel,
    watchedValues.currency,
    watchedValues.recipient,
    connection,
  ]);

  const handleNext = async () => {
    let isValid = false;

    switch (currentStep) {
      case 0: // Amount step
        isValid = await trigger(["amount", "currency"]);
        break;
      case 1: // Recipient step
        isValid = await trigger(["recipient"]);
        break;
      case 2: // Privacy step
        isValid = await trigger(["privacyLevel"]);
        break;
      case 3: // Review step
        isValid = await trigger(["acceptTerms"]);
        if (isValid) {
          await handleSubmit();
          return;
        }
        break;
    }

    if (isValid && currentStep < STEPS.length - 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!publicKey || !connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to continue",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const values = getValues();
      const privacyService = getPrivacyService(connection);

      const result = await privacyService.executePrivateTransfer(
        {
          recipient: values.recipient,
          amount: values.amount,
          currency: values.currency as Currency,
          privacyLevel: values.privacyLevel as PrivacyLevel,
          memo: values.memo,
        },
        wallet
      );

      // Add to transaction history
      addTransaction({
        id: generateId(),
        signature: result.signature,
        timestamp: Date.now(),
        type: "send",
        amount: values.amount,
        currency: values.currency as Currency,
        sender: publicKey.toString(),
        recipient: values.recipient,
        status: result.status,
        privacyLevel: values.privacyLevel as PrivacyLevel,
        fees: result.fees,
        memo: values.memo,
      });

      setTxSignature(result.signature);
      setCurrentStep(4); // Move to complete step

      toast({
        title: "Transfer initiated",
        description: "Your private transfer has been submitted",
      });
    } catch (error) {
      console.error("Transfer failed:", error);
      toast({
        title: "Transfer failed",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Transaction signature copied to clipboard",
    });
  };

  const getMaxBalance = () => {
    const currency = watchedValues.currency;
    switch (currency) {
      case "SOL":
        return Math.max(0, balance.sol - 0.01); // Keep 0.01 SOL for fees
      case "USDC":
        return balance.usdc;
      case "USDT":
        return balance.usdt;
      default:
        return 0;
    }
  };

  if (!connected) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => (
            <div
              key={step}
              className={cn(
                "flex items-center",
                index < STEPS.length - 1 && "flex-1"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                  index < currentStep && "bg-primary text-primary-foreground",
                  index === currentStep &&
                    "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  index > currentStep && "bg-muted text-muted-foreground"
                )}
              >
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-1 mx-2 rounded-full transition-colors",
                    index < currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          {STEPS.map((step) => (
            <span key={step} className="w-8 text-center">
              {step}
            </span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>
                {currentStep === 0 && "Enter Amount"}
                {currentStep === 1 && "Recipient Details"}
                {currentStep === 2 && "Privacy Settings"}
                {currentStep === 3 && "Review Transfer"}
                {currentStep === 4 && "Transfer Complete"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Step 0: Amount */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select
                      value={watchedValues.currency}
                      onValueChange={(value) =>
                        setValue("currency", value as Currency)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SOL">
                          SOL - Balance: {formatAmount(balance.sol, 4)}
                        </SelectItem>
                        <SelectItem value="USDC">
                          USDC - Balance: {formatAmount(balance.usdc, 2)}
                        </SelectItem>
                        <SelectItem value="USDT">
                          USDT - Balance: {formatAmount(balance.usdt, 2)}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Amount</Label>
                      <button
                        type="button"
                        className="text-sm text-primary hover:underline"
                        onClick={() => setValue("amount", getMaxBalance())}
                      >
                        Max: {formatAmount(getMaxBalance(), 4)}
                      </button>
                    </div>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={watchedValues.amount || ""}
                      onChange={(e) =>
                        setValue("amount", parseFloat(e.target.value) || 0)
                      }
                      error={!!form.formState.errors.amount}
                    />
                    {form.formState.errors.amount && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.amount.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 1: Recipient */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Recipient Address</Label>
                    <Input
                      placeholder="Enter Solana address"
                      value={watchedValues.recipient}
                      onChange={(e) => setValue("recipient", e.target.value)}
                      error={!!form.formState.errors.recipient}
                    />
                    {form.formState.errors.recipient && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.recipient.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Enter a valid Solana wallet address or .sol domain
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Memo (Optional)</Label>
                    <Input
                      placeholder="Add a note"
                      value={watchedValues.memo || ""}
                      onChange={(e) => setValue("memo", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Privacy */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  {privacyOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected =
                      watchedValues.privacyLevel === option.level;
                    return (
                      <button
                        key={option.level}
                        type="button"
                        onClick={() => setValue("privacyLevel", option.level)}
                        className={cn(
                          "w-full p-4 rounded-lg border text-left transition-all",
                          isSelected
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "p-2 rounded-lg bg-muted",
                              isSelected && "bg-primary/10"
                            )}
                          >
                            <Icon className={cn("h-5 w-5", option.color)} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{option.name}</span>
                              {option.recommended && (
                                <Badge variant="secondary" className="text-xs">
                                  Recommended
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {option.description}
                            </p>
                            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                              <span>Fee: {option.fee}</span>
                              <span>Time: {option.time}</span>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-medium">
                        {formatAmount(watchedValues.amount, 4)}{" "}
                        {watchedValues.currency}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Recipient</span>
                      <span className="font-mono text-sm">
                        {formatAddress(watchedValues.recipient, 6)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Privacy</span>
                      <Badge>
                        {
                          privacyOptions.find(
                            (o) => o.level === watchedValues.privacyLevel
                          )?.name
                        }
                      </Badge>
                    </div>
                    {feeEstimate && (
                      <>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">
                            Network Fee
                          </span>
                          <span>{formatAmount(feeEstimate.networkFee, 6)} SOL</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">
                            Privacy Fee
                          </span>
                          <span>{formatAmount(feeEstimate.privacyFee, 6)} SOL</span>
                        </div>
                        <div className="flex justify-between py-2 font-medium">
                          <span>Total Fees</span>
                          <span>{formatAmount(feeEstimate.total, 6)} SOL</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      checked={watchedValues.acceptTerms}
                      onChange={(e) =>
                        setValue("acceptTerms", e.target.checked)
                      }
                      className="mt-1"
                    />
                    <Label htmlFor="acceptTerms" className="text-sm">
                      I understand that this transaction cannot be reversed and
                      I accept the{" "}
                      <a href="/terms" className="text-primary hover:underline">
                        terms of service
                      </a>
                    </Label>
                  </div>
                  {form.formState.errors.acceptTerms && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.acceptTerms.message}
                    </p>
                  )}
                </div>
              )}

              {/* Step 4: Complete */}
              {currentStep === 4 && (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center">
                    <Check className="h-8 w-8 text-success" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Transfer Initiated!
                    </h3>
                    <p className="text-muted-foreground">
                      Your private transfer has been submitted to the network
                    </p>
                  </div>

                  {txSignature && (
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        Transaction Signature
                      </p>
                      <div className="flex items-center gap-2 justify-center">
                        <code className="text-sm">
                          {formatAddress(txSignature, 8)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(txSignature)}
                          className="p-1 hover:bg-muted-foreground/10 rounded"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <a
                          href={`https://explorer.solana.com/tx/${txSignature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 hover:bg-muted-foreground/10 rounded"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 justify-center">
                    <Button variant="outline" onClick={() => router.push("/history")}>
                      View History
                    </Button>
                    <Button
                      onClick={() => {
                        form.reset();
                        setCurrentStep(0);
                        setTxSignature(null);
                      }}
                    >
                      Send Another
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      {currentStep < 4 && (
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleNext} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : currentStep === 3 ? (
              <>
                Confirm Transfer
                <Check className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
