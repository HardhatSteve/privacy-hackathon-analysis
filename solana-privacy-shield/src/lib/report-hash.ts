/**
 * Report Hash Generation Utility
 * Computes SHA-256 hash over report payload for on-chain anchoring
 */

import type { AnalysisResult } from "./api";

export interface ReportHashPayload {
  wallet_address: string;
  metrics_json: string;
  scoring_version: string;
  analysis_timestamp: number;
}

const SCORING_VERSION = "1.0.0";

/**
 * Generates a deterministic hash payload from analysis results
 */
export function createHashPayload(data: AnalysisResult): ReportHashPayload {
  return {
    wallet_address: data.wallet,
    metrics_json: JSON.stringify({
      score: data.score,
      metrics: data.metrics,
      meta: data.meta,
    }),
    scoring_version: SCORING_VERSION,
    analysis_timestamp: Date.now(),
  };
}

/**
 * Computes SHA-256 hash using WebCrypto API
 * Returns both the hash as Uint8Array and hex string
 */
export async function computeReportHash(payload: ReportHashPayload): Promise<{
  hash: Uint8Array;
  hashHex: string;
  payload: ReportHashPayload;
}> {
  const dataString = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(dataString);
  
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = new Uint8Array(hashBuffer);
  
  // Convert to hex string for display
  const hashHex = Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  return {
    hash: hashArray,
    hashHex,
    payload,
  };
}

/**
 * Verifies a report hash against stored payload
 */
export async function verifyReportHash(
  payload: ReportHashPayload,
  expectedHashHex: string
): Promise<boolean> {
  const { hashHex } = await computeReportHash(payload);
  return hashHex === expectedHashHex;
}
