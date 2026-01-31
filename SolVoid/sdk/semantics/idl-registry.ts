import { logger } from '../utils/logger';
import { OnChainIdlFetcher } from '../registry/idl-fetcher';
import {
    IdlSchema,
    enforce,
    DataOrigin,
    DataTrust,
    PublicKeySchema
} from '../integrity';
import { Idl } from './types';

// Reference IDL suitable for System Program transfers
const SYSTEM_IDL: Idl = {
    version: "0.1.0",
    name: "system_program",
    instructions: [
        {
            name: "transfer",
            accounts: [
                { name: "from", isMut: true, isSigner: true },
                { name: "to", isMut: true, isSigner: false }
            ],
            args: [
                { name: "lamports", type: "u64" }
            ],
            discriminator: [2, 0, 0, 0]
        }
    ]
};

// Reference IDL for SPL Token
const SPL_TOKEN_IDL: Idl = {
    version: "0.1.0",
    name: "spl_token",
    instructions: [
        {
            name: "transfer",
            accounts: [
                { name: "source", isMut: true, isSigner: false },
                { name: "destination", isMut: true, isSigner: false },
                { name: "authority", isMut: false, isSigner: true }
            ],
            args: [
                { name: "amount", type: "u64" }
            ],
            discriminator: [3]
        }
    ]
};

// Reference IDL for a generic DeFi swap
const DEFI_SWAP_IDL: Idl = {
    version: "1.0.0",
    name: "super_swap",
    instructions: [
        {
            name: "swap",
            accounts: [
                { name: "user_authority", isMut: false, isSigner: true },
                { name: "user_source", isMut: true, isSigner: false },
                { name: "pool_source", isMut: true, isSigner: false },
                { name: "pool_dest", isMut: true, isSigner: false },
                { name: "user_dest", isMut: true, isSigner: false }
            ],
            args: [
                { name: "amount_in", type: "u64" },
                { name: "min_out", type: "u64" }
            ],
            discriminator: [100, 100, 100, 100, 100, 100, 100, 100]
        }
    ]
};

export class IdlRegistry {
    private readonly cache: Map<string, Idl>;

    constructor() {
        this.cache = new Map();
        this.cache.set("11111111111111111111111111111111", SYSTEM_IDL);
        this.cache.set("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", SPL_TOKEN_IDL);
        this.cache.set("DeFi111111111111111111111111111111111111111", DEFI_SWAP_IDL);
    }

    public async fetchIdl(programId: string): Promise<Idl | null> {
        // Boundary check (Rule 10)
        enforce(PublicKeySchema, programId, {
            origin: DataOrigin.INTERNAL_LOGIC,
            trust: DataTrust.TRUSTED,
            createdAt: Date.now(),
            owner: 'IdlRegistry'
        });

        if (this.cache.has(programId)) {
            return this.cache.get(programId) ?? null;
        }

        try {
            const fetcher = new OnChainIdlFetcher("https://api.mainnet-beta.solana.com");
            const rawIdl = await fetcher.fetchIdl(programId);

            if (rawIdl) {
                // Boundary Enforcement: Chain -> Logic (Rule 10)
                const enforced = enforce(IdlSchema, rawIdl, {
                    origin: DataOrigin.CHAIN,
                    trust: DataTrust.SEMI_TRUSTED,
                    createdAt: Date.now(),
                    owner: 'Solana RPC'
                });

                const idl = enforced.value as unknown as Idl;
                this.cache.set(programId, idl);
                return idl;
            }
        } catch (e) {
            logger.error(`[IdlRegistry] Failed to fetch IDL for ${programId}:`, e);
        }

        logger.debug(`[IdlRegistry] IDL not found on-chain for ${programId}`);
        return null;
    }

    public registerIdl(programId: string, idl: Idl): void {
        this.cache.set(programId, idl);
    }
}
