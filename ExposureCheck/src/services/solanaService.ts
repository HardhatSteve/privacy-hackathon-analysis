import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import type { TransactionData, TokenBalance, SocialLinks, WalletAge } from '../types/exposure';

const HELIUS_RPC = 'https://mainnet.helius-rpc.com/?api-key=1d8740dc-e5f4-421c-b823-e1bad1889eff';
const connection = new Connection(HELIUS_RPC, 'confirmed');

export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return address.length >= 32 && address.length <= 44;
  } catch {
    return false;
  }
}

export async function getSolBalance(address: string): Promise<number> {
  const pubkey = new PublicKey(address);
  const balance = await connection.getBalance(pubkey);
  return balance / LAMPORTS_PER_SOL;
}

export async function getTransactionHistory(
  address: string,
  limit: number = 100
): Promise<TransactionData[]> {
  const pubkey = new PublicKey(address);
  const signatures = await connection.getSignaturesForAddress(pubkey, { limit });

  return signatures.map((sig) => ({
    signature: sig.signature,
    blockTime: sig.blockTime,
    slot: sig.slot,
    err: sig.err,
  }));
}

export async function getTokenBalances(address: string): Promise<TokenBalance[]> {
  const pubkey = new PublicKey(address);

  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, {
    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
  });

  return tokenAccounts.value
    .map((account) => {
      const info = account.account.data.parsed.info;
      return {
        mint: info.mint,
        amount: parseInt(info.tokenAmount.amount),
        decimals: info.tokenAmount.decimals,
        uiAmount: info.tokenAmount.uiAmount || 0,
      };
    })
    .filter((token) => token.uiAmount > 0);
}

export async function getSnsNames(address: string): Promise<string[]> {
  // Check for .sol domains via Bonfida SNS
  // This is a simplified check - in production would use SNS SDK
  try {
    const response = await fetch(
      `https://sns-sdk-proxy.bonfida.workers.dev/favorite-domain/${address}`
    );
    if (response.ok) {
      const data = await response.json();
      if (data.result) {
        return [data.result + '.sol'];
      }
    }
  } catch {
    // SNS lookup failed, continue without
  }

  return [];
}

// Simplified social links for frontend fallback - full implementation is on backend
export async function getSocialLinks(address: string): Promise<SocialLinks> {
  const snsNames = await getSnsNames(address);
  return {
    snsNames,
    allDomains: [],
    web3BioProfiles: [],
  };
}

export function getWalletAge(transactions: TransactionData[]): WalletAge {
  const txWithTime = transactions.filter((tx) => tx.blockTime);

  if (txWithTime.length === 0) {
    return { firstTxTime: null, ageInDays: null, isNew: true };
  }

  const oldestTx = txWithTime[txWithTime.length - 1];
  const firstTxTime = oldestTx.blockTime!;
  const ageInDays = Math.floor((Date.now() / 1000 - firstTxTime) / (24 * 60 * 60));

  return {
    firstTxTime,
    ageInDays,
    isNew: ageInDays < 30,
  };
}
