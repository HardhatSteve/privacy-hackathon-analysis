// @ts-nocheck
import {
    createRpc,
    defaultTestStateTreeAccounts,
    bn,
} from "@lightprotocol/stateless.js";
import {
    CompressedTokenProgram,
    selectMinCompressedTokenAccountsForTransfer,
} from "@lightprotocol/compressed-token";
import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
} from "@solana/web3.js";
import { BN, Provider, Wallet } from "@coral-xyz/anchor";

export class StealthRails {
    connection: Connection;
    wallet: Wallet; // Anchor wallet wrapper or similar
    provider: any;

    constructor(connection: Connection, wallet: any) {
        this.connection = connection;
        this.wallet = wallet;
        // Basic provider setup - in a real app might use a more robust Provider
        this.provider = {
            connection,
            publicKey: wallet.publicKey,
            sendAndConfirm: async (tx: Transaction, signers?: Keypair[]) => {
                tx.feePayer = wallet.publicKey;
                tx.recentBlockhash = (
                    await connection.getLatestBlockhash()
                ).blockhash;
                const signedTx = await wallet.signTransaction(tx);
                if (signers) {
                    signers.forEach((kp) => signedTx.partialSign(kp));
                }
                const sig = await connection.sendRawTransaction(signedTx.serialize());
                await connection.confirmTransaction(sig);
                return sig;
            },
        };
    }

    /**
     * Shield SOL or SPL tokens.
     * Converts public tokens to private (compressed) tokens.
     */
    async shield(
        mint: PublicKey,
        amount: number,
        decimals: number = 9
    ): Promise<string> {
        const amountBN = bn(amount * 10 ** decimals);

        // 1. Create Shield Instruction
        const testStateTreeAccounts = defaultTestStateTreeAccounts();

        // For simplicity using default/devnet configuration if possible.
        // In a real hackathon setting we often need to lookup the Merkle Tree accounts.
        // CompressedTokenProgram.shield handles the complexity.

        // @ts-ignore
        const shieldIx = await CompressedTokenProgram.shield({
            payer: this.wallet.publicKey,
            mint,
            amount: amountBN,
            tokenOwner: this.wallet.publicKey, // Shield to self
            // ...testStateTreeAccounts // In mainnet/devnet this needs to be specific
        });

        const tx = new Transaction().add(shieldIx);

        // 2. Send Transaction
        const signature = await this.provider.sendAndConfirm(tx, []);
        return signature;
    }

    /**
     * Private Transfer.
     * Sends shielded tokens to another address.
     */
    async privateTransfer(
        mint: PublicKey,
        amount: number,
        recipient: PublicKey,
        decimals: number = 9
    ): Promise<string> {
        const amountBN = bn(amount * 10 ** decimals);

        // 1. Fetch user's compressed token accounts
        // This requires an RPC that supports Light Protocol indexing
        // For hackathon, we assume the connection URL is a Helius/Light RPC

        const compressedAccounts = await this.getCompressedAccounts(mint);

        // @ts-ignore
        const [inputAccounts, _] = selectMinCompressedTokenAccountsForTransfer(
            compressedAccounts,
            amountBN
        );

        // 2. Build Transfer Instruction
        // @ts-ignore
        const transferIx = await CompressedTokenProgram.transfer({
            payer: this.wallet.publicKey,
            inputCompressedTokenAccounts: inputAccounts,
            toAddress: recipient,
            amount: amountBN,
            mint
        });

        const tx = new Transaction().add(transferIx);

        // 3. Send
        return await this.provider.sendAndConfirm(tx, []);
    }

    /**
     * Reveal / Unshield.
     * Converts private tokens back to public.
     */
    async unshield(
        mint: PublicKey,
        amount: number,
        decimals: number = 9
    ): Promise<string> {
        const amountBN = bn(amount * 10 ** decimals);
        const compressedAccounts = await this.getCompressedAccounts(mint);

        // @ts-ignore
        const [inputAccounts, _] = selectMinCompressedTokenAccountsForTransfer(
            compressedAccounts,
            amountBN
        );

        // @ts-ignore
        const unshieldIx = await CompressedTokenProgram.unshield({
            payer: this.wallet.publicKey,
            inputCompressedTokenAccounts: inputAccounts,
            amount: amountBN,
            mint,
            toAddress: this.wallet.publicKey // Unshield to self
        });

        const tx = new Transaction().add(unshieldIx);
        return await this.provider.sendAndConfirm(tx, []);
    }

    async getCompressedAccounts(mint: PublicKey): Promise<any[]> {
        // Wrapper to fetch accounts from Light RPC
        // In a real implementation this calls connection.getCompressedTokenAccountsByOwner(owner, { mint })
        // But standard web3.js doesn't have this, so we use Light's createRpc or raw call
        const rpc = createRpc(this.connection.rpcEndpoint);
        // @ts-ignore - Dynamic dispatch to Light RPC which might differ in types
        const accounts = await rpc.getCompressedTokenAccountsByOwner(
            this.wallet.publicKey,
            { mint }
        );
        return accounts.items;
    }
}
