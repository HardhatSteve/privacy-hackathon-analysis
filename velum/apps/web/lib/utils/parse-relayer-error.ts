export function parseRelayerError(raw: string): string {
  const lower = raw.toLowerCase();

  if (lower.includes("insufficient funds for rent")) {
    return "Not enough SOL for transaction fees. Please add a small amount of SOL to your wallet.";
  }
  if (lower.includes("blockhash not found")) {
    return "Transaction expired. Please try again.";
  }
  if (lower.includes("custom program error: 0x1")) {
    return "Insufficient token balance for this deposit.";
  }

  // Extract the core message from "Simulation failed. \nMessage: <message> \nLogs: ..."
  const msgMatch = raw.match(/Message:\s*(.+?)(?:\s*\\n|\s*\n|$)/);
  if (msgMatch) {
    return msgMatch[1].trim();
  }

  // Truncate long raw errors
  if (raw.length > 120) {
    return raw.slice(0, 120) + "...";
  }
  return raw;
}
