import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { useProgram } from "./useProgram";
import { sendTransactionWithRetry } from "../utils/transaction";

export const useUserRegistry = () => {
    const wallet = useWallet();
    const { getProgram, connection } = useProgram();

    const getUserAccountPda = useCallback((userPubkey: PublicKey) => {
        const program = getProgram();
        const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from("user"), userPubkey.toBuffer()],
            program.programId
        );
        return pda;
    }, [getProgram]);

    const registerUser = useCallback(
        async (encryptionKey: Uint8Array) => {
            if (!wallet.publicKey) throw new Error("Wallet not connected");

            const program = getProgram();
            const encryptionKeyPubkey = new PublicKey(encryptionKey); // 32 bytes

            const ix = await program.methods
                .registerUser(encryptionKeyPubkey)
                .accounts({
                    authority: wallet.publicKey,
                })
                .instruction();

            const tx = new anchor.web3.Transaction().add(ix);
            const signature = await sendTransactionWithRetry(wallet, connection, tx);

            console.log("✅ User registered:", signature);
            return signature;
        },
        [wallet, connection, getProgram, getUserAccountPda]
    );

    const getUserEncryptionKey = useCallback(
        async (userAddress: string): Promise<Uint8Array | null> => {
            const program = getProgram();
            const userPubkey = new PublicKey(userAddress);
            const pda = getUserAccountPda(userPubkey);

            try {
                const account = await program.account.userAccount.fetch(pda);
                // encryptionPubkey is stored as PublicKey in the account
                return account.encryptionPubkey.toBytes();
            } catch (e: any) {
                if (e.message?.includes("Account does not exist")) {
                    return null;
                }
                console.error("Failed to fetch user:", e);
                return null;
            }
        },
        [getProgram, getUserAccountPda]
    );

    return {
        registerUser,
        getUserEncryptionKey,
        getUserAccountPda,
    };
};
