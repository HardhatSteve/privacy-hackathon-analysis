import { z } from 'zod';
/**
 * Data Integrity Enforcement Layer
 * Complies with strict data-integrity enforcement mode.
 */
export declare enum DataOrigin {
    UI_INPUT = "UI_INPUT",
    API_PAYLOAD = "API_PAYLOAD",
    ENV_VAR = "ENV_VAR",
    CLI_ARG = "CLI_ARG",
    DB = "DB",
    CACHE = "CACHE",
    CHAIN = "CHAIN",
    INTERNAL_LOGIC = "INTERNAL_LOGIC"
}
export declare enum DataTrust {
    UNTRUSTED = "UNTRUSTED",
    SEMI_TRUSTED = "SEMI_TRUSTED",
    TRUSTED = "TRUSTED"
}
export declare enum Unit {
    SOL = "SOL",
    LAMPORT = "LAMPORT",
    MS = "MS",
    S = "S",
    BYTES = "BYTES",
    KB = "KB",
    PERCENT = "PERCENT"
}
export interface DataMetadata {
    readonly origin: DataOrigin;
    readonly trust: DataTrust;
    readonly createdAt: number;
    readonly lifetimeMs?: number;
    readonly units?: Unit;
    readonly owner: string;
}
export interface EnforcedData<T> {
    readonly value: T;
    readonly metadata: DataMetadata;
}
/**
 * SCHEMA DEFINITIONS
 */
