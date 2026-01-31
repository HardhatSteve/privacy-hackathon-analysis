"use client";

import { useCallback, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useWalletStore } from "@/stores/walletStore";
import { TOKEN_ADDRESSES } from "@/types";

// Token account layout for SPL tokens
const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

export function useBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { balance, balanceLoading, setBalance, setBalanceLoading } =
    useWalletStore();

  const fetchBalance = useCallback(async () => {
    if (!publicKey) {
      setBalance({ sol: 0, usdc: 0, usdt: 0, usd1: 0, bonk: 0, aol: 0, radr: 0, ore: 0 });
      return;
    }

    setBalanceLoading(true);

    try {
      // Fetch SOL balance
      const solBalance = await connection.getBalance(publicKey);
      const solAmount = solBalance / LAMPORTS_PER_SOL;

      // Fetch SPL token balances
      let usdcBalance = 0;
      let usdtBalance = 0;
      let usd1Balance = 0;
      let bonkBalance = 0;
      let aolBalance = 0;
      let radrBalance = 0;
      let oreBalance = 0;

      try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: TOKEN_PROGRAM_ID }
        );

        for (const account of tokenAccounts.value) {
          const parsedInfo = account.account.data.parsed?.info;
          if (!parsedInfo) continue;

          const mintAddress = parsedInfo.mint;
          const tokenAmount = parsedInfo.tokenAmount;

          if (mintAddress === TOKEN_ADDRESSES.USDC) {
            usdcBalance = tokenAmount.uiAmount || 0;
          } else if (mintAddress === TOKEN_ADDRESSES.USDT) {
            usdtBalance = tokenAmount.uiAmount || 0;
          } else if (mintAddress === TOKEN_ADDRESSES.USD1) {
            usd1Balance = tokenAmount.uiAmount || 0;
          } else if (mintAddress === TOKEN_ADDRESSES.BONK) {
            bonkBalance = tokenAmount.uiAmount || 0;
          } else if (mintAddress === TOKEN_ADDRESSES.AOL) {
            aolBalance = tokenAmount.uiAmount || 0;
          } else if (mintAddress === TOKEN_ADDRESSES.RADR) {
            radrBalance = tokenAmount.uiAmount || 0;
          } else if (mintAddress === TOKEN_ADDRESSES.ORE) {
            oreBalance = tokenAmount.uiAmount || 0;
          }
        }
      } catch (tokenError) {
        console.error("Error fetching token balances:", tokenError);
      }

      setBalance({
        sol: solAmount,
        usdc: usdcBalance,
        usdt: usdtBalance,
        usd1: usd1Balance,
        bonk: bonkBalance,
        aol: aolBalance,
        radr: radrBalance,
        ore: oreBalance,
      });
    } catch (error) {
      console.error("Error fetching balance:", error);
    } finally {
      setBalanceLoading(false);
    }
  }, [connection, publicKey, setBalance, setBalanceLoading]);

  // Fetch balance on mount and when publicKey changes
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Set up balance refresh interval
  useEffect(() => {
    if (!publicKey) return;

    const interval = setInterval(fetchBalance, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [publicKey, fetchBalance]);

  return {
    balance,
    loading: balanceLoading,
    refresh: fetchBalance,
  };
}
