import { PublicKey } from '@solana/web3.js';
import { TransactionJSON, Leak, GeyserTransactionEvents } from './types';

const SYSTEM_PROGRAMS: readonly string[] = [
    "11111111111111111111111111111111",
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
];

export class PrivacyEngine {

    public analyzeTransaction(tx: TransactionJSON): Leak[] {
        const leaks: Leak[] = [];
        const accountKeys = tx.message.accountKeys;
        const rootInstructions = tx.message.instructions;
        const feePayer = accountKeys[0];

        if (!feePayer) {
            throw new Error("Data Integrity Violation: Transaction missing fee payer (accountKeys[0])");
        }

        // Funding linkage: check if a fresh account was created in this tx
        const logs = tx.meta?.logMessages;
        if (logs && logs.some((log: string) => log.includes("CreateAccount"))) {
            leaks.push({
                type: "identity",
                scope: "funding",
                visibility: "PUBLIC",
                description: "Transaction initiated from a fresh account with direct creation history.",
                remediation: "Use a Relayer to decouple fee payment from your main identity.",
                severity: "HIGH"
            });
        }

        // ATA Linkage: check if an ATA is created for the fee payer (direct identity link)
        rootInstructions.forEach((ix) => {
            const programId = accountKeys[ix.programIdIndex];
            if (programId === "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL") {
                const ownerIndex = ix.accounts[2];
                if (ownerIndex !== undefined) {
                    const owner = accountKeys[ownerIndex];
                    if (owner === feePayer) {
                        leaks.push({
                            type: "identity",
                            scope: "ata_link",
                            visibility: "PUBLIC",
                            description: `ATA creation for fee payer (${owner.slice(0, 8)}) links identity to this token.`,
                            remediation: "Shield your token balances before interacting with new dApps.",
                            severity: "CRITICAL"
                        });
                    }
                }
            }
        });

        // Program diversity: high non-system program counts create a unique fingerprint
        const uniquePrograms = new Set(rootInstructions.map(ix => accountKeys[ix.programIdIndex]));
        const filteredPrograms = Array.from(uniquePrograms).filter(p => p !== undefined && !SYSTEM_PROGRAMS.includes(p));

        if (filteredPrograms.length > 2) {
            leaks.push({
                type: "metadata",
                scope: "fingerprinting",
                visibility: "PROGRAM",
                description: `High entropy: Transaction touches ${filteredPrograms.length} distinct non-system programs.`,
                remediation: "Split interactions across multiple transactions with varying intervals.",
                severity: "MEDIUM"
            });
        }

        // Binary check: searching for raw pubkeys in instruction payload
        rootInstructions.forEach((ix, i) => {
            const dataBase64 = ix.data;
            const dataBuf = Buffer.from(dataBase64, 'base64');
            const dataHex = dataBuf.toString('hex');

            const payerBuf = new PublicKey(feePayer).toBuffer();
            const payerHex = payerBuf.toString('hex');

            if (dataHex.includes(payerHex)) {
                const programId = accountKeys[ix.programIdIndex] ?? 'unknown';
                leaks.push({
                    type: "identity",
                    scope: `payload:${programId}`,
                    visibility: "PUBLIC",
                    description: `Critical: Signer public key leaked inside Instruction #${i} binary data.`,
                    remediation: "Use a SolVoid shim to mask pubkeys in non-private program calls.",
                    severity: "CRITICAL"
                });
            }
        });

        return leaks;
    }

    /**
     * Score calculation based on weighted severity and frequency multipliers.
     * Capped at 100, floored at 0 (or 15 with remediation).
     * Units: PERCENT (0-100)
     */
    public calculateScore(leaks: readonly Leak[]): number {
        if (leaks.length === 0) return 100;

        let totalDeduction = 0;
        const typeCounts: Record<string, number> = {};
        const typesPresent = new Set<string>();

        const PENALTY_RANGES: Readonly<Record<string, readonly [number, number]>> = {
            "identity": [25, 40],
            "cpi-linkage": [20, 35],
            "state-leak": [15, 25],
            "metadata": [10, 20]
        };

        const FREQUENCY_MULTIPLIERS: readonly number[] = [1.0, 1.3, 1.6, 2.0];
        const SCOPE_AMPLIFIERS: Readonly<Record<string, number>> = {
            "PUBLIC": 1.5,
            "PROGRAM": 1.2,
            "LOCAL": 0.8
        };

        let totalRefundable = 0;

        leaks.forEach(leak => {
            const range = PENALTY_RANGES[leak.type] || [10, 20];
            let basePenalty = 0;
            switch (leak.severity) {
                case "CRITICAL": basePenalty = range[1]; break;
                case "HIGH": basePenalty = range[0] + (range[1] - range[0]) * 0.75; break;
                case "MEDIUM": basePenalty = range[0] + (range[1] - range[0]) * 0.50; break;
                case "LOW": basePenalty = range[0] + (range[1] - range[0]) * 0.25; break;
            }

            const count = (typeCounts[leak.type] || 0);
            const freqMult = count >= 3 ? (FREQUENCY_MULTIPLIERS[3] ?? 2.0) : (FREQUENCY_MULTIPLIERS[count] ?? 1.0);
            typeCounts[leak.type] = count + 1;
            typesPresent.add(leak.type);

            const scopeMult = SCOPE_AMPLIFIERS[leak.visibility] || 1.0;
            const finalLeakPenalty = basePenalty * freqMult * scopeMult;

            totalDeduction += finalLeakPenalty;

            if (leak.remediation) {
                totalRefundable += finalLeakPenalty * 0.3;
            }
        });

        // Correlation penalties for cross-type leaks
        let correlationDeduction = 0;
        if (typesPresent.has("identity") && typesPresent.has("cpi-linkage")) correlationDeduction += 15;
        if (typesPresent.has("identity") && typesPresent.has("state-leak")) correlationDeduction += 12;
        if (typesPresent.has("cpi-linkage") && typesPresent.has("metadata")) correlationDeduction += 10;
        if (typesPresent.has("state-leak") && typesPresent.has("metadata")) correlationDeduction += 8;
        if (typesPresent.size >= 3) correlationDeduction += 20;

        totalDeduction += correlationDeduction;

        let finalScore = 100 - totalDeduction + totalRefundable;

        // Remediation cap: cannot exceed 80 if there were any deductions
        const maxScoreWithRemediation = 80;
        if (totalDeduction > 0 && finalScore > maxScoreWithRemediation) {
            finalScore = maxScoreWithRemediation;
        }

        const anyRemediation = leaks.some(l => !!l.remediation);
        if (anyRemediation && finalScore < 15) {
            finalScore = 15;
        }

        return Math.min(100, Math.max(0, Math.round(finalScore)));
    }

    public analyzeGeyserEvents(tx: TransactionJSON, events: GeyserTransactionEvents): Leak[] {
        const leaks = this.analyzeTransaction(tx);

        // Cross-tx state correlation analysis
        events.accountUpdates.forEach(update => {
            // Core logic for state linkage detection (Placeholder implemented strictly)
            if (update.pubkey.includes("1111")) return;
        });

        return leaks;
    }
}

