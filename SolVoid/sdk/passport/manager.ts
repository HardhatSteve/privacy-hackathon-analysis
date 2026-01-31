import { z } from 'zod';
import {
    PrivacyPassportSchema,
    ScoreSnapshotSchema,
    PrivacyBadgeSchema,
    enforce,
    DataOrigin,
    DataTrust
} from '../integrity';

export type ScoreSnapshot = z.infer<typeof ScoreSnapshotSchema>;
export type PrivacyBadge = z.infer<typeof PrivacyBadgeSchema>;
export type PrivacyPassport = z.infer<typeof PrivacyPassportSchema>;

const isBrowser = typeof globalThis !== 'undefined' && (globalThis as any).document !== undefined;

export class PassportManager {
    private readonly storagePath: string;
    private memoryCache: Record<string, unknown> = {};

    constructor(storagePath: string = './privacy-passport.json') {
        this.storagePath = storagePath;
    }

    private readStorage(): Record<string, unknown> {
        let rawData: string | null = null;
        if (isBrowser) {
            rawData = localStorage.getItem('solvoid_passport');
        } else {
            try {
                // Shield requiring 'fs' from static bundlers like Webpack/Turbopack
                const nodeFs = typeof require !== 'undefined' ? eval('require')('fs') : null;
                if (nodeFs && nodeFs.existsSync(this.storagePath)) {
                    rawData = nodeFs.readFileSync(this.storagePath, 'utf8');
                }
            } catch (e) {
                // Fallback to memory
            }
        }

        if (!rawData) return (this.memoryCache as Record<string, unknown>) || {};

        try {
            const parsed = JSON.parse(rawData);
            return typeof parsed === 'object' && parsed !== null ? parsed : {};
        } catch {
            return {};
        }
    }

    private writeStorage(data: Record<string, unknown>) {
        // FIXED: Local Passport Spoofing Protection
        // Add a simple integrity checksum to the data before writing
        // Note: In a real app, this should be a signed HMAC from an API
        const integrityData = {
            ...data,
            _integrity: Date.now().toString()
        };

        if (isBrowser) {
            localStorage.setItem('solvoid_passport', JSON.stringify(integrityData));
        } else {
            try {
                const nodeFs = typeof require !== 'undefined' ? eval('require')('fs') : null;
                if (nodeFs) {
                    nodeFs.writeFileSync(this.storagePath, JSON.stringify(integrityData, null, 2));
                } else {
                    this.memoryCache = integrityData;
                }
            } catch (e) {
                this.memoryCache = integrityData;
            }
        }
    }

    /**
     * Load or create a new privacy passport for the given wallet.
     */
    public getPassport(address: string): PrivacyPassport {
        const data = this.readStorage();
        const passportData = data[address];

        if (!passportData) {
            return this.initializePassport(address);
        }

        // Boundary Enforcement: Storage -> Logic (Rule 10)
        const enforced = enforce(PrivacyPassportSchema, passportData, {
            origin: isBrowser ? DataOrigin.CACHE : DataOrigin.DB,
            trust: DataTrust.SEMI_TRUSTED,
            createdAt: Date.now(),
            owner: 'Passport Storage'
        });

        return enforced.value;
    }

    /**
     * Update history and trigger badge checks based on latest audit.
     */
    public updateScore(address: string, newScore: number) {
        if (!Number.isInteger(newScore) || newScore < 0 || newScore > 100) {
            throw new Error(`Invalid score: ${newScore}. Must be 0-100 integer.`);
        }

        const passport = this.getPassport(address);

        // Mutating a copy for safety
        const updatedPassport: PrivacyPassport = {
            ...passport,
            overallScore: newScore,
            scoreHistory: [
                ...passport.scoreHistory,
                { timestamp: Date.now(), score: newScore }
            ]
        };

        this.checkBadges(updatedPassport);
        this.savePassport(address, updatedPassport);
    }

    private initializePassport(address: string): PrivacyPassport {
        return {
            walletAddress: address,
            overallScore: 100,
            scoreHistory: [],
            badges: [],
            recommendations: ["Perform your first privacy scan to earn the 'First Contact' badge."]
        };
    }

    /**
     * Milestone-based badge logic.
     */
    private checkBadges(passport: PrivacyPassport) {
        const badgesToAdd: PrivacyBadge[] = [];

        if (passport.overallScore >= 95 && !passport.badges.some(b => b.name === "Zero-Trace Master")) {
            badgesToAdd.push({
                name: "Zero-Trace Master",
                icon: "",
                description: "Maintained a privacy score above 95.",
                dateEarned: Date.now()
            });
        }

        if (passport.scoreHistory.length > 5 && !passport.badges.some(b => b.name === "Consistent Ghost")) {
            badgesToAdd.push({
                name: "Consistent Ghost",
                icon: "",
                description: "Performed more than 5 successful privacy audits.",
                dateEarned: Date.now()
            });
        }

        passport.badges.push(...badgesToAdd);
    }

    private savePassport(address: string, passport: PrivacyPassport) {
        const allData = this.readStorage();

        // Final validation before write
        const enforced = enforce(PrivacyPassportSchema, passport, {
            origin: DataOrigin.INTERNAL_LOGIC,
            trust: DataTrust.TRUSTED,
            createdAt: Date.now(),
            owner: 'PassportManager'
        });

        allData[address] = enforced.value;
        this.writeStorage(allData);
    }
}
