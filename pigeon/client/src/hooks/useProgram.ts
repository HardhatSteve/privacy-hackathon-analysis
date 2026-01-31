import { useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import * as anchor from "@coral-xyz/anchor";
import idl from "../solana_program.json";
import type { PigeonProgram } from "../types/pigeon_program";

// Custom hook to get the Anchor program instance
export const useProgram = () => {
  const wallet = useWallet();
  const { connection } = useConnection();

  const getProgram = useCallback(() => {
    if (!wallet.publicKey) throw new Error("Wallet not connected");

    // We can cast the provider to AnchorProvider for type safety
    const provider = new anchor.AnchorProvider(
      connection,
      wallet as unknown as anchor.Wallet,
      {
        preflightCommitment: "processed",
        commitment: "processed",
        skipPreflight: false,
      }
    );

    // Return strongly typed program
    return new anchor.Program(idl as any, provider) as anchor.Program<PigeonProgram>;
  }, [wallet, connection]);

  return { getProgram, connection };
};
