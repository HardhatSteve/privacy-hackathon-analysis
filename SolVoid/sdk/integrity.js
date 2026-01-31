"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProtocolStatsSchema = exports.RescueAnalysisSchema = exports.LeakedAssetSchema = exports.OnionLayerSchema = exports.RelayResponseSchema = exports.RelayOptionsSchema = exports.ShadowNodeSchema = exports.RelayRequestSchema = exports.CommitmentDataSchema = exports.MerkleProofSchema = exports.PrivacyPassportSchema = exports.PrivacyBadgeSchema = exports.ScoreSnapshotSchema = exports.IdlSchema = exports.IdlErrorSchema = exports.IdlEventSchema = exports.IdlTypeSchema = exports.IdlAccountSchema = exports.IdlInstructionSchema = exports.IdlFieldSchema = exports.TransactionJSONSchema = exports.TransactionInstructionSchema = exports.LeakSchema = exports.SeveritySchema = exports.VisibilityScopeSchema = exports.LeakTypeSchema = exports.SignatureSchema = exports.PublicKeySchema = exports.Unit = exports.DataTrust = exports.DataOrigin = void 0;
exports.enforce = enforce;
const zod_1 = require("zod");
const buffer_1 = require("buffer");
// Secure Buffer polyfill with type safety
if (typeof window !== 'undefined') {
    // Only set Buffer if it doesn't exist
    if (!window.Buffer) {
        window.Buffer = buffer_1.Buffer;
    }
    // Enhanced isBuffer with strict type checking
    const originalIsBuffer = window.Buffer?.isBuffer;
    window.Buffer.isBuffer = (obj) => {
        // Use original if available
        if (originalIsBuffer && typeof originalIsBuffer === 'function') {
            return originalIsBuffer(obj);
        }
        // Strict type checking - no type confusion
        return obj instanceof buffer_1.Buffer ||
            (obj && obj.constructor && obj.constructor.name === 'Buffer');
    };
}
/**
 * Data Integrity Enforcement Layer
 * Complies with strict data-integrity enforcement mode.
 */
var DataOrigin;
(function (DataOrigin) {
    DataOrigin["UI_INPUT"] = "UI_INPUT";
    DataOrigin["API_PAYLOAD"] = "API_PAYLOAD";
    DataOrigin["ENV_VAR"] = "ENV_VAR";
    DataOrigin["CLI_ARG"] = "CLI_ARG";
    DataOrigin["DB"] = "DB";
    DataOrigin["CACHE"] = "CACHE";
    DataOrigin["CHAIN"] = "CHAIN";
    DataOrigin["INTERNAL_LOGIC"] = "INTERNAL_LOGIC";
})(DataOrigin || (exports.DataOrigin = DataOrigin = {}));
var DataTrust;
(function (DataTrust) {
    DataTrust["UNTRUSTED"] = "UNTRUSTED";
    DataTrust["SEMI_TRUSTED"] = "SEMI_TRUSTED";
    DataTrust["TRUSTED"] = "TRUSTED";
})(DataTrust || (exports.DataTrust = DataTrust = {}));
var Unit;
(function (Unit) {
    Unit["SOL"] = "SOL";
    Unit["LAMPORT"] = "LAMPORT";
    Unit["MS"] = "MS";
    Unit["S"] = "S";
    Unit["BYTES"] = "BYTES";
    Unit["KB"] = "KB";
    Unit["PERCENT"] = "PERCENT";
})(Unit || (exports.Unit = Unit = {}));
/**
 * SCHEMA DEFINITIONS
 */
