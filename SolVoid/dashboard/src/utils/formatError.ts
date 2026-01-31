/**
 * Universal error normalizer for Solana/Anchor/superstruct errors
 * Extracts non-enumerable fields and preserves structured error payloads
 */
export function formatError(err: unknown): string {
  if (err instanceof Error) {
    return err.stack ?? err.message
  }

  if (typeof err === "string") {
    return err
  }

  try {
    return JSON.stringify(err, Object.getOwnPropertyNames(err), 2)
  } catch {
    return String(err)
  }
}
