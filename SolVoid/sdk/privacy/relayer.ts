import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
} from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import express, { Request, Response } from 'express';

/**
 * Privacy Relayer
 * Facilitates gasless (for the user) and unlinkable withdrawals.
 */
export class PrivacyRelayer {
    private relayerKeypair: Keypair;
    private program: Program;

    constructor(
        connection: Connection,
        relayerSecretKey: Uint8Array,
        _programId: string,
        idl: any
    ) {
        this.relayerKeypair = Keypair.fromSecretKey(relayerSecretKey);
        const wallet = new Wallet(this.relayerKeypair);
        const provider = new AnchorProvider(connection, wallet, {
            preflightCommitment: 'confirmed',
        });
        this.program = new Program(idl, provider);
    }

    public async start(port: number = 3000) {
        const app = express();
        app.use(express.json());

        app.post('/withdraw', async (req: Request, res: Response) => {
            try {
                const { nullifierHash, root, proof, recipient } = req.body;

                const [vaultPda] = PublicKey.findProgramAddressSync(
                    [Buffer.from('vault')],
                    this.program.programId
                );

                const [statePda] = PublicKey.findProgramAddressSync(
                    [Buffer.from('state')],
                    this.program.programId
                );

                const tx = await this.program.methods
                    .withdraw(nullifierHash, root, proof)
                    .accounts({
                        state: statePda,
                        vault: vaultPda,
                        recipient: new PublicKey(recipient),
                        relayer: this.relayerKeypair.publicKey,
                        systemProgram: SystemProgram.programId,
                    } as any)
                    .signers([this.relayerKeypair])
                    .rpc();

                res.json({ success: true, txid: tx });
            } catch (error) {
                console.error('Relayer error:', error);
                res.status(500).json({ success: false, error: 'Withdrawal failed' });
            }
        });

        app.listen(port, () => {
            console.log(`Privacy Relayer running on port ${port}`);
        });
    }
}
