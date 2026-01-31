import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import * as crypto from 'crypto';
import * as fs from 'fs';

/**
 * Syncs the local commitment list with on-chain Deposit events.
 */
export class PrivacyIndexer {
    private connection: Connection;
    private program: Program;
    private dbPath: string;

    constructor(connection: Connection, idl: any, programId: string, dbPath: string = './merkle-db.json') {
        this.connection = connection;
        this.dbPath = dbPath;
        const provider = new AnchorProvider(connection, {} as any, { preflightCommitment: 'confirmed' });
        this.program = new Program(idl, provider);
    }

    /**
     * Scans tx signatures for DepositEvents and rebuilds local state.
     */
    public async sync() {
        console.log('Syncing state from Solana...');

        let allEvents: any[] = [];
        const signatures = await this.connection.getSignaturesForAddress(this.program.programId);

        for (const sig of signatures) {
            const tx = await this.connection.getTransaction(sig.signature, {
                maxSupportedTransactionVersion: 0,
            });

            if (tx && tx.meta && tx.meta.logMessages) {
                // Decode logs into Anchor events
                const coder = this.program.coder;
                tx.meta.logMessages.forEach(log => {
                    const event = coder.events.decode(log);
                    if (event && event.name === 'DepositEvent') {
                        allEvents.push(event.data);
                    }
                });
            }
        }

        // Sort by index to maintain global Merkle order
        allEvents.sort((a, b) => a.index.toNumber() - b.index.toNumber());

        const commitments = allEvents.map(e => Buffer.from(e.commitment).toString('hex'));

        fs.writeFileSync(this.dbPath, JSON.stringify({
            lastSyncSlot: 0,
            commitments,
            treeDepth: 20
        }, null, 2));

        console.log(`Synced ${commitments.length} commitments.`);
        return commitments;
    }

    public getCommitments(): Buffer[] {
        if (!fs.existsSync(this.dbPath)) return [];
        const data = JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
        return data.commitments.map((c: string) => Buffer.from(c, 'hex'));
    }
}
