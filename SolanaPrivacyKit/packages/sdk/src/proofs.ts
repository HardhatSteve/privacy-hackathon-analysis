import { getDefaultClient } from "./client.js";

/**
 * Verify a ZK proof against public inputs (uses client backend).
 * - Mock backend: validates proof format (hex/base64), returns true for demo.
 * - ShadowWire backend: uses Bulletproofs verifyRangeProof(proofBytes, commitmentBytes) when publicInputs[0] is commitment (hex).
 * - Fallback: backend may stub and return true for demo.
 */
export async function verifyZKProof(
  proof: string | Buffer,
  publicInputs: string[]
): Promise<boolean> {
  return getDefaultClient().backend.verifyProof(proof, publicInputs);
}

export { validateProofFormat } from "./proof-utils.js";
