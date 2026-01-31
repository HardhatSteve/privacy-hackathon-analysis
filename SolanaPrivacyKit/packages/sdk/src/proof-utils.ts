/**
 * Proof format validation for stub/demo verification.
 * Validates hex or base64 proof format; does not verify cryptographic soundness.
 */
const HEX_RE = /^[0-9a-fA-F]+$/;

function isHex(s: string): boolean {
  return s.length > 0 && s.length % 2 === 0 && HEX_RE.test(s);
}

function isBase64(s: string): boolean {
  if (s.length === 0) return false;
  if (!/^[A-Za-z0-9+/]+=*$/.test(s)) return false;
  try {
    const b = Buffer.from(s, "base64");
    return b.length > 0;
  } catch {
    return false;
  }
}

/**
 * Validate proof format for demo/stub: non-empty proof, optional publicInputs array.
 * Accepts hex string, base64 string, or Buffer. Returns true when format looks valid.
 */
export function validateProofFormat(proof: string | Buffer, publicInputs: string[]): boolean {
  if (proof == null) return false;
  if (typeof publicInputs !== "object" || !Array.isArray(publicInputs)) return false;
  if (Buffer.isBuffer(proof)) {
    return proof.length > 0;
  }
  if (typeof proof !== "string") return false;
  const trimmed = proof.trim();
  if (trimmed.length === 0) return false;
  return isHex(trimmed) || isBase64(trimmed);
}
