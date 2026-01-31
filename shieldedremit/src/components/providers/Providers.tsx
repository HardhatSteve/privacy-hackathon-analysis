"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyWalletProvider } from "./PrivyProvider";
import { WalletProvider } from "./WalletProvider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Check if Privy is configured
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Create QueryClient inside component to avoid SSR issues
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30000, // 30 seconds
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Use Privy if configured, otherwise fall back to standard wallet adapter
  const WalletProviderComponent = PRIVY_APP_ID
    ? PrivyWalletProvider
    : WalletProvider;

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProviderComponent>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </WalletProviderComponent>
    </QueryClientProvider>
  );
}
