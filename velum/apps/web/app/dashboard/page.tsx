"use client";

import { useState, useEffect, memo } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useVelum } from "../../lib/hooks/use-velum";
import { Header } from "../../components/layout/header";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { TokenIcon } from "@/components/ui/token-icons";
import { cn } from "../../lib/utils/cn";
import {
  useTransactionHistory,
  TransactionFilters,
} from "../../lib/hooks/use-transaction-history";
import {
  TransactionRecord,
  TransactionType,
  TransactionToken,
} from "../../lib/transaction-history";
import { usePaylinkHistory } from "../../lib/hooks/use-paylink-history";
import { PaylinkItem } from "../../components/features/paylink-item";

type FilterType = "all" | TransactionType;
type FilterToken = "all" | TransactionToken;
type HistoryTab = "transactions" | "paylinks";

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - timestamp;

  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    if (hours === 0) {
      const minutes = Math.floor(diff / (60 * 1000));
      return minutes <= 1 ? "Just now" : `${minutes}m ago`;
    }
    return `${hours}h ago`;
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAmount(amount: string, token: TransactionToken): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return "0";

  if (num >= 1000) {
    return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }

  if (num >= 1) {
    return num.toFixed(4).replace(/\.?0+$/, "");
  }

  return num.toPrecision(4).replace(/\.?0+$/, "");
}

function getExplorerUrl(signature: string): string {
  return `https://orbmarkets.io/tx/${signature}`;
}

