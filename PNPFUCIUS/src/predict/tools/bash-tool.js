// Bash tool definition and implementation for Claude Predict

import { spawn } from 'child_process';

// Tool definition for Claude API
export const bashToolDefinition = {
    name: 'run_command',
    description: 'Execute a shell command and return output. Use for npm, git, and other CLI operations.',
    input_schema: {
        type: 'object',
        properties: {
            command: {
                type: 'string',
                description: 'The shell command to execute'
            },
            cwd: {
                type: 'string',
                description: 'Working directory for the command (default: current directory)'
            },
            timeout: {
                type: 'number',
                description: 'Timeout in milliseconds (default: 30000)'
            }
        },
        required: ['command']
    }
};

// Tool implementation
export async function executeBashTool(name, input) {
    if (name !== 'run_command') {
        return { error: `Unknown bash tool: ${name}` };
    }

    const { command, cwd, timeout = 30000 } = input;

    return new Promise((resolve) => {
        const isWindows = process.platform === 'win32';
        const shell = isWindows ? 'cmd.exe' : '/bin/sh';
        const shellFlag = isWindows ? '/c' : '-c';

        const proc = spawn(shell, [shellFlag, command], {
            cwd: cwd || process.cwd(),
            timeout,
            env: { ...process.env }
        });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        proc.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        proc.on('close', (code) => {
            resolve({
                command,
                exit_code: code,
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                success: code === 0
            });
        });

        proc.on('error', (err) => {
            resolve({
                command,
                error: err.message,
                success: false
            });
        });

        // Handle timeout
        setTimeout(() => {
            proc.kill();
            resolve({
                command,
                error: 'Command timed out',
                success: false
            });
        }, timeout);
    });
}
