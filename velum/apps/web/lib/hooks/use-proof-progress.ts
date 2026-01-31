"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  PROOF_PHASES,
  getPhaseForProgress,
  type ProofPhase,
  type ProofPhaseConfig,
} from "../config/proof-progress";

export interface ProofProgressState {
  /** Whether proof generation is in progress */
  isGenerating: boolean;
  /** Current progress percentage (0-100) */
  progress: number;
  /** Current phase of proof generation */
  phase: ProofPhase;
  /** Human-readable label for current phase */
  phaseLabel: string;
  /** Error message if proof generation failed */
  error: string | null;
}

export interface UseProofProgressReturn {
  /** Current proof progress state */
  state: ProofProgressState;
  /** Start progress tracking - call this before proof generation begins */
  startProgress: () => void;
  /** Complete progress successfully - call this when proof generation succeeds */
  completeProgress: () => void;
  /** Set an error state - call this when proof generation fails */
  setError: (error: string) => void;
  /** Reset the progress state */
  reset: () => void;
}

const INITIAL_STATE: ProofProgressState = {
  isGenerating: false,
  progress: 0,
  phase: "preparing",
  phaseLabel: "",
  error: null,
};

/**
 * Hook for managing proof generation progress feedback.
 *
 * Since snarkjs.groth16.fullProve() is atomic without progress callbacks,
 * this hook simulates realistic progress based on typical proof generation timing.
 * The progress updates smoothly through the phases while the actual proof
 * generation runs in the background.
 */
export function useProofProgress(): UseProofProgressReturn {
  const [state, setState] = useState<ProofProgressState>(INITIAL_STATE);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isActiveRef = useRef(false);

  // Calculate total duration from phases
  const totalDuration = PROOF_PHASES.reduce(
    (sum, phase) => sum + phase.estimatedDuration,
    0
  );

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const updateProgress = useCallback(() => {
    if (!isActiveRef.current || startTimeRef.current === null) return;

    const elapsed = Date.now() - startTimeRef.current;
    let currentProgress = 0;
    let accumulatedTime = 0;

    // Calculate progress based on elapsed time through phases
    for (const phase of PROOF_PHASES) {
      const phaseEnd = accumulatedTime + phase.estimatedDuration;

      if (elapsed <= accumulatedTime) {
        // Haven't reached this phase yet
        break;
      } else if (elapsed < phaseEnd) {
        // Currently in this phase
        const phaseProgress =
          (elapsed - accumulatedTime) / phase.estimatedDuration;
        currentProgress =
          phase.startPercent +
          phaseProgress * (phase.endPercent - phase.startPercent);
        break;
      } else {
        // Past this phase
        currentProgress = phase.endPercent;
      }

      accumulatedTime = phaseEnd;
    }

    // Cap at 95% until completeProgress is called
    // This prevents showing 100% before the actual operation completes
    currentProgress = Math.min(currentProgress, 95);

    const phaseConfig = getPhaseForProgress(currentProgress);

    setState((prev) => ({
      ...prev,
      progress: currentProgress,
      phase: phaseConfig.id,
      phaseLabel: phaseConfig.label,
    }));

    // Continue animation if still active and not at max simulated progress
    if (isActiveRef.current && currentProgress < 95) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, []);

  const startProgress = useCallback(() => {
    // Reset any existing animation
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    isActiveRef.current = true;
    startTimeRef.current = Date.now();

    const firstPhase = PROOF_PHASES[0];
    setState({
      isGenerating: true,
      progress: 0,
      phase: firstPhase.id,
      phaseLabel: firstPhase.label,
      error: null,
    });

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  }, [updateProgress]);

  const completeProgress = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    isActiveRef.current = false;
    startTimeRef.current = null;

    const lastPhase = PROOF_PHASES[PROOF_PHASES.length - 1];

    // First animate to 100%, then mark as complete after transition
    setState((prev) => ({
      ...prev,
      progress: 100,
      phase: lastPhase.id,
      phaseLabel: "Complete",
      error: null,
    }));

    // Wait for CSS transition (700ms) before setting isGenerating to false
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        isGenerating: false,
      }));
    }, 750);
  }, []);

  const setError = useCallback((error: string) => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    isActiveRef.current = false;
    startTimeRef.current = null;

    setState((prev) => ({
      ...prev,
      isGenerating: false,
      error,
    }));
  }, []);

  const reset = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    isActiveRef.current = false;
    startTimeRef.current = null;

    setState(INITIAL_STATE);
  }, []);

  return {
    state,
    startProgress,
    completeProgress,
    setError,
    reset,
  };
}
