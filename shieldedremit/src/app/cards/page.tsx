"use client";

import { useState, useEffect } from "react";
import { useWalletStore } from "@/stores/walletStore";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/useToast";
import {
  createVirtualCard,
  getVirtualCard,
  topUpVirtualCard,
  toggleCardFreeze,
  getCardTransactions,
} from "@/lib/shadowpay";
import type { VirtualCard, CardTransaction, Currency } from "@/types";

const SUPPORTED_CURRENCIES: Currency[] = ["SOL", "USDC", "USDT", "USD1"];

export default function CardsPage() {
  const { connected, publicKey } = useWalletStore();
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<VirtualCard | null>(null);
  const [transactions, setTransactions] = useState<CardTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    amount: "",
    currency: "USDC" as Currency,
  });
  const [topUpForm, setTopUpForm] = useState({
    amount: "",
    currency: "USDC" as Currency,
  });

  // Fetch card details when a card is selected
  useEffect(() => {
    if (selectedCard) {
      loadCardTransactions(selectedCard.id);
    }
  }, [selectedCard]);

  const loadCardTransactions = async (cardId: string) => {
    const result = await getCardTransactions(cardId);
    if (result.success && result.data) {
      setTransactions(result.data);
    }
  };

  const handleCreateCard = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create a virtual card.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(createForm.amount);
    if (isNaN(amount) || amount < 5) {
      toast({
        title: "Invalid Amount",
        description: "Minimum amount is $5.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // In production, you would sign a message here
      const signature = "mock_signature";

      const result = await createVirtualCard({
        amount,
        currency: createForm.currency,
        wallet: publicKey,
        signature,
      });

      if (result.success && result.data) {
        setCards([...cards, result.data]);
        setSelectedCard(result.data);
        toast({
          title: "Card Created",
          description: "Your virtual card has been created successfully.",
        });
        setCreateForm({ amount: "", currency: "USDC" });
      } else {
        toast({
          title: "Creation Failed",
          description: result.error || "Failed to create virtual card.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Create card error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (!selectedCard) return;

    const amount = parseFloat(topUpForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const signature = "mock_signature";

      const result = await topUpVirtualCard(
        selectedCard.id,
        amount,
        topUpForm.currency,
        signature
      );

      if (result.success && result.data) {
        setSelectedCard(result.data);
        setCards(
          cards.map((c) => (c.id === result.data!.id ? result.data! : c))
        );
        toast({
          title: "Top Up Successful",
          description: `Added ${amount} ${topUpForm.currency} to your card.`,
        });
        setTopUpForm({ amount: "", currency: "USDC" });
      } else {
        toast({
          title: "Top Up Failed",
          description: result.error || "Failed to top up card.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Top up error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFreeze = async () => {
    if (!selectedCard) return;

    setLoading(true);
    try {
      const shouldFreeze = selectedCard.status !== "frozen";
      const result = await toggleCardFreeze(selectedCard.id, shouldFreeze);

      if (result.success && result.data) {
        setSelectedCard(result.data);
        setCards(
          cards.map((c) => (c.id === result.data!.id ? result.data! : c))
        );
        toast({
          title: shouldFreeze ? "Card Frozen" : "Card Unfrozen",
          description: shouldFreeze
            ? "Your card has been frozen."
            : "Your card has been unfrozen.",
        });
      }
    } catch (error) {
      console.error("Toggle freeze error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (number: string) => {
    return number.replace(/(\d{4})/g, "$1 ").trim();
  };

  if (!connected) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Virtual Cards</CardTitle>
            <CardDescription>
              Connect your wallet to create and manage virtual cards for
              off-ramp transactions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <p className="text-muted-foreground">
              Please connect your wallet to continue.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Virtual Cards</h1>
        <p className="text-muted-foreground mt-2">
          Create virtual Mastercard cards funded with cryptocurrency. Perfect
          for off-ramp and everyday spending.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Card List / Create Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Your Cards</CardTitle>
              <CardDescription>
                Manage your virtual cards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cards.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No cards yet. Create your first card below.
                </p>
              ) : (
                <div className="space-y-2">
                  {cards.map((card) => (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCard(card)}
                      className={`w-full p-4 rounded-lg border text-left transition-colors ${
                        selectedCard?.id === card.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono text-sm">
                            **** {card.cardNumber.slice(-4)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${card.balance.toFixed(2)}
                          </p>
                        </div>
                        <Badge
                          variant={
                            card.status === "active"
                              ? "default"
                              : card.status === "frozen"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {card.status}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Create New Card</h4>
                <div className="space-y-3">
                  <div>
                    <Label>Initial Amount</Label>
                    <Input
                      type="number"
                      placeholder="Min. $5"
                      value={createForm.amount}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, amount: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Select
                      value={createForm.currency}
                      onValueChange={(v) =>
                        setCreateForm({ ...createForm, currency: v as Currency })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleCreateCard}
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Card"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    0.2% activation fee + 2.5% funding fee
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card Details */}
        <div className="lg:col-span-2">
          {selectedCard ? (
            <Tabs defaultValue="details">
              <TabsList className="mb-4">
                <TabsTrigger value="details">Card Details</TabsTrigger>
                <TabsTrigger value="topup">Top Up</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <Card>
                  <CardContent className="pt-6">
                    {/* Virtual Card Display */}
                    <div className="bg-gradient-to-br from-primary/80 to-primary rounded-xl p-6 text-white mb-6 max-w-md">
                      <div className="flex justify-between items-start mb-8">
                        <div className="text-sm opacity-80">ShieldedRemit</div>
                        <div className="text-sm font-semibold">MASTERCARD</div>
                      </div>
                      <div className="font-mono text-xl tracking-wider mb-4">
                        {formatCardNumber(selectedCard.cardNumber)}
                      </div>
                      <div className="flex justify-between">
                        <div>
                          <div className="text-xs opacity-60">EXPIRES</div>
                          <div className="font-mono">
                            {selectedCard.expiryDate}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs opacity-60">CVV</div>
                          <div className="font-mono">{selectedCard.cvv}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-60">BALANCE</div>
                          <div className="font-mono">
                            ${selectedCard.balance.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex gap-3">
                      <Button
                        variant={
                          selectedCard.status === "frozen"
                            ? "default"
                            : "outline"
                        }
                        onClick={handleToggleFreeze}
                        disabled={loading}
                      >
                        {selectedCard.status === "frozen"
                          ? "Unfreeze Card"
                          : "Freeze Card"}
                      </Button>
                      <Button variant="outline">Copy Card Details</Button>
                    </div>

                    {/* Card Info */}
                    <div className="mt-6 space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Status</span>
                        <Badge
                          variant={
                            selectedCard.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {selectedCard.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Created</span>
                        <span>
                          {new Date(selectedCard.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {selectedCard.lastUsed && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">
                            Last Used
                          </span>
                          <span>
                            {new Date(
                              selectedCard.lastUsed
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="topup">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Up Card</CardTitle>
                    <CardDescription>
                      Add funds to your virtual card using cryptocurrency.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-w-md space-y-4">
                      <div>
                        <Label>Amount</Label>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={topUpForm.amount}
                          onChange={(e) =>
                            setTopUpForm({
                              ...topUpForm,
                              amount: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Currency</Label>
                        <Select
                          value={topUpForm.currency}
                          onValueChange={(v) =>
                            setTopUpForm({
                              ...topUpForm,
                              currency: v as Currency,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SUPPORTED_CURRENCIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span>Top-up Fee (2.5%)</span>
                          <span>
                            ${(parseFloat(topUpForm.amount || "0") * 0.025).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold mt-2">
                          <span>Card Will Receive</span>
                          <span>
                            ${(parseFloat(topUpForm.amount || "0") * 0.975).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleTopUp}
                        disabled={loading}
                      >
                        {loading ? "Processing..." : "Top Up Card"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions">
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>
                      Recent transactions on this card.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {transactions.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No transactions yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {transactions.map((tx) => (
                          <div
                            key={tx.id}
                            className="flex justify-between items-center p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">{tx.merchant}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(tx.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono">
                                -${tx.amount.toFixed(2)}
                              </p>
                              <Badge
                                variant={
                                  tx.status === "completed"
                                    ? "default"
                                    : tx.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {tx.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">
                    No Card Selected
                  </h3>
                  <p className="text-muted-foreground">
                    Select a card from the list or create a new one.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
