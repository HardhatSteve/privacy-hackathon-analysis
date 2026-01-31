import {
    Connection,
    PublicKey,
    SystemProgram,
} from '@solana/web3.js';
import { Buffer } from 'buffer';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor/dist/esm';
import * as crypto from 'crypto';
import { PoseidonHasher, PoseidonUtils } from '../crypto/poseidon';
import { WalletAdapter } from '../client';
import { z } from 'zod';
import {
    IdlSchema,
    enforce,
    DataOrigin,
    DataTrust,
    CommitmentDataSchema,
    MerkleProofSchema
} from '../integrity';

const MERKLE_TREE_DEPTH = 20;

// type for commitment data, verified via zod
export type CommitmentData = z.infer<typeof CommitmentDataSchema>;

// type for merkle proofs
export type MerkleProof = z.infer<typeof MerkleProofSchema>;

export class PrivacyShield {
    private readonly program: Program<any>;
    private programId?: PublicKey;

    constructor(connection: Connection, idlIn: unknown, wallet: WalletAdapter, programId?: string) {
        // IDL validation. dont want a garbage idl breaking things later.
        const idl = enforce(IdlSchema, idlIn, {
            origin: DataOrigin.INTERNAL_LOGIC,
            trust: DataTrust.TRUSTED,
            createdAt: Date.now(),
            owner: 'PrivacyShield'
        }).value as any;

        // fix missing address in idl if needed
        if (programId && !idl.address) {
            idl.address = programId;
        }

        // buffer polyfills for browser support. what a mess.
        if (typeof globalThis !== 'undefined' && !globalThis.Buffer) {
            globalThis.Buffer = Buffer;
        }
        if (typeof window !== 'undefined' && !(window as any).Buffer) {
            (window as any).Buffer = Buffer;
        }
        if (typeof global !== 'undefined' && !global.Buffer) {
            global.Buffer = Buffer;
        }

        const provider = new AnchorProvider(connection, wallet as any, {
            preflightCommitment: 'confirmed',
        });

        // Create program synchronously but with Buffer polyfill ensured
        this.program = new Program(idl, provider);

        if (programId) {
            this.programId = new PublicKey(programId);
        }
    }

    public getProgramId(): PublicKey {
        return this.programId || this.program.programId;
    }

    // poseidon hashing helper
    private async poseidonHash(left: Buffer, right: Buffer): Promise<Buffer> {
        return await PoseidonHasher.hashTwoInputs(left, right);
    }