export declare const PublicKeySchema: z.ZodString;
export declare const SignatureSchema: z.ZodString;
export declare const LeakTypeSchema: z.ZodEnum<{
    identity: "identity";
    metadata: "metadata";
    "state-leak": "state-leak";
    "cpi-linkage": "cpi-linkage";
}>;
export declare const VisibilityScopeSchema: z.ZodEnum<{
    PUBLIC: "PUBLIC";
    PROGRAM: "PROGRAM";
    LOCAL: "LOCAL";
}>;
export declare const SeveritySchema: z.ZodEnum<{
    CRITICAL: "CRITICAL";
    HIGH: "HIGH";
    MEDIUM: "MEDIUM";
    LOW: "LOW";
}>;
export declare const LeakSchema: z.ZodObject<{
    type: z.ZodEnum<{
        identity: "identity";
        metadata: "metadata";
        "state-leak": "state-leak";
        "cpi-linkage": "cpi-linkage";
    }>;
    scope: z.ZodString;
    visibility: z.ZodEnum<{
        PUBLIC: "PUBLIC";
        PROGRAM: "PROGRAM";
        LOCAL: "LOCAL";
    }>;
    description: z.ZodString;
    remediation: z.ZodOptional<z.ZodString>;
    severity: z.ZodEnum<{
        CRITICAL: "CRITICAL";
        HIGH: "HIGH";
        MEDIUM: "MEDIUM";
        LOW: "LOW";
    }>;
    programName: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const TransactionInstructionSchema: z.ZodObject<{
    programIdIndex: z.ZodNumber;
    accounts: z.ZodArray<z.ZodNumber>;
    data: z.ZodString;
}, z.core.$strict>;
export declare const TransactionJSONSchema: z.ZodObject<{
    message: z.ZodObject<{
        accountKeys: z.ZodArray<z.ZodString>;
        header: z.ZodObject<{
            numRequiredSignatures: z.ZodNumber;
        }, z.core.$strict>;
        instructions: z.ZodArray<z.ZodObject<{
            programIdIndex: z.ZodNumber;
            accounts: z.ZodArray<z.ZodNumber>;
            data: z.ZodString;
        }, z.core.$strict>>;
    }, z.core.$strict>;
    meta: z.ZodNullable<z.ZodOptional<z.ZodObject<{
        innerInstructions: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodObject<{
            index: z.ZodNumber;
            instructions: z.ZodArray<z.ZodObject<{
                programIdIndex: z.ZodNumber;
                accounts: z.ZodArray<z.ZodNumber>;
                data: z.ZodString;
            }, z.core.$strict>>;
        }, z.core.$strict>>>>;
        logMessages: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    }, z.core.$strict>>>;
    signatures: z.ZodArray<z.ZodString>;
}, z.core.$strict>;
export declare const IdlFieldSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodAny;
    docs: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
export declare const IdlInstructionSchema: z.ZodObject<{
    name: z.ZodString;
    accounts: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        writable: z.ZodOptional<z.ZodBoolean>;
        signer: z.ZodOptional<z.ZodBoolean>;
        isMut: z.ZodOptional<z.ZodBoolean>;
        isSigner: z.ZodOptional<z.ZodBoolean>;
        docs: z.ZodOptional<z.ZodArray<z.ZodString>>;
        optional: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$loose>>;
    args: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodAny;
        docs: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>;
    discriminator: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
    docs: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
export declare const IdlAccountSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodObject<{
        kind: z.ZodLiteral<"struct">;
        fields: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodAny;
            docs: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strict>>;
    }, z.core.$strict>;
    docs: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
export declare const IdlTypeSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodAny;
}, z.core.$strict>;
export declare const IdlEventSchema: z.ZodObject<{
    name: z.ZodString;
    fields: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodAny;
        index: z.ZodBoolean;
    }, z.core.$strict>>;
}, z.core.$strict>;
export declare const IdlErrorSchema: z.ZodObject<{
    code: z.ZodNumber;
    name: z.ZodString;
    msg: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const IdlSchema: z.ZodObject<{
    version: z.ZodString;
    name: z.ZodString;
    instructions: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        accounts: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            writable: z.ZodOptional<z.ZodBoolean>;
            signer: z.ZodOptional<z.ZodBoolean>;
            isMut: z.ZodOptional<z.ZodBoolean>;
            isSigner: z.ZodOptional<z.ZodBoolean>;
            docs: z.ZodOptional<z.ZodArray<z.ZodString>>;
            optional: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$loose>>;
        args: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodAny;
            docs: z.ZodOptional<z.ZodArray<z.ZodString>>;
        }, z.core.$strict>>;
        discriminator: z.ZodOptional<z.ZodArray<z.ZodNumber>>;
        docs: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>;
    accounts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodObject<{
            kind: z.ZodLiteral<"struct">;
            fields: z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                type: z.ZodAny;
                docs: z.ZodOptional<z.ZodArray<z.ZodString>>;
            }, z.core.$strict>>;
        }, z.core.$strict>;
        docs: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strict>>>;
    types: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodAny;
    }, z.core.$strict>>>;
    events: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        fields: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodAny;
            index: z.ZodBoolean;
        }, z.core.$strict>>;
    }, z.core.$strict>>>;
    errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
        code: z.ZodNumber;
        name: z.ZodString;
        msg: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
    metadata: z.ZodOptional<z.ZodAny>;
    address: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const ScoreSnapshotSchema: z.ZodObject<{
    timestamp: z.ZodNumber;
    score: z.ZodNumber;
}, z.core.$strict>;
export declare const PrivacyBadgeSchema: z.ZodObject<{
    name: z.ZodString;
    icon: z.ZodString;
    description: z.ZodString;
    dateEarned: z.ZodNumber;
}, z.core.$strict>;
export declare const PrivacyPassportSchema: z.ZodObject<{
    walletAddress: z.ZodString;
    overallScore: z.ZodNumber;
    scoreHistory: z.ZodArray<z.ZodObject<{
        timestamp: z.ZodNumber;
        score: z.ZodNumber;
    }, z.core.$strict>>;
    badges: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        icon: z.ZodString;
        description: z.ZodString;
        dateEarned: z.ZodNumber;
    }, z.core.$strict>>;
    recommendations: z.ZodArray<z.ZodString>;
}, z.core.$strict>;
export declare const MerkleProofSchema: z.ZodObject<{
    proof: z.ZodArray<z.ZodString>;
    indices: z.ZodArray<z.ZodNumber>;
}, z.core.$strict>;
export declare const CommitmentDataSchema: z.ZodObject<{
    secret: z.ZodString;
    nullifier: z.ZodString;
    commitment: z.ZodString;
    nullifierHash: z.ZodString;
    commitmentHex: z.ZodString;
}, z.core.$strict>;
export declare const RelayRequestSchema: z.ZodObject<{
    transaction: z.ZodOptional<z.ZodString>;
    hops: z.ZodNumber;
    targetNode: z.ZodOptional<z.ZodString>;
    encryptedPayload: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const ShadowNodeSchema: z.ZodObject<{
    id: z.ZodString;
    endpoint: z.ZodString;
    region: z.ZodString;
    latency: z.ZodOptional<z.ZodNumber>;
    isHealthy: z.ZodBoolean;
}, z.core.$strict>;
export declare const RelayOptionsSchema: z.ZodObject<{
    hops: z.ZodNumber;
    stealthMode: z.ZodBoolean;
    preferredRegions: z.ZodOptional<z.ZodArray<z.ZodString>>;
    timeout: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export declare const RelayResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    txid: z.ZodOptional<z.ZodString>;
    hopCount: z.ZodOptional<z.ZodNumber>;
    error: z.ZodOptional<z.ZodString>;
    relayPath: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strict>;
export declare const OnionLayerSchema: z.ZodObject<{
    nextHop: z.ZodString;
    payload: z.ZodString;
    nonce: z.ZodString;
}, z.core.$strict>;
export declare const LeakedAssetSchema: z.ZodObject<{
    mint: z.ZodString;
    mintName: z.ZodOptional<z.ZodString>;
    amount: z.ZodNumber;
    decimals: z.ZodNumber;
    reason: z.ZodString;
    severity: z.ZodEnum<{
        CRITICAL: "CRITICAL";
        HIGH: "HIGH";
        MEDIUM: "MEDIUM";
        LOW: "LOW";
    }>;
    isNative: z.ZodBoolean;
    ataAddress: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const RescueAnalysisSchema: z.ZodObject<{
    leakedAssets: z.ZodArray<z.ZodObject<{
        mint: z.ZodString;
        mintName: z.ZodOptional<z.ZodString>;
        amount: z.ZodNumber;
        decimals: z.ZodNumber;
        reason: z.ZodString;
        severity: z.ZodEnum<{
            CRITICAL: "CRITICAL";
            HIGH: "HIGH";
            MEDIUM: "MEDIUM";
            LOW: "LOW";
        }>;
        isNative: z.ZodBoolean;
        ataAddress: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
    totalValueLamports: z.ZodNumber;
    splTokenCount: z.ZodNumber;
    nativeSOL: z.ZodNumber;
    riskScore: z.ZodNumber;
    estimatedFee: z.ZodNumber;
}, z.core.$strict>;
export declare const ProtocolStatsSchema: z.ZodObject<{
    solPriceUSD: z.ZodNumber;
    relayNodeCount: z.ZodNumber;
    mixingTimeAvgMinutes: z.ZodNumber;
    anonSetSize: z.ZodNumber;
    totalShieldedValueSOL: z.ZodNumber;
    systemStatus: z.ZodEnum<{
        OPERATIONAL: "OPERATIONAL";
        DEGRADED: "DEGRADED";
        MAINTENANCE: "MAINTENANCE";
    }>;
    lastUpdated: z.ZodNumber;
}, z.core.$strict>;
export type LeakType = z.infer<typeof LeakTypeSchema>;
export type VisibilityScope = z.infer<typeof VisibilityScopeSchema>;
export type Severity = z.infer<typeof SeveritySchema>;
export type Leak = z.infer<typeof LeakSchema>;
export type TransactionInstruction = z.infer<typeof TransactionInstructionSchema>;
export type TransactionJSON = z.infer<typeof TransactionJSONSchema>;
export type IdlField = z.infer<typeof IdlFieldSchema>;
export type IdlInstruction = z.infer<typeof IdlInstructionSchema>;
export type IdlAccount = z.infer<typeof IdlAccountSchema>;
export type IdlType = z.infer<typeof IdlTypeSchema>;
export type IdlEvent = z.infer<typeof IdlEventSchema>;
export type IdlError = z.infer<typeof IdlErrorSchema>;
export type Idl = z.infer<typeof IdlSchema>;
export type ScoreSnapshot = z.infer<typeof ScoreSnapshotSchema>;
export type PrivacyBadge = z.infer<typeof PrivacyBadgeSchema>;
export type PrivacyPassport = z.infer<typeof PrivacyPassportSchema>;
export type MerkleProof = z.infer<typeof MerkleProofSchema>;
export type CommitmentData = z.infer<typeof CommitmentDataSchema>;
export type RelayRequest = z.infer<typeof RelayRequestSchema>;
export type ShadowNode = z.infer<typeof ShadowNodeSchema>;
export type RelayOptions = z.infer<typeof RelayOptionsSchema>;
export type RelayResponse = z.infer<typeof RelayResponseSchema>;
export type OnionLayer = z.infer<typeof OnionLayerSchema>;
export type LeakedAsset = z.infer<typeof LeakedAssetSchema>;
export type RescueAnalysis = z.infer<typeof RescueAnalysisSchema>;
export type ProtocolStats = z.infer<typeof ProtocolStatsSchema>;
/**
 * Utility for boundary enforcement
 */
export declare function enforce<T>(schema: z.ZodSchema<T>, data: unknown, metadata: DataMetadata): EnforcedData<T>;
//# sourceMappingURL=integrity.d.ts.map