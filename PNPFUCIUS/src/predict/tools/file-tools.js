// File tool definitions and implementations for Claude Predict

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Tool definitions for Claude API
export const fileToolDefinitions = [
    {
        name: 'read_file',
        description: 'Read contents of a file',
        input_schema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Path to the file to read'
                }
            },
            required: ['path']
        }
    },
    {
        name: 'write_file',
        description: 'Write content to a file',
        input_schema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Path to the file to write'
                },
                content: {
                    type: 'string',
                    description: 'Content to write to the file'
                }
            },
            required: ['path', 'content']
        }
    },
    {
        name: 'list_files',
        description: 'List files in a directory',
        input_schema: {
            type: 'object',
            properties: {
                path: {
                    type: 'string',
                    description: 'Directory path (default: current directory)'
                },
                pattern: {
                    type: 'string',
                    description: 'Optional glob pattern to filter files'
                }
            }
        }
    }
];

// Tool implementations
export async function executeFileTool(name, input) {
    switch (name) {
        case 'read_file': {
            const filePath = resolve(input.path);

            if (!existsSync(filePath)) {
                return { error: `File not found: ${input.path}` };
            }

            try {
                const content = readFileSync(filePath, 'utf-8');
                return {
                    path: input.path,
                    content,
                    size: content.length,
                    lines: content.split('\n').length
                };
            } catch (err) {
                return { error: `Failed to read file: ${err.message}` };
            }
        }

        case 'write_file': {
            const filePath = resolve(input.path);

            try {
                writeFileSync(filePath, input.content, 'utf-8');
                return {
                    success: true,
                    path: input.path,
                    size: input.content.length,
                    lines: input.content.split('\n').length
                };
            } catch (err) {
                return { error: `Failed to write file: ${err.message}` };
            }
        }

        case 'list_files': {
            const { readdirSync, statSync } = await import('fs');
            const dirPath = resolve(input.path || '.');

            if (!existsSync(dirPath)) {
                return { error: `Directory not found: ${input.path}` };
            }

            try {
                const entries = readdirSync(dirPath);
                const files = entries.map(entry => {
                    const fullPath = resolve(dirPath, entry);
                    const stat = statSync(fullPath);
                    return {
                        name: entry,
                        type: stat.isDirectory() ? 'directory' : 'file',
                        size: stat.isFile() ? stat.size : null
                    };
                });

                // Filter by pattern if provided
                let filtered = files;
                if (input.pattern) {
                    const regex = new RegExp(
                        input.pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
                    );
                    filtered = files.filter(f => regex.test(f.name));
                }

                return {
                    path: input.path || '.',
                    files: filtered,
                    total: filtered.length
                };
            } catch (err) {
                return { error: `Failed to list directory: ${err.message}` };
            }
        }

        default:
            return { error: `Unknown file tool: ${name}` };
    }
}
