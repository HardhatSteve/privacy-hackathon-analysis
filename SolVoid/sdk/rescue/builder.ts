import {
    TransactionMessage,
    TransactionInstruction,
    VersionedTransaction,
    PublicKey,
    Connection,
    SystemProgram,
    LAMPORTS_PER_SOL,
    ComputeBudgetProgram
} from '@solana/web3.js';
import {
    TOKEN_PROGRAM_ID,
    Token,
    ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { PrivacyShield } from '../privacy/shield';
import { LeakedAsset } from './analyzer';
import { EventBus } from '../events/bus';
import {
    Unit
} from '../integrity';

export interface RescueOptions {
    readonly useJito?: boolean;
    readonly jitoTipLamports?: number;
    readonly useShadowRPC?: boolean;
    readonly priorityFee?: number;
}

const JITO_TIP_ACCOUNTS: readonly string[] = [
    '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
    'HFqU5x63VTqvQss8hp11i4bVEWH5GBF7dSprRSQmAPP1',
    'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
    'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
    'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
    'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
    'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
    '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT'
];

export class RescueBuilder {
    private readonly shield: PrivacyShield;
    private readonly connection: Connection;

    constructor(connection: Connection, shield: PrivacyShield) {
        this.connection = connection;
        this.shield = shield;
    }

    public async buildAtomicRescueTx(
        payer: PublicKey,
        leakedAssets: readonly LeakedAsset[],
        options: RescueOptions = {}
    ): Promise<VersionedTransaction> {
        EventBus.info(`Building atomic rescue for ${leakedAssets.length} assets...`);

        const instructions: TransactionInstruction[] = [];
        const commitments: { readonly mint: string; readonly commitment: string }[] = [];

        if (options.priorityFee || options.useJito) {
            const fee = options.priorityFee || 100000;
            instructions.push(
                ComputeBudgetProgram.setComputeUnitPrice({
                    microLamports: fee
                })
            );
            EventBus.info(`Priority fee set: ${fee} microLamports`);
        }

        if (options.useJito) {
            const tipIx = await this.buildJitoTip(payer, options.jitoTipLamports);
            instructions.push(tipIx);
            EventBus.info(`Jito tip added: ${(options.jitoTipLamports || 10000) / LAMPORTS_PER_SOL} SOL`, { units: Unit.SOL });
        }

        for (const asset of leakedAssets) {
            EventBus.info(`Processing rescue for ${asset.isNative ? 'SOL' : asset.mint.slice(0, 8)}...`);

            const commitmentData = await this.shield.generateCommitment(asset.amount);
            commitments.push({
                mint: asset.mint,
                commitment: commitmentData.commitmentHex
            });

            const [vaultPDA] = PublicKey.findProgramAddressSync(
                [Buffer.from('vault')],
                this.shield.getProgramId()
            );
            const [statePDA] = PublicKey.findProgramAddressSync(
                [Buffer.from('state')],
                this.shield.getProgramId()
            );

            if (asset.isNative) {
                const depositIx = await this.buildSOLDepositInstruction(
                    payer,
                    vaultPDA,
                    statePDA,
                    Buffer.from(commitmentData.commitmentHex, 'hex'),
                    asset.amount
                );
                instructions.push(depositIx);
            } else {
                const tokenIxs = await this.buildTokenDepositInstructions(
                    payer,
                    vaultPDA,
                    statePDA,
                    new PublicKey(asset.mint),
                    asset.ataAddress ? new PublicKey(asset.ataAddress) : undefined,
                    Buffer.from(commitmentData.commitmentHex, 'hex'),
                    asset.amount
                );
                instructions.push(...tokenIxs);
            }
        }

        const { blockhash } = await this.connection.getLatestBlockhash('finalized');

        const messageV0 = new TransactionMessage({
            payerKey: payer,
            recentBlockhash: blockhash,
            instructions,
        }).compileToV0Message();

        const tx = new VersionedTransaction(messageV0);

        EventBus.info(`Rescue transaction built: ${instructions.length} instructions`);
        EventBus.emit('COMMITMENT_CREATED', `Multi-asset rescue prepared`, {
            assetCount: leakedAssets.length,
            commitments: commitments.length,
            useJito: options.useJito
        });

        return tx;
    }

    private async buildSOLDepositInstruction(
        payer: PublicKey,
        vaultPDA: PublicKey,
        statePDA: PublicKey,
        commitment: Buffer,
        amount: number
    ): Promise<TransactionInstruction> {
        return new TransactionInstruction({
            keys: [
                { pubkey: statePDA, isSigner: false, isWritable: true },
                { pubkey: payer, isSigner: true, isWritable: true },
                { pubkey: vaultPDA, isSigner: false, isWritable: true },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
            ],
            programId: this.shield.getProgramId(),
            data: Buffer.concat([
                Buffer.from([1]),
                commitment,
                Buffer.from(new BigUint64Array([BigInt(amount)]).buffer)
            ])
        });
    }

    private async buildTokenDepositInstructions(
        payer: PublicKey,
        vaultPDA: PublicKey,
        statePDA: PublicKey,
        mint: PublicKey,
        sourceATA: PublicKey | undefined,
        commitment: Buffer,
        amount: number
    ): Promise<TransactionInstruction[]> {
        const instructions: TransactionInstruction[] = [];

        const vaultATA = await Token.getAssociatedTokenAddress(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            mint,
            vaultPDA,
            true
        );

        const vaultATAInfo = await this.connection.getAccountInfo(vaultATA);
        if (!vaultATAInfo) {
            instructions.push(
                Token.createAssociatedTokenAccountInstruction(
                    ASSOCIATED_TOKEN_PROGRAM_ID,
                    TOKEN_PROGRAM_ID,
                    mint,
                    vaultATA,
                    vaultPDA,
                    payer
                )
            );
        }

        if (!sourceATA) {
            sourceATA = await Token.getAssociatedTokenAddress(
                ASSOCIATED_TOKEN_PROGRAM_ID,
                TOKEN_PROGRAM_ID,
                mint,
                payer
            );
        }

        instructions.push(
            Token.createTransferInstruction(
                TOKEN_PROGRAM_ID,
                sourceATA,
                vaultATA,
                payer,
                [],
                amount
            )
        );

        instructions.push(new TransactionInstruction({
            keys: [
                { pubkey: statePDA, isSigner: false, isWritable: true },
                { pubkey: payer, isSigner: true, isWritable: true },
                { pubkey: mint, isSigner: false, isWritable: false },
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
            ],
            programId: this.shield.getProgramId(),
            data: Buffer.concat([
                Buffer.from([2]),
                commitment,
                mint.toBuffer()
            ])
        }));

        return instructions;
    }

    private async buildJitoTip(
        payer: PublicKey,
        tipLamports: number = 10000
    ): Promise<TransactionInstruction> {
        const tipAccountIndex = Math.floor(Math.random() * JITO_TIP_ACCOUNTS.length);
        const tipAccountStr = JITO_TIP_ACCOUNTS[tipAccountIndex];
        if (!tipAccountStr) throw new Error("Invalid tip account index");

        const tipAccount = new PublicKey(tipAccountStr);

        EventBus.info(`Jito tip account selected: ${tipAccount.toBase58().slice(0, 8)}...`);

        return SystemProgram.transfer({
            fromPubkey: payer,
            toPubkey: tipAccount,
            lamports: tipLamports
        });
    }

    public async submitJitoBundle(
        transactions: VersionedTransaction[]
    ): Promise<{ readonly bundleId: string; readonly status: string }> {
        EventBus.info(`Submitting ${transactions.length} transactions to Jito...`);

        const JITO_BUNDLE_API = 'https://mainnet.block-engine.jito.wtf/api/v1/bundles';

        try {
            const serializedTxs = transactions.map(tx =>
                Buffer.from(tx.serialize()).toString('base64')
            );

            const response = await fetch(JITO_BUNDLE_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'sendBundle',
                    params: [serializedTxs]
                })
            });

            const result = (await response.json()) as any;

            if (result.error) {
                throw new Error(result.error.message);
            }

            const bundleId = result.result;
            EventBus.relayBroadcast(1, bundleId);
            EventBus.info(`Jito bundle submitted: ${bundleId}`);

            return {
                bundleId,
                status: 'SUBMITTED'
            };
        } catch (error) {
            EventBus.error(`Jito submission failed: ${(error as Error).message}`);
            throw error;
        }
    }
}