// 1. Types & 2. Shape
exports.PublicKeySchema = zod_1.z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/, "Invalid Base58 Public Key");
exports.SignatureSchema = zod_1.z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{87,88}$/, "Invalid Base58 Signature");
exports.LeakTypeSchema = zod_1.z.enum(["identity", "metadata", "state-leak", "cpi-linkage"]);
exports.VisibilityScopeSchema = zod_1.z.enum(["PUBLIC", "PROGRAM", "LOCAL"]);
exports.SeveritySchema = zod_1.z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);
exports.LeakSchema = zod_1.z.object({
    type: exports.LeakTypeSchema,
    scope: zod_1.z.string().min(1),
    visibility: exports.VisibilityScopeSchema,
    description: zod_1.z.string().min(1),
    remediation: zod_1.z.string().optional(),
    severity: exports.SeveritySchema,
    programName: zod_1.z.string().optional(),
}).strict(); // No extra keys allowed (Rule 2)
exports.TransactionInstructionSchema = zod_1.z.object({
    programIdIndex: zod_1.z.number().int().nonnegative(),
    accounts: zod_1.z.array(zod_1.z.number().int().nonnegative()),
    data: zod_1.z.string(), // Base64 encoded
}).strict();
exports.TransactionJSONSchema = zod_1.z.object({
    message: zod_1.z.object({
        accountKeys: zod_1.z.array(exports.PublicKeySchema),
        header: zod_1.z.object({
            numRequiredSignatures: zod_1.z.number().int().nonnegative(),
        }).strict(),
        instructions: zod_1.z.array(exports.TransactionInstructionSchema),
    }).strict(),
    meta: zod_1.z.object({
        innerInstructions: zod_1.z.array(zod_1.z.object({
            index: zod_1.z.number().int().nonnegative(),
            instructions: zod_1.z.array(exports.TransactionInstructionSchema),
        }).strict()).optional().nullable(),
        logMessages: zod_1.z.array(zod_1.z.string()).optional().nullable(),
    }).strict().optional().nullable(),
    signatures: zod_1.z.array(exports.SignatureSchema),
}).strict();
exports.IdlFieldSchema = zod_1.z.object({
    name: zod_1.z.string(),
    type: zod_1.z.any(), // Complex IDL types (e.g. { defined: '...' }, { vec: '...' })
    docs: zod_1.z.array(zod_1.z.string()).optional(),
}).strict();
exports.IdlInstructionSchema = zod_1.z.object({
    name: zod_1.z.string(),
    accounts: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        writable: zod_1.z.boolean().optional(),
        signer: zod_1.z.boolean().optional(),
        isMut: zod_1.z.boolean().optional(),
        isSigner: zod_1.z.boolean().optional(),
        docs: zod_1.z.array(zod_1.z.string()).optional(),
        optional: zod_1.z.boolean().optional(),
    }).passthrough()),
    args: zod_1.z.array(exports.IdlFieldSchema),
    discriminator: zod_1.z.array(zod_1.z.number()).optional(),
    docs: zod_1.z.array(zod_1.z.string()).optional(),
}).strict();
exports.IdlAccountSchema = zod_1.z.object({
    name: zod_1.z.string(),
    type: zod_1.z.object({
        kind: zod_1.z.literal('struct'),
        fields: zod_1.z.array(exports.IdlFieldSchema),
    }).strict(),
    docs: zod_1.z.array(zod_1.z.string()).optional(),
}).strict();
exports.IdlTypeSchema = zod_1.z.object({
    name: zod_1.z.string(),
    type: zod_1.z.any(),
}).strict();
exports.IdlEventSchema = zod_1.z.object({
    name: zod_1.z.string(),
    fields: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        type: zod_1.z.any(),
        index: zod_1.z.boolean(),
    }).strict()),
}).strict();
exports.IdlErrorSchema = zod_1.z.object({
    code: zod_1.z.number(),
    name: zod_1.z.string(),
    msg: zod_1.z.string().optional(),
}).strict();
exports.IdlSchema = zod_1.z.object({
    version: zod_1.z.string(),
    name: zod_1.z.string(),
    instructions: zod_1.z.array(exports.IdlInstructionSchema),
    accounts: zod_1.z.array(exports.IdlAccountSchema).optional(),
    types: zod_1.z.array(exports.IdlTypeSchema).optional(),
    events: zod_1.z.array(exports.IdlEventSchema).optional(),
    errors: zod_1.z.array(exports.IdlErrorSchema).optional(),
    metadata: zod_1.z.any().optional(),
    address: exports.PublicKeySchema.optional(),
}).strict(); // Strict validation - no extra fields allowed
exports.ScoreSnapshotSchema = zod_1.z.object({
    timestamp: zod_1.z.number().int().nonnegative(),
    score: zod_1.z.number().int().min(0).max(100),
}).strict();
exports.PrivacyBadgeSchema = zod_1.z.object({
    name: zod_1.z.string(),
    icon: zod_1.z.string(),
    description: zod_1.z.string(),
    dateEarned: zod_1.z.number().int().nonnegative(),
}).strict();
exports.PrivacyPassportSchema = zod_1.z.object({
    walletAddress: exports.PublicKeySchema,
    overallScore: zod_1.z.number().int().min(0).max(100),
    scoreHistory: zod_1.z.array(exports.ScoreSnapshotSchema),
    badges: zod_1.z.array(exports.PrivacyBadgeSchema),
    recommendations: zod_1.z.array(zod_1.z.string()),
}).strict();
exports.MerkleProofSchema = zod_1.z.object({
    proof: zod_1.z.array(zod_1.z.string().regex(/^[0-9a-fA-F]{64}$/)), // Hex strings for transport
    indices: zod_1.z.array(zod_1.z.number().int().min(0).max(1)),
}).strict();
exports.CommitmentDataSchema = zod_1.z.object({
    secret: zod_1.z.string().regex(/^[0-9a-fA-F]{64}$/),
    nullifier: zod_1.z.string().regex(/^[0-9a-fA-F]{64}$/),
    commitment: zod_1.z.string().regex(/^[0-9a-fA-F]{64}$/),
    nullifierHash: zod_1.z.string().regex(/^[0-9a-fA-F]{64}$/),
    commitmentHex: zod_1.z.string().regex(/^[0-9a-fA-F]{64}$/),
}).strict();
exports.RelayRequestSchema = zod_1.z.object({
    transaction: zod_1.z.string().optional(), // Base64
    hops: zod_1.z.number().int().min(1).max(5),
    targetNode: zod_1.z.string().optional(),
    encryptedPayload: zod_1.z.string().optional(),
}).strict().refine(data => data.transaction || data.encryptedPayload, {
    message: "Either transaction or encryptedPayload must be provided"
});
exports.ShadowNodeSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    endpoint: zod_1.z.string().url(),
    region: zod_1.z.string().min(1),
    latency: zod_1.z.number().nonnegative().optional(),
    isHealthy: zod_1.z.boolean(),
}).strict();
exports.RelayOptionsSchema = zod_1.z.object({
    hops: zod_1.z.number().int().min(1).max(10),
    stealthMode: zod_1.z.boolean(),
    preferredRegions: zod_1.z.array(zod_1.z.string()).optional(),
    timeout: zod_1.z.number().int().positive().optional(),
}).strict();
exports.RelayResponseSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    txid: zod_1.z.string().optional(),
    hopCount: zod_1.z.number().int().nonnegative().optional(),
    error: zod_1.z.string().optional(),
    relayPath: zod_1.z.array(zod_1.z.string()).optional(),
}).strict();
exports.OnionLayerSchema = zod_1.z.object({
    nextHop: zod_1.z.string(),
    payload: zod_1.z.string(),
    nonce: zod_1.z.string(),
}).strict();
exports.LeakedAssetSchema = zod_1.z.object({
    mint: zod_1.z.string().min(1),
    mintName: zod_1.z.string().optional(),
    amount: zod_1.z.number().nonnegative(),
    decimals: zod_1.z.number().int().min(0).max(9),
    reason: zod_1.z.string().min(1),
    severity: exports.SeveritySchema,
    isNative: zod_1.z.boolean(),
    ataAddress: exports.PublicKeySchema.optional(),
}).strict();
exports.RescueAnalysisSchema = zod_1.z.object({
    leakedAssets: zod_1.z.array(exports.LeakedAssetSchema),
    totalValueLamports: zod_1.z.number().nonnegative(),
    splTokenCount: zod_1.z.number().nonnegative(),
    nativeSOL: zod_1.z.number().nonnegative(),
    riskScore: zod_1.z.number().int().min(0).max(100),
    estimatedFee: zod_1.z.number().nonnegative(),
}).strict();
exports.ProtocolStatsSchema = zod_1.z.object({
    solPriceUSD: zod_1.z.number().nonnegative(),
    relayNodeCount: zod_1.z.number().int().nonnegative(),
    mixingTimeAvgMinutes: zod_1.z.number().nonnegative(),
    anonSetSize: zod_1.z.number().int().nonnegative(),
    totalShieldedValueSOL: zod_1.z.number().nonnegative(),
    systemStatus: zod_1.z.enum(["OPERATIONAL", "DEGRADED", "MAINTENANCE"]),
    lastUpdated: zod_1.z.number().int().nonnegative(),
}).strict();
/**
 * Utility for boundary enforcement
 */
function enforce(schema, data, metadata) {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new Error(`Data Integrity Violation: ${result.error.message} - Metadata: ${JSON.stringify(metadata)}`);
    }
    // Check lifetime (Rule 5)
    if (metadata.lifetimeMs) {
        const now = Date.now();
        if (now - metadata.createdAt > metadata.lifetimeMs) {
            throw new Error(`Data Integrity Violation: Data is stale. Created: ${metadata.createdAt}, Lifetime: ${metadata.lifetimeMs}ms`);
        }
    }
    return {
        value: result.data,
        metadata
    };
}
//# sourceMappingURL=integrity.js.map