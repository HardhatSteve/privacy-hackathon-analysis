/**
 * Proof Generation Progress Configuration
 *
 * Defines the phases and timing for ZK proof generation progress feedback.
 * Since snarkjs.groth16.fullProve() is atomic without callbacks, we simulate
 * realistic progress based on typical proof generation timing.
 */

export type ProofPhase =
  | "preparing"
  | "computing-witness"
  | "generating-proof"
  | "finalizing";

export interface ProofPhaseConfig {
  id: ProofPhase;
  label: string;
  startPercent: number;
  endPercent: number;
  /** Estimated duration in milliseconds for this phase */
  estimatedDuration: number;
}

/**
 * Proof generation phases with their progress ranges and estimated durations.
 * Total estimated time: ~8-12 seconds on average hardware
 */
export const PROOF_PHASES: ProofPhaseConfig[] = [
  {
    id: "preparing",
    label: "Preparing inputs...",
    startPercent: 0,
    endPercent: 10,
    estimatedDuration: 500, // 0.5s for input validation/setup
  },
  {
    id: "computing-witness",
    label: "Computing witness...",
    startPercent: 10,
    endPercent: 40,
    estimatedDuration: 2500, // 2.5s for witness computation
  },
  {
    id: "generating-proof",
    label: "Generating proof...",
    startPercent: 40,
    endPercent: 95,
    estimatedDuration: 7000, // 7s for proof generation (the heavy part)
  },
  {
    id: "finalizing",
    label: "Finalizing...",
    startPercent: 95,
    endPercent: 100,
    estimatedDuration: 500, // 0.5s for final formatting
  },
];

/**
 * Get the phase configuration for a given progress percentage
 */
export function getPhaseForProgress(progress: number): ProofPhaseConfig {
  for (const phase of PROOF_PHASES) {
    if (progress >= phase.startPercent && progress < phase.endPercent) {
      return phase;
    }
  }
  // Default to last phase if at 100%
  return PROOF_PHASES[PROOF_PHASES.length - 1];
}

/**
 * Get the total estimated duration for proof generation
 */
export function getTotalEstimatedDuration(): number {
  return PROOF_PHASES.reduce((sum, phase) => sum + phase.estimatedDuration, 0);
}
