import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import type { Issue } from './types.js';

const CODE_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx'];

/**
 * Read file content as string
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error}`);
  }
}

/**
 * Expand a path into glob patterns.
 * If the path is a directory, append code file globs.
 * If it's already a glob or file path, return as-is.
 */
async function expandPattern(pattern: string): Promise<string[]> {
  try {
    const cleaned = pattern.replace(/\/+$/, '');
    const stat = await fs.stat(cleaned);
    if (stat.isDirectory()) {
      return CODE_EXTENSIONS.map(ext => path.join(cleaned, '**', `*.${ext}`));
    }
  } catch {
    // Not a real path — treat as a glob pattern
  }
  return [pattern];
}

/**
 * Find files matching patterns
 */
export async function findFiles(
  patterns: string[],
  options?: { exclude?: string[] }
): Promise<string[]> {
  const files: string[] = [];

  for (const pattern of patterns) {
    const expanded = await expandPattern(pattern);
    for (const p of expanded) {
      const matches = await glob(p, {
        ignore: options?.exclude || [],
        nodir: true,
        absolute: true
      });
      files.push(...matches);
    }
  }

  return [...new Set(files)]; // Remove duplicates
}

/**
 * Extract code snippet around a location
 */
export function extractSnippet(
  content: string,
  line: number,
  contextLines: number = 2
): string {
  const lines = content.split('\n');
  const startLine = Math.max(0, line - 1 - contextLines);
  const endLine = Math.min(lines.length, line + contextLines);

  return lines
    .slice(startLine, endLine)
    .map((l, idx) => {
      const lineNum = startLine + idx + 1;
      const marker = lineNum === line ? '> ' : '  ';
      return `${marker}${lineNum.toString().padStart(4)} | ${l}`;
    })
    .join('\n');
}

/**
 * Check if file is TypeScript or JavaScript
 */
export function isCodeFile(filePath: string): boolean {
  const ext = path.extname(filePath);
  return ['.ts', '.tsx', '.js', '.jsx'].includes(ext);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Group issues by file
 */
export function groupIssuesByFile(issues: Issue[]): Map<string, Issue[]> {
  const grouped = new Map<string, Issue[]>();

  for (const issue of issues) {
    const fileIssues = grouped.get(issue.file) || [];
    fileIssues.push(issue);
    grouped.set(issue.file, fileIssues);
  }

  return grouped;
}

/**
 * Sort issues by severity then line number
 */
export function sortIssues(issues: Issue[]): Issue[] {
  const severityOrder: Record<Issue['severity'], number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3
  };

  return issues.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;

    // Same severity, sort by file then line
    if (a.file !== b.file) return a.file.localeCompare(b.file);
    return a.line - b.line;
  });
}
