import type { Issue } from '../types.js';
import { extractSnippet } from '../utils.js';

/**
 * PII patterns to detect in memo fields
 */
const PII_PATTERNS = [
  {
    name: 'email',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    severity: 'CRITICAL' as const,
    message: 'Email address detected in memo field'
  },
  {
    name: 'phone',
    regex: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    severity: 'CRITICAL' as const,
    message: 'Phone number detected in memo field'
  },
  {
    name: 'ssn',
    regex: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
    severity: 'CRITICAL' as const,
    message: 'Possible SSN detected in memo field'
  },
  {
    name: 'credit-card',
    regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    severity: 'CRITICAL' as const,
    message: 'Possible credit card number detected in memo field'
  },
  {
    name: 'url-with-params',
    regex: /https?:\/\/[^\s]+\?[^\s"'`]+/g,
    severity: 'HIGH' as const,
    message: 'URL with query parameters detected (may contain sensitive data)'
  },
  {
    name: 'name-pattern',
    regex: /\b(?:name|user|customer|client|person):\s*[A-Z][a-z]+\s+[A-Z][a-z]+/gi,
    severity: 'HIGH' as const,
    message: 'Possible personal name detected in memo field'
  }
];

/**
 * Detect personally identifiable information (PII) in transaction memos
 *
 * Scans for patterns like emails, phone numbers, SSNs, names, etc.
 * in memo fields and memo instructions.
 */
export function detectMemoPII(
  content: string,
  filePath: string
): Issue[] {
  const issues: Issue[] = [];
  const lines = content.split('\n');

  // Check if file references the Memo program (used for Buffer.from detection)
  const hasMemoProgram = /MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr/.test(content);

  lines.forEach((line, index) => {
    let memoValue: string | null = null;
    let columnOffset = 0;

    // Check for memo field assignments (memo: "..." or memo = "...")
    if (isMemoLine(line)) {
      memoValue = extractMemoValue(line);
      columnOffset = line.indexOf('memo') + 1;
    }
    // Also check for createMemoInstruction() calls
    else if (line.includes('createMemoInstruction') || line.includes('MemoInstruction')) {
      memoValue = extractMemoFromFunction(line);
      columnOffset = line.indexOf('Instruction') + 1;
    }
    // Check for Buffer.from('...') used as data in memo program instructions
    else if (hasMemoProgram && line.includes('Buffer.from(')) {
      memoValue = extractBufferFromValue(line);
      columnOffset = line.indexOf('Buffer.from') + 1;
    }

    if (memoValue) {
      // Check against all PII patterns
      for (const pattern of PII_PATTERNS) {
        const matches = memoValue.matchAll(pattern.regex);

        for (const match of matches) {
          const matchedText = match[0];

          issues.push({
            type: 'memo-pii',
            severity: pattern.severity,
            file: filePath,
            line: index + 1,
            column: columnOffset,
            message: pattern.message,
            suggestion: 'Remove personal information from memo fields. Use generic descriptions or omit memos entirely.',
            codeSnippet: extractSnippet(content, index + 1),
            identifier: `${pattern.name}: ${matchedText}`
          });
        }
      }

      // Check for PII variable interpolation in template literals
      // e.g., `Payment from ${userEmail}` or `${userName} sent`
      const piiVarMatches = memoValue.matchAll(/\$\{(\w*(?:email|name|user|phone|ssn|address|identity|account)\w*)\}/gi);
      for (const match of piiVarMatches) {
        issues.push({
          type: 'memo-pii',
          severity: 'HIGH',
          file: filePath,
          line: index + 1,
          column: columnOffset,
          message: `Variable '${match[1]}' interpolated into memo likely contains PII`,
          suggestion: 'Do not interpolate user-identifying variables into memo fields. Memos are permanently public on-chain.',
          codeSnippet: extractSnippet(content, index + 1),
          identifier: `pii-variable: ${match[1]}`
        });
      }

      // Additional check for descriptive content (might contain identifying info)
      if (isDescriptiveContent(memoValue)) {
        issues.push({
          type: 'memo-pii',
          severity: 'MEDIUM',
          file: filePath,
          line: index + 1,
          column: columnOffset,
          message: 'Descriptive memo content may contain identifying information',
          suggestion: 'Use generic memo text or omit memos. Remember that memos are permanently public on-chain.',
          codeSnippet: extractSnippet(content, index + 1),
          identifier: 'descriptive-content'
        });
      }
    }
  });

  return issues;
}

/**
 * Check if line contains a memo field assignment
 */
function isMemoLine(line: string): boolean {
  // Match various memo patterns:
  // memo: "..."
  // memo = "..."
  // "memo": "..."
  // { memo: "..." }
  return /\bmemo\s*[:=]\s*["'`]/.test(line) ||
         /["']memo["']\s*:\s*["'`]/.test(line);
}

/**
 * Extract the memo value from a line
 */
function extractMemoValue(line: string): string | null {
  // Try to extract string after memo: or memo =
  const patterns = [
    /\bmemo\s*[:=]\s*["'`]([^"'`]+)["'`]/,
    /["']memo["']\s*:\s*["'`]([^"'`]+)["'`]/
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      return match[1];
    }
  }

  // Try template literals
  const templateMatch = line.match(/\bmemo\s*[:=]\s*`([^`]+)`/);
  if (templateMatch) {
    return templateMatch[1];
  }

  return null;
}

/**
 * Extract memo value from function calls like createMemoInstruction("text")
 */
function extractMemoFromFunction(line: string): string | null {
  // Match createMemoInstruction("text") or similar
  const patterns = [
    /(?:create)?MemoInstruction\s*\(\s*["']([^"']+)["']/,
    /(?:create)?MemoInstruction\s*\(\s*`([^`]+)`/
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract string value from Buffer.from('...') or Buffer.from(`...`)
 */
function extractBufferFromValue(line: string): string | null {
  const patterns = [
    /Buffer\.from\(\s*["']([^"']+)["']/,
    /Buffer\.from\(\s*`([^`]+)`/
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Check if memo content is descriptive (might be identifying)
 */
function isDescriptiveContent(memo: string): boolean {
  // More than 20 characters and contains multiple words
  if (memo.length > 20 && /\s/.test(memo)) {
    return true;
  }

  // Contains specific identifying keywords
  const identifyingKeywords = [
    'payment to',
    'transfer to',
    'from',
    'for',
    'order',
    'invoice',
    'customer',
    'user',
    'account',
    'id',
    'ref',
    'reference'
  ];

  const lowerMemo = memo.toLowerCase();
  return identifyingKeywords.some(keyword => lowerMemo.includes(keyword));
}

/**
 * Get memo-related recommendations
 */
export function getMemoRecommendations(): string[] {
  return [
    'Never include personal information (names, emails, phone numbers) in transaction memos',
    'Avoid descriptive text that could link transactions to real-world identities',
    'Use generic memos like "Payment" or "Transfer" if you must include a memo',
    'Consider omitting memos entirely for privacy-sensitive transactions',
    'Remember: memos are permanently public and searchable on the blockchain',
    'For internal tracking, use off-chain databases linked by generic transaction IDs'
  ];
}
