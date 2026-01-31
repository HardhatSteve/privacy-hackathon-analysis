/**
 * Interpolate template variables
 * Replaces {variable} with values from the data object
 */
export function interpolate(
  template: string,
  data: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (key in data) {
      return String(data[key]);
    }
    return match; // Keep original if not found
  });
}

/**
 * Extract quoted content from evidence description
 */
export function extractQuotedContent(description: string): string | null {
  const match = description.match(/"([^"]+)"/);
  return match ? match[1] : null;
}

/**
 * Extract numeric values from text using a pattern
 */
export function extractNumber(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Shorten an address for display
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Extract entity names from evidence descriptions
 */
export function extractEntityNames(descriptions: string[]): string[] {
  const names: string[] = [];
  for (const desc of descriptions) {
    // Match patterns like "with Binance" or "interaction(s) with Coinbase"
    const match = desc.match(/with\s+([A-Z][a-zA-Z0-9\s]+?)(?:\s+\(|$|,|\.|:)/);
    if (match) {
      names.push(match[1].trim());
    }
  }
  return [...new Set(names)]; // Dedupe
}

/**
 * Parse a count from evidence description
 */
export function parseCountFromDescription(description: string): number {
  const match = description.match(/(\d+)\s+(?:transaction|interaction|transfer|time)/i);
  return match ? parseInt(match[1], 10) : 1;
}
