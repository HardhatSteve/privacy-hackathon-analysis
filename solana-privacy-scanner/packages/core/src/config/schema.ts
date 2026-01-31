import { z } from 'zod';

/**
 * Privacy configuration schema
 */
export const PrivacyConfigSchema = z.object({
  /** Maximum acceptable risk level */
  maxRiskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),

  /** Whether to enforce checks in CI/CD */
  enforceInCI: z.boolean().default(true),

  /** Whether to block operations on policy violation */
  blockOnFailure: z.boolean().default(false),

  /** Test wallet addresses for different environments */
  testWallets: z
    .object({
      devnet: z.string().optional(),
      testnet: z.string().optional(),
      mainnet: z.string().optional(),
    })
    .optional(),

  /** Privacy thresholds */
  thresholds: z
    .object({
      /** Maximum number of signals allowed */
      maxSignals: z.number().optional(),
      /** Maximum number of HIGH severity signals */
      maxHighSeverity: z.number().default(0),
      /** Maximum number of MEDIUM severity signals */
      maxMediumSeverity: z.number().optional(),
      /** Minimum privacy score (0-100) */
      minPrivacyScore: z.number().min(0).max(100).optional(),
    })
    .optional(),

  /** File patterns to exclude from scanning */
  excludePatterns: z.array(z.string()).optional(),

  /** Required heuristic checks */
  requiredHeuristics: z.array(z.string()).optional(),

  /** Environment-specific configurations */
  environments: z
    .record(
      z.object({
        testWallet: z.string().optional(),
        maxRiskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
        requiredChecks: z.array(z.string()).optional(),
      })
    )
    .optional(),

  /** Notification settings */
  notifications: z
    .object({
      slack: z
        .object({
          webhook: z.string().url(),
          channel: z.string(),
        })
        .optional(),
      email: z
        .object({
          to: z.array(z.string().email()),
          from: z.string().email(),
        })
        .optional(),
    })
    .optional(),

  /** Custom privacy rules */
  customRules: z
    .array(
      z.object({
        id: z.string(),
        description: z.string(),
        severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
        condition: z.string(),
      })
    )
    .optional(),
});

export type PrivacyConfig = z.infer<typeof PrivacyConfigSchema>;

/**
 * Default privacy configuration
 */
export const DEFAULT_CONFIG: PrivacyConfig = {
  maxRiskLevel: 'MEDIUM',
  enforceInCI: true,
  blockOnFailure: false,
  thresholds: {
    maxHighSeverity: 0,
  },
};

/**
 * Strict privacy configuration (for production)
 */
export const STRICT_CONFIG: PrivacyConfig = {
  maxRiskLevel: 'LOW',
  enforceInCI: true,
  blockOnFailure: true,
  thresholds: {
    maxHighSeverity: 0,
    maxMediumSeverity: 2,
    minPrivacyScore: 80,
  },
};

/**
 * Permissive privacy configuration (for development)
 */
export const PERMISSIVE_CONFIG: PrivacyConfig = {
  maxRiskLevel: 'HIGH',
  enforceInCI: false,
  blockOnFailure: false,
  thresholds: {
    maxHighSeverity: 3,
  },
};
