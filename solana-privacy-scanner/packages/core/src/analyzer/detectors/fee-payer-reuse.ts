import { parse } from '@typescript-eslint/typescript-estree';
import type { TSESTree } from '@typescript-eslint/typescript-estree';
import type { Issue, SourceLocation } from '../types.js';
import { extractSnippet } from '../utils.js';
import { isNodeInsideNode } from './fee-payer-reuse-helper.js';

interface VariableUsage {
  name: string;
  declaration: SourceLocation;
  usages: SourceLocation[];
}

/**
 * Detect fee payer variable reuse across multiple transactions
 *
 * Pattern: A variable assigned to Keypair.generate() that is used
 * inside a loop or in multiple sequential calls.
 */
export function detectFeePayerReuseInCode(
  content: string,
  filePath: string
): Issue[] {
  const issues: Issue[] = [];

  try {
    const ast = parse(content, {
      loc: true,
      range: true,
      comment: false,
      jsx: true
    });

    // Track fee payer variables declared OUTSIDE loops
    const feePayerVars = new Map<string, VariableUsage>();
    const loops: any[] = [];

    // First pass: find loops and fee payer variables
    traverse(ast, (node) => {
      // Track all loops
      if (
        node.type === 'ForStatement' ||
        node.type === 'ForOfStatement' ||
        node.type === 'ForInStatement' ||
        node.type === 'WhileStatement' ||
        node.type === 'DoWhileStatement'
      ) {
        loops.push(node);
      }
    });

    // Second pass: find fee payer variables NOT inside loop bodies
    traverse(ast, (node) => {
      // Check variable declarations (e.g., const feePayer = Keypair.generate())
      if (
        node.type === 'VariableDeclarator' &&
        node.id.type === 'Identifier' &&
        node.init &&
        isKeypairGenerate(node.init)
      ) {
        const varName = node.id.name;
        if (isFeePayerName(varName)) {
          const isInsideLoop = loops.some(loop => {
            return isNodeInsideNode(node, loop.body);
          });

          if (!isInsideLoop) {
            feePayerVars.set(varName, {
              name: varName,
              declaration: {
                line: node.loc!.start.line,
                column: node.loc!.start.column,
                file: filePath
              },
              usages: []
            });
          }
        }
      }

      // Check function parameters (e.g., function foo(feePayer: Keypair))
      if (
        (node.type === 'FunctionDeclaration' ||
         node.type === 'FunctionExpression' ||
         node.type === 'ArrowFunctionExpression') &&
        node.params
      ) {
        for (const param of node.params) {
          const paramName = param.type === 'Identifier' ? param.name
            : (param.type === 'AssignmentPattern' && param.left.type === 'Identifier') ? param.left.name
            : null;

          if (paramName && isFeePayerName(paramName)) {
            feePayerVars.set(paramName, {
              name: paramName,
              declaration: {
                line: param.loc!.start.line,
                column: param.loc!.start.column,
                file: filePath
              },
              usages: []
            });
          }
        }
      }
    });

    // Third pass: check if these fee payers (declared outside) are used inside loops
    for (const [varName, varInfo] of feePayerVars) {
      for (const loop of loops) {
        traverse(loop.body, (node) => {
          // Check transaction call arguments (e.g., sendAndConfirmTransaction(conn, tx, [feePayer, sender]))
          if (node.type === 'CallExpression' && isTransactionCall(node)) {
            const feePayerArg = findFeePayerArgument(node);
            if (feePayerArg && feePayerArg.type === 'Identifier' && feePayerArg.name === varName) {
              varInfo.usages.push({
                line: node.loc!.start.line,
                column: node.loc!.start.column,
                file: filePath
              });
            }
          }

          // Check any function call that passes the fee payer as a direct argument
          // (e.g., sendSolWithSharedFeePayer(connection, feePayer, ...))
          if (node.type === 'CallExpression' && !isTransactionCall(node)) {
            for (const arg of node.arguments) {
              if (arg.type === 'Identifier' && arg.name === varName) {
                const alreadyTracked = varInfo.usages.some(
                  u => u.line === node.loc!.start.line && u.column === node.loc!.start.column
                );
                if (!alreadyTracked) {
                  varInfo.usages.push({
                    line: node.loc!.start.line,
                    column: node.loc!.start.column,
                    file: filePath
                  });
                }
                break;
              }
            }
          }

          // Check direct feePayer assignment (e.g., tx.feePayer = feePayer.publicKey)
          if (
            node.type === 'AssignmentExpression' &&
            node.left.type === 'MemberExpression' &&
            node.left.property.type === 'Identifier' &&
            node.left.property.name === 'feePayer'
          ) {
            const right = node.right;
            // feePayer.publicKey or just feePayer
            const assignedName = right.type === 'MemberExpression' && right.object.type === 'Identifier'
              ? right.object.name
              : right.type === 'Identifier' ? right.name : null;

            if (assignedName === varName) {
              varInfo.usages.push({
                line: node.loc!.start.line,
                column: node.loc!.start.column,
                file: filePath
              });
            }
          }
        });
      }

      // If used in a loop, that's a privacy leak
      if (varInfo.usages.length > 0) {
        issues.push({
          type: 'fee-payer-reuse',
          severity: 'CRITICAL',
          file: filePath,
          line: varInfo.declaration.line,
          column: varInfo.declaration.column,
          message: `Fee payer '${varName}' declared outside loop but reused inside`,
          suggestion: 'Move fee payer generation inside the loop: for (...) { const feePayer = Keypair.generate(); ... }',
          codeSnippet: extractSnippet(content, varInfo.declaration.line),
          identifier: varName,
          occurrences: varInfo.usages.length
        });
      }
    }

    // Also check for sequential reuse (multiple calls in sequence)
    const sequentialUsages = new Map<string, SourceLocation[]>();

    traverse(ast, (node) => {
      if (node.type === 'CallExpression' && isTransactionCall(node)) {
        const feePayerArg = findFeePayerArgument(node);
        if (feePayerArg && feePayerArg.type === 'Identifier') {
          const varName = feePayerArg.name;
          if (feePayerVars.has(varName)) {
            if (!sequentialUsages.has(varName)) {
              sequentialUsages.set(varName, []);
            }
            sequentialUsages.get(varName)!.push({
              line: node.loc!.start.line,
              column: node.loc!.start.column,
              file: filePath
            });
          }
        }
      }
    });

    // Check for multiple sequential usages (not already flagged from loop)
    for (const [varName, usages] of sequentialUsages) {
      if (usages.length > 1 && !issues.find(i => i.identifier === varName)) {
        const varInfo = feePayerVars.get(varName)!;
        issues.push({
          type: 'fee-payer-reuse',
          severity: 'CRITICAL',
          file: filePath,
          line: varInfo.declaration.line,
          column: varInfo.declaration.column,
          message: `Fee payer '${varName}' reused ${usages.length} times`,
          suggestion: 'Generate unique fee payer for each transaction: const feePayer = Keypair.generate()',
          codeSnippet: extractSnippet(content, varInfo.declaration.line),
          identifier: varName,
          occurrences: usages.length
        });
      }
    }

  } catch (error) {
    // If parsing fails, skip this file (might not be valid TypeScript/JavaScript)
    console.warn(`Failed to parse ${filePath}:`, error);
  }

  return issues;
}

