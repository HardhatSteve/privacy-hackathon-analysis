"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, ChevronDown } from "lucide-react";
import { useWalletStore } from "@/stores/walletStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PrivyWalletButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { connected, publicKey, privyUser } = useWalletStore();

  if (!ready) {
    return (
      <Button disabled className="gap-2">
        <Wallet className="h-4 w-4" />
        Loading...
      </Button>
    );
  }

  if (!authenticated) {
    return (
      <Button onClick={login} className="gap-2">
        <Wallet className="h-4 w-4" />
        Connect
      </Button>
    );
  }

  const displayAddress = publicKey
    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : "No wallet";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wallet className="h-4 w-4" />
          {displayAddress}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">Connected Wallet</p>
          <p className="text-xs text-muted-foreground font-mono truncate">
            {publicKey}
          </p>
        </div>
        {privyUser?.email && (
          <div className="px-2 py-1.5 border-t">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm truncate">{privyUser.email}</p>
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            if (publicKey) {
              navigator.clipboard.writeText(publicKey);
            }
          }}
        >
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            window.open(
              `https://solscan.io/account/${publicKey}`,
              "_blank"
            )
          }
        >
          View on Solscan
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={logout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
