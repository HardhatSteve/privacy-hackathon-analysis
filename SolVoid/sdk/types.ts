import { z } from 'zod';
import {
    LeakSchema,
    LeakTypeSchema,
    VisibilityScopeSchema,
    TransactionJSONSchema
} from './integrity';

export type LeakType = z.infer<typeof LeakTypeSchema>;
export type VisibilityScope = z.infer<typeof VisibilityScopeSchema>;
export type Leak = z.infer<typeof LeakSchema>;

export interface GovernanceResult {
    readonly status: "SURFACE_SCAN_PASSED" | "REGRESSION";
    readonly unacceptedLiabilities: { readonly leak: Leak; readonly reason: string }[];
    readonly remediationHints: readonly string[];
    readonly privacyScore: number; // 0-100
}

export type TransactionJSON = z.infer<typeof TransactionJSONSchema>;

export interface GeyserTransactionEvents {
    readonly signature: string;
    readonly accountUpdates: {
        readonly pubkey: string;
        readonly data: string; // Hex or Base64
    }[];
}
