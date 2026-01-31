import type { ExposureResult, AnalysisProgress } from '../types/exposure';

// In production, use relative path (same domain). In dev, use local server.
const API_BASE = import.meta.env.VITE_API_URL || '';

export async function analyzeWalletViaApi(
  address: string,
  onProgress?: (progress: AnalysisProgress) => void
): Promise<ExposureResult> {
  onProgress?.({ step: 'Connecting to server...', progress: 10 });

  const response = await fetch(`${API_BASE}/api/analyze/${address}`);

  onProgress?.({ step: 'Analyzing wallet...', progress: 50 });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
    throw new Error(error.error?.message || `HTTP ${response.status}`);
  }

  onProgress?.({ step: 'Processing results...', progress: 90 });

  const result = await response.json();

  onProgress?.({ step: 'Analysis complete', progress: 100 });

  return {
    ...result,
    analyzedAt: new Date(result.analyzedAt),
  };
}

export function isValidSolanaAddress(address: string): boolean {
  // Basic client-side validation (44 char base58)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}
