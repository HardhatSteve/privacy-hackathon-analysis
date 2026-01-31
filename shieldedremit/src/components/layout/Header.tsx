"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Send, Download, History, Settings, Menu, X, CreditCard, User } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/stores/walletStore";

// Check if Privy is configured
const PRIVY_ENABLED = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID;

const navigation = [
  { name: "Send", href: "/send", icon: Send },
  { name: "Receive", href: "/receive", icon: Download },
  { name: "Cards", href: "/cards", icon: CreditCard },
  { name: "History", href: "/history", icon: History },
  { name: "Settings", href: "/settings", icon: Settings },
];

// Wallet connect button component that works with both Privy and standard adapter
function WalletButton() {
  const { connected, connecting, publicKey, privyUser } = useWalletStore();

  // Try to use Privy if available
  if (PRIVY_ENABLED) {
    // Dynamic import for Privy components
    const PrivyButton = require("./PrivyWalletButton").default;
    return <PrivyButton />;
  }

  // Fallback to standard Solana wallet adapter
  const { WalletMultiButton } = require("@solana/wallet-adapter-react-ui");
  return (
    <WalletMultiButton className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !rounded-lg !h-10 !text-sm" />
  );
}

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { selectedNetwork, setNetwork, connected, publicKey, privyUser } = useWalletStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-solana">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="hidden font-bold text-lg sm:block">
              ShieldedRemit
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Network selector */}
            <select
              value={selectedNetwork}
              onChange={(e) => setNetwork(e.target.value as "mainnet-beta" | "devnet")}
              className="hidden sm:block h-9 rounded-lg border bg-background px-3 text-sm"
            >
              <option value="mainnet-beta">Mainnet</option>
              <option value="devnet">Devnet</option>
            </select>

            {/* User info (if Privy) */}
            {connected && privyUser && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm">
                <User className="h-4 w-4" />
                <span className="max-w-[100px] truncate">
                  {privyUser.email || publicKey?.slice(0, 8) + "..."}
                </span>
              </div>
            )}

            {/* Wallet button */}
            <WalletButton />

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <nav className="flex flex-col gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
              {/* Mobile network selector */}
              <div className="px-4 py-3">
                <select
                  value={selectedNetwork}
                  onChange={(e) =>
                    setNetwork(e.target.value as "mainnet-beta" | "devnet")
                  }
                  className="w-full h-10 rounded-lg border bg-background px-3 text-sm"
                >
                  <option value="mainnet-beta">Mainnet</option>
                  <option value="devnet">Devnet</option>
                </select>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