    public async initialize(authority: PublicKey): Promise<string> {
        const [statePda] = PublicKey.findProgramAddressSync([Buffer.from('state')], this.getProgramId());

        return await (this.program.methods as any)
            .initialize(authority)
            .accounts({
                state: statePda,
                authority: this.program.provider.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();
    }

    public async initializeVerifier(vk: any): Promise<string> {
        const [statePda] = PublicKey.findProgramAddressSync([Buffer.from('state')], this.getProgramId());
        const [verifierPda] = PublicKey.findProgramAddressSync([Buffer.from('verifier'), statePda.toBuffer()], this.getProgramId());

        return await (this.program.methods as any)
            .initializeVerifier(vk)
            .accounts({
                verifierState: verifierPda,
                state: statePda,
                authority: this.program.provider.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();
    }

    public async initializeRootHistory(): Promise<string> {
        const [rootHistoryPda] = PublicKey.findProgramAddressSync([Buffer.from('root_history')], this.getProgramId());

        return await (this.program.methods as any)
            .initializeRootHistory()
            .accounts({
                rootHistory: rootHistoryPda,
                authority: this.program.provider.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();
    }


    public async initializeEconomics(): Promise<string> {
        const [economicPda] = PublicKey.findProgramAddressSync([Buffer.from('economic_state')], this.getProgramId());

        return await (this.program.methods as any)
            .initializeEconomics()
            .accounts({
                economicState: economicPda,
                authority: this.program.provider.publicKey,
                systemProgram: SystemProgram.programId,
            })
            .rpc();
    }

    public async triggerEmergencyMode(multiplier: bigint, reason: string): Promise<string> {
        const [statePda] = PublicKey.findProgramAddressSync([Buffer.from('state')], this.getProgramId());
        const [economicPda] = PublicKey.findProgramAddressSync([Buffer.from('economic_state')], this.getProgramId());

        return await (this.program.methods as any)
            .triggerEmergencyMode(new BN(multiplier.toString()), reason)
            .accounts({
                state: statePda,
                economicState: economicPda,
                authority: this.program.provider.publicKey,
            })
            .rpc();
    }

    public async disableEmergencyMode(): Promise<string> {
        const [statePda] = PublicKey.findProgramAddressSync([Buffer.from('state')], this.getProgramId());
        const [economicPda] = PublicKey.findProgramAddressSync([Buffer.from('economic_state')], this.getProgramId());

        return await (this.program.methods as any)
            .disableEmergencyMode()
            .accounts({
                state: statePda,
                economicState: economicPda,
                authority: this.program.provider.publicKey,
            })
            .rpc();
    }

    public async triggerCircuitBreaker(): Promise<string> {
        const [statePda] = PublicKey.findProgramAddressSync([Buffer.from('state')], this.getProgramId());
        const [economicPda] = PublicKey.findProgramAddressSync([Buffer.from('economic_state')], this.getProgramId());

        return await (this.program.methods as any)
            .triggerCircuitBreaker()
            .accounts({
                state: statePda,
                economicState: economicPda,
                authority: this.program.provider.publicKey,
            })
            .rpc();
    }

    public async resetCircuitBreaker(): Promise<string> {
        const [statePda] = PublicKey.findProgramAddressSync([Buffer.from('state')], this.getProgramId());
        const [economicPda] = PublicKey.findProgramAddressSync([Buffer.from('economic_state')], this.getProgramId());

        return await (this.program.methods as any)
            .resetCircuitBreaker()
            .accounts({
                state: statePda,
                economicState: economicPda,
                authority: this.program.provider.publicKey,
            })
            .rpc();
    }

    public async generateCommitment(amount: number = 0): Promise<CommitmentData> {
        // secure randoms for secret/nullifier
        const secret = crypto.randomBytes(32);
        const nullifier = crypto.randomBytes(32);

        // compute hash. Poseidon(3) in the circuit.
        const commitment = await PoseidonHasher.computeCommitment(secret, nullifier, BigInt(amount));

        // Poseidon(2) with salt=1 for the nullifier hash.
        const nullifierHash = await PoseidonHasher.computeNullifierHash(nullifier);

        const dataUnvalidated = {
            secret: secret.toString('hex'),
            nullifier: nullifier.toString('hex'),
            commitment: commitment.toString('hex'),
            nullifierHash: nullifierHash.toString('hex'),
            commitmentHex: commitment.toString('hex'),
        };

        return enforce(CommitmentDataSchema, dataUnvalidated, {
            origin: DataOrigin.INTERNAL_LOGIC,
            trust: DataTrust.TRUSTED,
            createdAt: Date.now(),
            owner: 'PrivacyShield'
        }).value;
    }

    public async deposit(commitmentHex: string, amount: number): Promise<string> {
        if (!/^[0-9a-fA-F]{64}$/.test(commitmentHex)) throw new Error("Invalid commitment format");
        const commitment = Buffer.from(commitmentHex, 'hex');

        const [statePda] = PublicKey.findProgramAddressSync([Buffer.from('state')], this.getProgramId());
        const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('vault')], this.getProgramId());
        const [rootHistoryPda] = PublicKey.findProgramAddressSync([Buffer.from('root_history')], this.getProgramId());

        return await (this.program.methods as any)
            .deposit(Array.from(commitment), new BN(amount))
            .accounts({
                state: statePda,
                rootHistory: rootHistoryPda,
                depositor: this.program.provider.publicKey,
                vault: vaultPda,
                systemProgram: SystemProgram.programId,
            })
            .rpc();
    }

    // generate merkle proof for a commitment
    public async getMerkleProof(commitmentIndex: number, allCommitmentsHex: readonly string[]): Promise<MerkleProof> {
        if (commitmentIndex < 0 || commitmentIndex >= allCommitmentsHex.length) {
            throw new Error(`Commitment index ${commitmentIndex} out of range [0, ${allCommitmentsHex.length})`);
        }

        const allCommitments = allCommitmentsHex.map(c => PoseidonUtils.hexToBuffer(c));

        // zero hashes for empty branches
        const zeros: Buffer[] = [];
        let currentZero = PoseidonUtils.zeroBuffer();
        for (let i = 0; i < MERKLE_TREE_DEPTH; i++) {
            // Explicitly create new Buffer to avoid SharedArrayBuffer type issues
            const zeroCopy = Buffer.alloc(32);
            currentZero.copy(zeroCopy);
            zeros.push(zeroCopy);
            currentZero = await this.poseidonHash(currentZero, currentZero);
        }

        const proof: Buffer[] = [];
        const indices: number[] = [];
        let index = commitmentIndex;

        let nodes = [...allCommitments];

        for (let level = 0; level < MERKLE_TREE_DEPTH; level++) {
            if (index % 2 === 0) {
                const sibling = (index + 1 < nodes.length) ? (nodes[index + 1] ?? zeros[level]!) : zeros[level]!;
                // Explicitly create new Buffer to avoid type issues
                const siblingCopy = Buffer.alloc(32);
                sibling.copy(siblingCopy);
                proof.push(siblingCopy);
                indices.push(0);
            } else {
                const leftSibling = nodes[index - 1] ?? zeros[level]!;
                // Explicitly create new Buffer to avoid type issues
                const leftCopy = Buffer.alloc(32);
                leftSibling.copy(leftCopy);
                proof.push(leftCopy);
                indices.push(1);
            }

            const nextLevelNodes: Buffer[] = [];
            for (let i = 0; i < nodes.length; i += 2) {
                const left = nodes[i]!;
                const right = (i + 1 < nodes.length) ? (nodes[i + 1] ?? zeros[level]!) : zeros[level]!;

                const parent = await this.poseidonHash(left, right);
                nextLevelNodes.push(parent);
            }
            nodes = nextLevelNodes as any[];
            index = Math.floor(index / 2);
        }

        const proofData = {
            proof: proof.map(p => PoseidonUtils.bufferToHex(p)),
            indices
        };

        return enforce(MerkleProofSchema, proofData, {
            origin: DataOrigin.INTERNAL_LOGIC,
            trust: DataTrust.TRUSTED,
            createdAt: Date.now(),
            owner: 'PrivacyShield'
        }).value;
    }

    public async generateZKProof(
        secretHex: string,
        nullifierHex: string,
        rootHex: string,
        amount: number,
        recipient: PublicKey,
        relayer: PublicKey,
        fee: number,
        merklePath: MerkleProof,
        wasmPath: string,
        zkeyPath: string
    ): Promise<{ proof: any, publicSignals: any }> {
        const snarkjs = require('snarkjs');

        // Note: recipient and relayer are used as public signals for binding the proof
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            {
                root: '0x' + rootHex,
                nullifierHash: '0x' + (await PoseidonHasher.computeNullifierHash(Buffer.from(nullifierHex, 'hex'))).toString('hex'),
                recipient: '0x' + recipient.toBuffer().toString('hex'),
                relayer: '0x' + relayer.toBuffer().toString('hex'),
                fee: fee.toString(),
                amount: amount.toString(),
                secret: '0x' + secretHex,
                nullifier: '0x' + nullifierHex,
                pathElements: merklePath.proof.map(p => '0x' + p),
                pathIndices: merklePath.indices
            },
            wasmPath,
            zkeyPath
        );

        // Map snarkjs proof format to SolVoid ProofData (aligned with groth16-solana expectations)
        // This requires careful G1/G2 point serialization
        const proofAG1 = Buffer.from(BigInt(proof.pi_a[0]).toString(16).padStart(64, '0'), 'hex');

        // G2 points are typically represented as pairs of coefficients
        const proofBG2 = Buffer.concat([
            Buffer.from(BigInt(proof.pi_b[0][1]).toString(16).padStart(64, '0'), 'hex'),
            Buffer.from(BigInt(proof.pi_b[0][0]).toString(16).padStart(64, '0'), 'hex')
        ]);

        const proofCG1 = Buffer.from(BigInt(proof.pi_c[0]).toString(16).padStart(64, '0'), 'hex');

        return {
            proof: {
                proofAG1: Array.from(proofAG1),
                proofBG2: Array.from(proofBG2),
                proofCG1: Array.from(proofCG1),
            },
            publicSignals
        };
    }


    public async withdraw(
        proof: any,
        rootHex: string,
        nullifierHashHex: string,
        recipient: PublicKey,
        relayer: PublicKey,
        feeLamports: number,
        amountLamports: number
    ): Promise<string> {
        const [statePda] = PublicKey.findProgramAddressSync([Buffer.from('state')], this.getProgramId());
        const [vaultPda] = PublicKey.findProgramAddressSync([Buffer.from('vault')], this.getProgramId());
        const [rootHistoryPda] = PublicKey.findProgramAddressSync([Buffer.from('root_history')], this.getProgramId());
        const [treasuryPda] = PublicKey.findProgramAddressSync([Buffer.from('treasury')], this.getProgramId());
        const [economicPda] = PublicKey.findProgramAddressSync([Buffer.from('economic_state')], this.getProgramId());
        const [verifierPda] = PublicKey.findProgramAddressSync([Buffer.from('verifier'), statePda.toBuffer()], this.getProgramId());

        // Nullifier account derivation
        const [nullifierPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('nullifier'), Buffer.from(nullifierHashHex, 'hex')],
            this.getProgramId()
        );

        return await (this.program.methods as any)
            .withdraw(
                proof,
                Array.from(Buffer.from(rootHex, 'hex')),
                Array.from(Buffer.from(nullifierHashHex, 'hex')),
                recipient,
                relayer,
                new BN(feeLamports),
                new BN(amountLamports)
            )
            .accounts({
                state: statePda,
                vault: vaultPda,
                recipient,
                relayer,
                protocolFeeAccumulator: treasuryPda,
                verifierState: verifierPda,
                rootHistory: rootHistoryPda,
                nullifierAccount: nullifierPda,
                economicState: economicPda,
                systemProgram: SystemProgram.programId,
            })
            .rpc();
    }
}