/**
 * Simple AST traversal
 */
function traverse(
  node: any,
  visitor: (node: any) => void
): void {
  if (!node || typeof node !== 'object') return;

  visitor(node);

  for (const key in node) {
    if (key === 'loc' || key === 'range' || key === 'parent') continue;
    const child = node[key];

    if (Array.isArray(child)) {
      child.forEach(item => traverse(item, visitor));
    } else if (child && typeof child === 'object') {
      traverse(child, visitor);
    }
  }
}

/**
 * Check if a variable name suggests a fee payer
 */
function isFeePayerName(name: string): boolean {
  const lower = name.toLowerCase();
  return lower.includes('fee') || lower.includes('payer');
}

/**
 * Check if expression is Keypair.generate()
 */
function isKeypairGenerate(node: TSESTree.Expression): boolean {
  if (node.type === 'CallExpression') {
    const callee = node.callee;

    // Keypair.generate()
    if (
      callee.type === 'MemberExpression' &&
      callee.object.type === 'Identifier' &&
      callee.object.name === 'Keypair' &&
      callee.property.type === 'Identifier' &&
      callee.property.name === 'generate'
    ) {
      return true;
    }

    // web3.Keypair.generate()
    if (
      callee.type === 'MemberExpression' &&
      callee.object.type === 'MemberExpression' &&
      callee.object.property.type === 'Identifier' &&
      callee.object.property.name === 'Keypair' &&
      callee.property.type === 'Identifier' &&
      callee.property.name === 'generate'
    ) {
      return true;
    }
  }

  // await Keypair.generate()
  if (node.type === 'AwaitExpression' && node.argument) {
    return isKeypairGenerate(node.argument);
  }

  return false;
}

/**
 * Check if call expression is a transaction-related call
 */
function isTransactionCall(node: TSESTree.CallExpression): boolean {
  const callee = node.callee;

  if (callee.type === 'Identifier') {
    const name = callee.name;
    return name === 'sendTransaction' ||
           name === 'sendAndConfirmTransaction' ||
           name === 'transfer';
  }

  if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
    const name = callee.property.name;
    return name === 'sendTransaction' ||
           name === 'sendAndConfirmTransaction' ||
           name === 'send' ||
           name === 'transfer';
  }

  return false;
}

/**
 * Find fee payer argument in transaction call
 * Typically the second or third argument, or in an options object
 */
function findFeePayerArgument(
  node: TSESTree.CallExpression
): TSESTree.Expression | null {
  // Check if arguments include an array of signers
  for (const arg of node.arguments) {
    if (arg.type === 'ArrayExpression') {
      const elements = arg.elements.filter(e => e !== null);
      // Check all elements for fee payer names (first element is convention)
      for (const el of elements) {
        if (el && el.type === 'Identifier' && isFeePayerName(el.name)) {
          return el;
        }
      }
      // Fallback: return first element (fee payer is conventionally first)
      if (elements.length > 0) {
        const first = elements[0];
        if (first && first.type !== 'SpreadElement') {
          return first;
        }
      }
    }

    // Check for options object with feePayer property
    if (arg.type === 'ObjectExpression') {
      for (const prop of arg.properties) {
        if (
          prop.type === 'Property' &&
          prop.key.type === 'Identifier' &&
          (prop.key.name === 'feePayer' || prop.key.name === 'payer') &&
          prop.value.type === 'Identifier'
        ) {
          return prop.value;
        }
      }
    }
  }

  return null;
}
