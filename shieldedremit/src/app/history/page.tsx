"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  ExternalLink,
  Copy,
  Shield,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  Clock,
  XCircle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactionStore } from "@/stores/transactionStore";
import { toast } from "@/hooks/useToast";
import { formatAddress, formatAmount, cn } from "@/lib/utils";
import type { Transaction, PrivacyLevel } from "@/types";

const privacyIcons: Record<PrivacyLevel, typeof Shield> = {
  none: Shield,
  medium: ShieldCheck,
  high: ShieldAlert,
};

const statusIcons = {
  pending: Clock,
  processing: Clock,
  confirmed: CheckCircle,
  failed: XCircle,
};

const statusColors = {
  pending: "text-warning",
  processing: "text-warning",
  confirmed: "text-success",
  failed: "text-destructive",
};

export default function HistoryPage() {
  const router = useRouter();
  const { connected } = useWallet();
  const { transactions } = useTransactionStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "send" | "receive">(
    "all"
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "confirmed" | "failed"
  >("all");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!connected) {
      router.push("/");
    }
  }, [connected, router]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type filter
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;

      // Status filter
      if (statusFilter !== "all" && tx.status !== statusFilter) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !tx.recipient.toLowerCase().includes(query) &&
          !tx.signature.toLowerCase().includes(query) &&
          !tx.memo?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, typeFilter, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      totalSent: transactions
        .filter((tx) => tx.type === "send" && tx.status === "confirmed")
        .reduce((sum, tx) => sum + tx.amount, 0),
      totalReceived: transactions
        .filter((tx) => tx.type === "receive" && tx.status === "confirmed")
        .reduce((sum, tx) => sum + tx.amount, 0),
      totalTransactions: transactions.length,
      pendingTransactions: transactions.filter((tx) => tx.status === "pending")
        .length,
    };
  }, [transactions]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Copied to clipboard",
    });
  };

  const exportTransactions = () => {
    const csv = [
      ["Date", "Type", "Amount", "Currency", "Recipient", "Status", "Privacy", "Signature"].join(","),
      ...filteredTransactions.map((tx) =>
        [
          format(tx.timestamp, "yyyy-MM-dd HH:mm:ss"),
          tx.type,
          tx.amount,
          tx.currency,
          tx.recipient,
          tx.status,
          tx.privacyLevel,
          tx.signature,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shieldedremit-transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (!connected) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
            <p className="text-muted-foreground">
              View and manage your transfer history
            </p>
          </div>
          <Button variant="outline" onClick={exportTransactions}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Sent</p>
              <p className="text-2xl font-bold">
                ${formatAmount(stats.totalSent, 2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Received</p>
              <p className="text-2xl font-bold">
                ${formatAmount(stats.totalReceived, 2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Transactions</p>
              <p className="text-2xl font-bold">{stats.totalTransactions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{stats.pendingTransactions}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by address, signature, or memo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={typeFilter}
                onValueChange={(v) =>
                  setTypeFilter(v as "all" | "send" | "receive")
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="send">Sent</SelectItem>
                  <SelectItem value="receive">Received</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(v) =>
                  setStatusFilter(
                    v as "all" | "pending" | "confirmed" | "failed"
                  )
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transaction List */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              {filteredTransactions.length} transaction
              {filteredTransactions.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No transactions found</p>
                {transactions.length === 0 && (
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => router.push("/send")}
                  >
                    Make your first transfer
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {filteredTransactions.map((tx, index) => {
                    const PrivacyIcon = privacyIcons[tx.privacyLevel];
                    const StatusIcon = statusIcons[tx.status];
                    const isSend = tx.type === "send";

                    return (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="w-full p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-4">
                            {/* Direction Icon */}
                            <div
                              className={cn(
                                "p-2 rounded-full",
                                isSend
                                  ? "bg-destructive/10"
                                  : "bg-success/10"
                              )}
                            >
                              {isSend ? (
                                <ArrowUpRight className="h-5 w-5 text-destructive" />
                              ) : (
                                <ArrowDownLeft className="h-5 w-5 text-success" />
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {isSend ? "Sent" : "Received"}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  <PrivacyIcon className="h-3 w-3 mr-1" />
                                  {tx.privacyLevel}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {isSend ? "To: " : "From: "}
                                {formatAddress(tx.recipient, 6)}
                              </p>
                            </div>

                            {/* Amount & Status */}
                            <div className="text-right">
                              <p
                                className={cn(
                                  "font-semibold",
                                  isSend ? "text-destructive" : "text-success"
                                )}
                              >
                                {isSend ? "-" : "+"}
                                {formatAmount(tx.amount, 4)} {tx.currency}
                              </p>
                              <div
                                className={cn(
                                  "flex items-center gap-1 text-xs",
                                  statusColors[tx.status]
                                )}
                              >
                                <StatusIcon className="h-3 w-3" />
                                {tx.status}
                              </div>
                            </div>

                            {/* Timestamp */}
                            <div className="hidden md:block text-sm text-muted-foreground w-32 text-right">
                              {format(tx.timestamp, "MMM d, HH:mm")}
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Detail Modal */}
        <Dialog open={!!selectedTx} onOpenChange={() => setSelectedTx(null)}>
          <DialogContent className="max-w-md">
            {selectedTx && (
              <>
                <DialogHeader>
                  <DialogTitle>Transaction Details</DialogTitle>
                  <DialogDescription>
                    {format(selectedTx.timestamp, "MMMM d, yyyy 'at' HH:mm")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium capitalize">
                      {selectedTx.type}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">
                      {formatAmount(selectedTx.amount, 4)} {selectedTx.currency}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Recipient</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {formatAddress(selectedTx.recipient, 6)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedTx.recipient)}
                      >
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      variant={
                        selectedTx.status === "confirmed"
                          ? "success"
                          : selectedTx.status === "failed"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {selectedTx.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Privacy</span>
                    <Badge variant="outline">{selectedTx.privacyLevel}</Badge>
                  </div>
                  {selectedTx.fees && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Total Fees</span>
                      <span>
                        {formatAmount(selectedTx.fees.total, 6)} SOL
                      </span>
                    </div>
                  )}
                  {selectedTx.memo && (
                    <div className="py-2 border-b">
                      <span className="text-muted-foreground">Memo</span>
                      <p className="mt-1">{selectedTx.memo}</p>
                    </div>
                  )}
                  <div className="pt-2">
                    <span className="text-muted-foreground text-sm">
                      Signature
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-muted p-2 rounded flex-1 truncate">
                        {selectedTx.signature}
                      </code>
                      <button
                        onClick={() => copyToClipboard(selectedTx.signature)}
                      >
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <a
                        href={`https://explorer.solana.com/tx/${selectedTx.signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
}
