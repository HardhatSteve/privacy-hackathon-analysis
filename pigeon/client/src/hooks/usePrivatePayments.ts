import { useCallback, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";

import {
    isPrivateTransfersAvailable,
    lamportsToSol,
} from "../utils/magicblock";
import { sendTransactionWithRetry } from "../utils/transaction";

export interface TipResult {
    signature: string;
    isPrivate: boolean;
    amount: number;
    recipient: string;
}

// Minimum tip amount in lamports (~0.000005 SOL)
const MIN_TIP_LAMPORTS = 5000;

// Hook for sending SOL tips to chat participants.
// Currently uses standard Solana transfers.
// Will upgrade to MagicBlock PER private transfers.

export const usePrivatePayments = () => {
    const wallet = useWallet();
    const { connection } = useConnection();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendTip = useCallback(
        async (
            recipientAddress: string,
            amountLamports: number
        ): Promise<TipResult> => {
            if (!wallet.publicKey || !wallet.signTransaction) {
                throw new Error("Wallet not connected");
            }

            if (amountLamports <= 0) {
                throw new Error("Amount must be greater than 0");
            }

            if (amountLamports < MIN_TIP_LAMPORTS) {
                throw new Error(
                    `Minimum tip amount is ${lamportsToSol(MIN_TIP_LAMPORTS)} SOL`
                );
            }

            setIsLoading(true);
            setError(null);

            try {
                const recipient = new PublicKey(recipientAddress);

                // Check if recipient is the sender
                if (recipient.equals(wallet.publicKey)) {
                    throw new Error("Cannot tip yourself");
                }

                // Check balance
                const balance = await connection.getBalance(wallet.publicKey);
                const requiredBalance = amountLamports + 5000; // Include fee estimate
                if (balance < requiredBalance) {
                    throw new Error(
                        `Insufficient balance. You have ${lamportsToSol(balance)} SOL, ` +
                        `need ${lamportsToSol(requiredBalance)} SOL`
                    );
                }

                // Check if private transfers are available
                const isPrivate = isPrivateTransfersAvailable();

                if (isPrivate) {
                    // TODO: Implement MagicBlock PER transfer when API is available
                    throw new Error("Private transfers not yet available");
                }

                // Build standard SOL transfer transaction
                const tx = new Transaction().add(
                    SystemProgram.transfer({
                        fromPubkey: wallet.publicKey,
                        toPubkey: recipient,
                        lamports: amountLamports,
                    })
                );

                const signature = await sendTransactionWithRetry(
                    wallet,
                    connection,
                    tx
                );

                console.log(
                    `💰 Tip sent: ${lamportsToSol(amountLamports)} SOL to ${recipientAddress.slice(0, 8)}...`
                );
                console.log(`   Signature: ${signature}`);

                return {
                    signature,
                    isPrivate,
                    amount: amountLamports,
                    recipient: recipientAddress,
                };
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : "Failed to send tip";
                setError(errorMessage);
                throw new Error(errorMessage);
            } finally {
                setIsLoading(false);
            }
        },
        [wallet, connection]
    );

    const getBalance = useCallback(async (): Promise<number> => {
        if (!wallet.publicKey) {
            throw new Error("Wallet not connected");
        }
        return connection.getBalance(wallet.publicKey);
    }, [wallet.publicKey, connection]);

    // Check if private transfers are available.
    const checkPrivateAvailability = useCallback((): boolean => {
        return isPrivateTransfersAvailable();
    }, []);

    const clearError = useCallback(() => setError(null), []);

    return {
        sendTip,
        getBalance,
        checkPrivateAvailability,
        isLoading,
        error,
        clearError,
    };
};