const TransactionItem = memo(function TransactionItem({ transaction }: { transaction: TransactionRecord }) {
  const isDeposit = transaction.type === "deposit";

  return (
    <a
      href={getExplorerUrl(transaction.signature)}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 border border-border bg-[#262626]/30 hover:bg-[#262626]/50 transition-colors"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "w-10 h-10 flex items-center justify-center flex-shrink-0",
              isDeposit
                ? "bg-success/10 border border-success/20"
                : "bg-primary/10 border border-primary/20"
            )}
          >
            {isDeposit ? (
              <svg
                className="w-5 h-5 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium text-foreground capitalize">
                {transaction.type}
              </span>
              {transaction.paylinkId && (
                <span className="text-xs font-mono text-foreground/50 px-1.5 py-0.5 bg-[#262626] border border-border">
                  paylink
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs text-foreground/50">
                {formatDate(transaction.timestamp)}
              </span>
              <span className="text-foreground/20">&middot;</span>
              <span
                className={cn(
                  "font-mono text-xs capitalize",
                  transaction.status === "confirmed"
                    ? "text-success"
                    : transaction.status === "pending"
                      ? "text-warning"
                      : "text-error"
                )}
              >
                {transaction.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={cn(
              "font-mono text-sm font-medium",
              isDeposit ? "text-success" : "text-foreground"
            )}
          >
            {isDeposit ? "+" : "-"}
            {formatAmount(transaction.amount, transaction.token)}
          </span>
          <TokenIcon token={transaction.token} size={18} />
        </div>
      </div>
    </a>
  );
});

export default function DashboardPage() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { isInitialized, isLoading, error: sdkError, privateBalance, initialize, refreshBalance } = useVelum();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    try {
      await refreshBalance();
    } finally {
      setIsRefreshing(false);
    }
  };

  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterToken, setFilterToken] = useState<FilterToken>("all");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [historyTab, setHistoryTab] = useState<HistoryTab>("transactions");

  const {
    transactions,
    isLoading: historyLoading,
    error: historyError,
    setFilters,
    clearHistory,
    refresh,
  } = useTransactionHistory();

  const {
    paylinks,
    isLoading: paylinksLoading,
    error: paylinksError,
    clearHistory: clearPaylinkHistory,
    refresh: refreshPaylinks,
  } = usePaylinkHistory();

  // Initialize SDK when wallet is connected (don't retry on failure)
  useEffect(() => {
    if (publicKey && !isInitialized && !isLoading && !sdkError) {
      initialize();
    }
  }, [publicKey, isInitialized, isLoading, sdkError, initialize]);

  // Update filters when selection changes
  useEffect(() => {
    const filters: TransactionFilters = {};
    if (filterType !== "all") {
      filters.type = filterType;
    }
    if (filterToken !== "all") {
      filters.token = filterToken;
    }
    setFilters(filters);
  }, [filterType, filterToken, setFilters]);

  const handleClearHistory = async () => {
    if (historyTab === "transactions") {
      await clearHistory();
    } else {
      await clearPaylinkHistory();
    }
    setShowClearConfirm(false);
  };

  // State 1: No wallet — auth gate
  if (!publicKey) {
    return (
      <div className="flex-1 flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center p-6 pt-32">
          <div className="max-w-sm w-full text-center space-y-6">
            <div className="w-12 h-12 mx-auto border border-primary/20 bg-primary/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-sentient font-extralight tracking-tight text-foreground mb-2">
                Connect Wallet
              </h1>
              <p className="text-sm font-mono text-foreground/50">
                Connect your wallet to access your private dashboard.
              </p>
            </div>
            <div className="space-y-3">
              <Button onClick={() => setVisible(true)} className="w-full">
                [Connect Wallet]
              </Button>
              <Link
                href="/"
                className="block text-sm font-mono text-foreground/50 hover:text-foreground transition-colors"
              >
                [Back to Home]
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // State 2: SDK initialization failed — show error with retry
  if (sdkError && !isInitialized) {
    return (
      <div className="flex-1 flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 flex items-center justify-center p-6 pt-32">
          <div className="max-w-sm w-full text-center space-y-6">
            <div className="w-12 h-12 mx-auto border border-error/20 bg-error/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-sentient font-extralight tracking-tight text-foreground mb-2">
                Initialization Failed
              </h1>
              <p className="text-sm font-mono text-foreground/50">
                {sdkError.message === "Failed to initialize SDK"
                  ? "Signature was rejected or an error occurred."
                  : sdkError.message}
              </p>
            </div>
            <Button onClick={initialize}>
              [Try Again]
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // State 3-4: Loading (SDK initializing or balance fetching)
  if (!isInitialized || !privateBalance) {
    return (
      <div className="flex-1 flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 container mx-auto px-6 pt-32 pb-12">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 w-48 bg-foreground/10 mb-8" />
              <div className="h-48 bg-foreground/10 mb-8" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-40 bg-foreground/10" />
                <div className="h-40 bg-foreground/10" />
              </div>
            </div>
            <p className="text-xs font-mono text-foreground/30 text-center mt-8">
              {!isInitialized ? "Waiting for signature..." : "Loading balance..."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 container mx-auto px-6 pt-32 pb-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-sentient font-extralight tracking-tight mb-8">Dashboard</h1>

          {/* Private Balance Card */}
          <Card className="p-8 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-sm font-mono text-foreground/60 uppercase tracking-wider">
                Private Balance
              </h2>
              <button
                onClick={handleRefreshBalance}
                disabled={isRefreshing}
                className="text-foreground/40 hover:text-foreground transition-colors disabled:opacity-50"
                title="Refresh balance"
              >
                <svg
                  className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-[#262626]/30 border border-border hover:bg-[#262626]/50 transition-colors">
                <div className="flex items-center gap-2 mb-2 text-foreground/60">
                  <TokenIcon token="SOL" size={20} className="text-primary" />
                  <span className="font-mono text-sm">SOL</span>
                </div>
                <div className="text-2xl font-sentient font-extralight tracking-tight text-foreground">
                  {(Number(privateBalance.sol) / 1e9).toFixed(4)}
                </div>
              </div>
              <div className="p-5 bg-[#262626]/30 border border-border hover:bg-[#262626]/50 transition-colors">
                <div className="flex items-center gap-2 mb-2 text-foreground/60">
                  <TokenIcon token="USDC" size={20} className="text-primary" />
                  <span className="font-mono text-sm">USDC</span>
                </div>
                <div className="text-2xl font-sentient font-extralight tracking-tight text-foreground">
                  {(Number(privateBalance.usdc) / 1e6).toFixed(2)}
                </div>
              </div>
              <div className="p-5 bg-[#262626]/30 border border-border hover:bg-[#262626]/50 transition-colors">
                <div className="flex items-center gap-2 mb-2 text-foreground/60">
                  <TokenIcon token="USDT" size={20} className="text-primary" />
                  <span className="font-mono text-sm">USDT</span>
                </div>
                <div className="text-2xl font-sentient font-extralight tracking-tight text-foreground">
                  {(Number(privateBalance.usdt) / 1e6).toFixed(2)}
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            <Link href="/receive" className="group">
              <Card className="p-8 h-full hover:border-primary/30 transition-all duration-300">
                <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-all duration-300">
                  <svg
                    className="w-6 h-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-sentient font-extralight tracking-tight mb-2 text-foreground group-hover:text-primary transition-colors">
                  Create Payment Link
                </h3>
                <p className="text-sm font-mono text-foreground/60 leading-relaxed">
                  Generate a private link to receive funds without revealing
                  your wallet.
                </p>
              </Card>
            </Link>

            <Link href="/withdraw" className="group">
              <Card className="p-8 h-full hover:border-primary/30 transition-all duration-300">
                <div className="w-12 h-12 bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-all duration-300">
                  <svg
                    className="w-6 h-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-sentient font-extralight tracking-tight mb-2 text-foreground group-hover:text-primary transition-colors">
                  Withdraw Funds
                </h3>
                <p className="text-sm font-mono text-foreground/60 leading-relaxed">
                  Send your private funds to any Solana wallet. Completely
                  untraceable.
                </p>
              </Card>
            </Link>
          </div>

          {/* Transaction History */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-mono text-foreground/60 uppercase tracking-wider">
                History
              </h2>
              {((historyTab === "transactions" && transactions.length > 0) ||
                (historyTab === "paylinks" && paylinks.length > 0)) && (
                <Button
                  variant="ghost"
                  className="text-foreground/50 hover:text-error text-xs"
                  onClick={() => setShowClearConfirm(true)}
                >
                  [Clear]
                </Button>
              )}
            </div>

            {/* Tab Selector */}
            <div className="flex gap-2 mb-6">
              {(["transactions", "paylinks"] as HistoryTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setHistoryTab(tab)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-mono uppercase transition-all duration-200 border",
                    historyTab === tab
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-[#262626]/30 text-foreground/60 hover:bg-[#262626]/50 hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Clear Confirmation */}
            {showClearConfirm && (
              <Card className="p-6 mb-6 border-error/30">
                <p className="font-mono text-sm text-foreground mb-4">
                  Clear all {historyTab === "transactions" ? "transaction" : "paylink"} history? This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    [Cancel]
                  </Button>
                  <Button
                    className="bg-error/20 border-error/30 hover:bg-error/30 text-error"
                    onClick={handleClearHistory}
                  >
                    [Clear History]
                  </Button>
                </div>
              </Card>
            )}

            {historyTab === "transactions" && (
              <>
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex gap-2">
                    {(["all", "deposit", "withdraw"] as FilterType[]).map(
                      (type) => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={cn(
                            "px-3 py-1.5 text-xs font-mono uppercase transition-all duration-200 border",
                            filterType === type
                              ? "border-primary/50 bg-primary/10 text-primary"
                              : "border-border bg-[#262626]/30 text-foreground/60 hover:bg-[#262626]/50 hover:text-foreground"
                          )}
                        >
                          {type}
                        </button>
                      )
                    )}
                  </div>

                  <div className="flex gap-2">
                    {(["all", "SOL", "USDC", "USDT"] as FilterToken[]).map(
                      (token) => (
                        <button
                          key={token}
                          onClick={() => setFilterToken(token)}
                          className={cn(
                            "px-3 py-1.5 text-xs font-mono uppercase transition-all duration-200 border flex items-center gap-1.5",
                            filterToken === token
                              ? "border-primary/50 bg-primary/10 text-primary"
                              : "border-border bg-[#262626]/30 text-foreground/60 hover:bg-[#262626]/50 hover:text-foreground"
                          )}
                        >
                          {token !== "all" && <TokenIcon token={token} size={14} />}
                          {token}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Transaction List */}
                {historyLoading ? (
                  <Card className="p-8">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary animate-spin rounded-full" />
                      <span className="font-mono text-sm text-foreground/60">
                        Loading history...
                      </span>
                    </div>
                  </Card>
                ) : historyError ? (
                  <Card className="p-8 text-center">
                    <p className="font-mono text-sm text-error mb-4">
                      {historyError.message}
                    </p>
                    <Button onClick={refresh}>[Try Again]</Button>
                  </Card>
                ) : transactions.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="font-mono text-sm text-foreground/50">
                      {filterType !== "all" || filterToken !== "all"
                        ? "No transactions match your filters"
                        : "No transactions yet"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((tx) => (
                      <TransactionItem key={tx.id} transaction={tx} />
                    ))}

                    {transactions.length >= 100 && (
                      <p className="text-xs font-mono text-foreground/50 text-center pt-4">
                        Showing last 100 transactions
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {historyTab === "paylinks" && (
              <>
                {paylinksLoading ? (
                  <Card className="p-8">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary animate-spin rounded-full" />
                      <span className="font-mono text-sm text-foreground/60">
                        Loading paylinks...
                      </span>
                    </div>
                  </Card>
                ) : paylinksError ? (
                  <Card className="p-8 text-center">
                    <p className="font-mono text-sm text-error mb-4">
                      {paylinksError.message}
                    </p>
                    <Button onClick={refreshPaylinks}>[Try Again]</Button>
                  </Card>
                ) : paylinks.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="font-mono text-sm text-foreground/50">
                      No paylinks created yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paylinks.map((p) => (
                      <PaylinkItem key={p.id} paylink={p} />
                    ))}
                  </div>
                )}
              </>
            )}

            <p className="text-xs font-mono text-foreground/30 text-center mt-8">
              History is stored locally on this device and never sent to our servers
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
