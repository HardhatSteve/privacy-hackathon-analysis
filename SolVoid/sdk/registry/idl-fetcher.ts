import { Connection, PublicKey } from '@solana/web3.js';
import { Idl } from '../semantics/types';
import * as zlib from 'zlib';
import {
    PublicKeySchema,
    enforce,
    DataOrigin,
    DataTrust
} from '../integrity';

export class OnChainIdlFetcher {
    private readonly connection: Connection;

    constructor(rpcUrl: string) {
        this.connection = new Connection(rpcUrl);
    }

    /**
     * Real production logic to fetch Anchor IDL from on-chain account.
     */
    public async fetchIdl(programIdString: string): Promise<Idl | null> {
        try {
            // Boundary Check: Logic -> Core (Rule 10)
            const enforced = enforce(PublicKeySchema, programIdString, {
                origin: DataOrigin.INTERNAL_LOGIC,
                trust: DataTrust.TRUSTED,
                createdAt: Date.now(),
                owner: 'IdlFetcher'
            });

            const programId = new PublicKey(enforced.value);

            // 1. Derive Address
            const [idlAddress] = PublicKey.findProgramAddressSync(
                [Buffer.from("anchor:idl"), programId.toBuffer()],
                programId
            );

            // 2. Fetch Account Info
            const accountInfo = await this.connection.getAccountInfo(idlAddress);
            if (!accountInfo) return null;

            // 3. Parse Data
            const data = accountInfo.data;
            const headerSize = 8 + 32; // Discriminator + Authority
            if (data.length < headerSize + 4) return null;

            const compressedLen = data.readUInt32LE(headerSize);
            const compressedBytes = data.subarray(headerSize + 4, headerSize + 4 + compressedLen);

            // 4. Decompress
            return await new Promise<Idl | null>((resolve) => {
                zlib.inflate(compressedBytes, (err, buffer) => {
                    if (err) {
                        resolve(null);
                    } else {
                        try {
                            const jsonString = buffer.toString('utf-8');
                            const idl = JSON.parse(jsonString) as Idl;

                            // FIXED: IDL Shadowing Protection
                            // Verify that the IDL address matches the program we are fetching for
                            if (idl.metadata?.address && idl.metadata.address !== programIdString) {
                                resolve(null);
                                return;
                            }

                            resolve(idl);
                        } catch {
                            resolve(null);
                        }
                    }
                });
            });

        } catch (e) {
            return null;
        }
    }
}
