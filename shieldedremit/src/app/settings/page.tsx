"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import {
  Shield,
  Bell,
  Globe,
  Moon,
  Sun,
  Trash2,
  ExternalLink,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useWalletStore } from "@/stores/walletStore";
import { useTransactionStore } from "@/stores/transactionStore";
import { useAddressBookStore } from "@/stores/addressBookStore";
import { toast } from "@/hooks/useToast";
import { formatAddress } from "@/lib/utils";
import type { PrivacyLevel, Currency, NetworkType } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const { publicKey, connected, disconnect } = useWallet();
  const {
    preferences,
    updatePreferences,
    selectedNetwork,
    setNetwork,
  } = useWalletStore();
  const { clearTransactions } = useTransactionStore();
  const { clearAddressBook } = useAddressBookStore();

  useEffect(() => {
    if (!connected) {
      router.push("/");
    }
  }, [connected, router]);

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear your transaction history? This cannot be undone.")) {
      clearTransactions();
      toast({
        title: "History cleared",
        description: "Your transaction history has been cleared",
      });
    }
  };

  const handleClearAddressBook = () => {
    if (confirm("Are you sure you want to clear your address book? This cannot be undone.")) {
      clearAddressBook();
      toast({
        title: "Address book cleared",
        description: "Your address book has been cleared",
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    router.push("/");
  };

  if (!connected) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your preferences and account settings
          </p>
        </div>

        <div className="space-y-6">
          {/* Wallet Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Wallet
              </CardTitle>
              <CardDescription>
                Manage your connected wallet and network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Connected Wallet</Label>
                  <p className="text-sm text-muted-foreground font-mono">
                    {formatAddress(publicKey?.toString() || "", 8)}
                  </p>
                </div>
                <Button variant="outline" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Network</Label>
                  <p className="text-sm text-muted-foreground">
                    Select Solana network
                  </p>
                </div>
                <Select
                  value={selectedNetwork}
                  onValueChange={(v) => setNetwork(v as NetworkType)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mainnet-beta">Mainnet</SelectItem>
                    <SelectItem value="devnet">Devnet</SelectItem>
                    <SelectItem value="testnet">Testnet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy
              </CardTitle>
              <CardDescription>
                Configure your default privacy settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Default Privacy Level</Label>
                  <p className="text-sm text-muted-foreground">
                    Applied to new transactions
                  </p>
                </div>
                <Select
                  value={preferences.defaultPrivacyLevel}
                  onValueChange={(v) =>
                    updatePreferences({ defaultPrivacyLevel: v as PrivacyLevel })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Privacy</SelectItem>
                    <SelectItem value="medium">Amount Privacy</SelectItem>
                    <SelectItem value="high">Full Anonymity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Default Currency</Label>
                  <p className="text-sm text-muted-foreground">
                    Preferred currency for transfers
                  </p>
                </div>
                <Select
                  value={preferences.defaultCurrency}
                  onValueChange={(v) =>
                    updatePreferences({ defaultCurrency: v as Currency })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOL">SOL</SelectItem>
                    <SelectItem value="USDC">USDC</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Browser Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about transactions
                  </p>
                </div>
                <Switch
                  checked={preferences.notifications.browser}
                  onCheckedChange={(checked) =>
                    updatePreferences({
                      notifications: {
                        ...preferences.notifications,
                        browser: checked,
                      },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates
                  </p>
                </div>
                <Switch
                  checked={preferences.notifications.email}
                  onCheckedChange={(checked) =>
                    updatePreferences({
                      notifications: {
                        ...preferences.notifications,
                        email: checked,
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Display
              </CardTitle>
              <CardDescription>
                Customize your display preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle dark mode appearance
                  </p>
                </div>
                <Switch
                  checked={preferences.darkMode}
                  onCheckedChange={(checked) =>
                    updatePreferences({ darkMode: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Language / Locale</Label>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred language
                  </p>
                </div>
                <Select
                  value={preferences.locale}
                  onValueChange={(v) => updatePreferences({ locale: v })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="en-GB">English (UK)</SelectItem>
                    <SelectItem value="es-ES">Spanish</SelectItem>
                    <SelectItem value="fr-FR">French</SelectItem>
                    <SelectItem value="de-DE">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Clear your local data (this cannot be undone)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Transaction History</Label>
                  <p className="text-sm text-muted-foreground">
                    Clear all stored transaction history
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={handleClearHistory}>
                  Clear History
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Address Book</Label>
                  <p className="text-sm text-muted-foreground">
                    Clear all saved addresses
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAddressBook}
                >
                  Clear Addresses
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About ShieldedRemit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Version</span>
                <Badge variant="outline">1.0.0</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Network</span>
                <Badge variant="outline">Solana</Badge>
              </div>
              <div className="pt-4 flex gap-4">
                <a
                  href="/docs"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Documentation
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href="/privacy"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Privacy Policy
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href="/terms"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  Terms of Service
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
