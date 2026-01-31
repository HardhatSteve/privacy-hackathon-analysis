import { PublicKey, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { AnchorProvider } from '@coral-xyz/anchor';
import { TOKENS } from './constants';
import { getProgram, fetchUserBalance } from './program';

// Dark Pool Vault Address (matcher wallet - handles deposits and withdrawals)
// This must match the matcher service wallet for withdrawals to work
export const VAULT_ADDRESS = new PublicKey('4StfvjsDX8bNZ29tHtwRbhuGMp2wjBARh7xwKuCVKViJ');

// Get dark pool balance for a wallet (on-chain user balance PDA)
export async function getDarkPoolBalance(
  connection: Connection,
  owner: PublicKey
): Promise<{ sol: number; usdc: number }> {
  const readonlyWallet = {
    publicKey: owner,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any[]) => txs,
  };
  const provider = new AnchorProvider(connection, readonlyWallet as any, {
    commitment: 'confirmed',
  });
  const program = getProgram(provider);
  const balance = await fetchUserBalance(program, owner);
  if (!balance) {
    return { sol: 0, usdc: 0 };
  }
  return {
    sol: balance.solBalance / LAMPORTS_PER_SOL,
    usdc: balance.usdcBalance / Math.pow(10, TOKENS.USDC.decimals),
  };
}

// Get actual vault balance on-chain (total pool balance)
export async function getVaultBalance(connection: Connection): Promise<{ sol: number; usdc: number }> {
  try {
    const solBalance = await connection.getBalance(VAULT_ADDRESS);
    let usdcBalance = 0;
    try {
      const usdcMint = TOKENS.USDC.mint;
      if (usdcMint) {
        const ata = await getAssociatedTokenAddress(usdcMint, VAULT_ADDRESS);
        const account = await getAccount(connection, ata);
        usdcBalance = Number(account.amount) / Math.pow(10, TOKENS.USDC.decimals);
      }
    } catch {
      // Token account doesn't exist
    }

    return {
      sol: solBalance / LAMPORTS_PER_SOL,
      usdc: usdcBalance,
    };
  } catch (error) {
    console.error('Failed to get vault balance:', error);
    return { sol: 0, usdc: 0 };
  }
}
