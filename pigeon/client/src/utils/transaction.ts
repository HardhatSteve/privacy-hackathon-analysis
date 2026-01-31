import type { WalletContextState } from "@solana/wallet-adapter-react";
import type { Connection, Transaction } from "@solana/web3.js";

/**
 * Options for transaction sending with retry logic
 */
export interface SendTransactionOptions {
    /** Maximum number of retry attempts (default: 3) */
    maxAttempts?: number;
    /** Skip preflight simulation (default: true for retries) */
    skipPreflight?: boolean;
    /** Max retries per attempt (default: 3) */
    maxRetries?: number;
}

/**
 * Errors that are safe to retry (network/timing issues)
 */
const RETRYABLE_ERROR_PATTERNS = [
    "blockhash",
    "block height",
    "timeout",
] as const;

/**
 * Checks if an error is retryable based on its message
 */
const isRetryableError = (error: Error): boolean => {
    const message = error.message?.toLowerCase() ?? "";
    return RETRYABLE_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
};

/**
 * Sends a transaction with automatic retry logic for transient failures.
 * Handles blockhash expiration and network timeouts gracefully.
 *
 * @param wallet - Connected wallet context
 * @param connection - Solana RPC connection
 * @param transaction - Transaction to send
 * @param options - Optional retry configuration
 * @returns Transaction signature
 * @throws Error if all retry attempts fail
 */
export async function sendTransactionWithRetry(
    wallet: WalletContextState,
    connection: Connection,
    transaction: Transaction,
    options: SendTransactionOptions = {}
): Promise<string> {
    const { maxAttempts = 3, skipPreflight = true, maxRetries = 3 } = options;

    if (!wallet.publicKey || !wallet.sendTransaction) {
        throw new Error("Wallet not connected");
    }

    let attempts = 0;
    let lastError: Error | undefined;

    while (attempts < maxAttempts) {
        try {
            attempts++;

            // Use wallet.sendTransaction - handles blockhash internally
            const signature = await wallet.sendTransaction(transaction, connection, {
                skipPreflight,
                maxRetries,
            });

            // Wait for confirmation with fresh blockhash
            const latestBlockhash = await connection.getLatestBlockhash("confirmed");
            await connection.confirmTransaction(
                {
                    signature,
                    ...latestBlockhash,
                },
                "confirmed"
            );

            return signature;
        } catch (error) {
            lastError = error as Error;

            if (isRetryableError(lastError) && attempts < maxAttempts) {
                console.log(
                    `Transaction failed, retrying (${attempts}/${maxAttempts})...`
                );
                // Brief delay before retry
                await new Promise((resolve) => setTimeout(resolve, 1000));
                continue;
            }

            throw lastError;
        }
    }

    throw lastError ?? new Error("Failed to send transaction after retries");
}
