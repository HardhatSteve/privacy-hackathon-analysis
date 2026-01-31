#!/usr/bin/env node

/**
 * SolVoid CLI
 */

import { PublicKey, Keypair, Connection } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import fetch from 'cross-fetch';
import { SolVoidClient, WalletAdapter } from '../sdk/client';
import { DataOrigin, DataTrust, Unit, enforce, PublicKeySchema, IdlSchema } from '../sdk/integrity';
import { registerGhostCommand } from './commands/ghost';
import { registerRescueCommand } from './commands/rescue';
import { Command } from 'commander';

dotenv.config();

const CLI_METADATA = {
    origin: DataOrigin.CLI_ARG,
    trust: DataTrust.UNTRUSTED,
    createdAt: Date.now(),
    owner: 'CLI User'
};

function registerAdminCommand(program: Command, client: SolVoidClient) {
    const admin = program.command('admin').description('Protocol Administration & Emergency Controls');

    admin
        .command('trigger-emergency')
        .description('Trigger protocol-wide emergency fee multiplier')
        .argument('<multiplier>', 'Fee multiplier (1-10)')
        .argument('<reason>', 'Reason for emergency')
        .action(async (multiplier, reason) => {
            console.log(`Triggering emergency mode (x${multiplier}) for: ${reason}`);
            const tx = await client.triggerEmergencyMode(BigInt(multiplier), reason);
            console.log(`Emergency mode active. Signature: ${tx}`);
        });

    admin
        .command('disable-emergency')
        .description('Deactivate emergency mode and reset fees')
        .action(async () => {
            console.log('Deactivating emergency mode...');
            const tx = await client.disableEmergencyMode();
            console.log(`Emergency mode disabled. Signature: ${tx}`);
        });

    admin
        .command('pause')
        .description('Pause all withdrawals via Circuit Breaker')
        .action(async () => {
            console.log('Triggering Circuit Breaker...');
            const tx = await client.triggerCircuitBreaker();
            console.log(`Protocol PAUSED. Signature: ${tx}`);
        });

    admin
        .command('resume')
        .description('Resume withdrawals and reset circuit breaker')
        .action(async () => {
            console.log('Resetting Circuit Breaker...');
            const tx = await client.resetCircuitBreaker();
            console.log(`Protocol RESUMED. Signature: ${tx}`);
        });
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || args.includes('--help')) {
        console.log(`
SolVoid: The Digital Fortress for Solana

Commands:
  protect <address>    Scan address for leaks and view Privacy Passport
  rescue <address>     Atomic shielding of all leaked assets
  shield <amount>      Execute a private deposit (Surgical Shielding)
  withdraw <secret> <nullifier> <recipient>   Unlinkable ZK withdrawal
  ghost <address>      Calculate Privacy Ghost Score
`);
        process.exit(0);
    }

    if (command === 'ghost') {
        const { Command } = await import('commander');
        const program = new Command();
        registerGhostCommand(program);
        program.parse();
        return;
    }

    if (command === 'rescue') {
        const { Command } = await import('commander');
        const program = new Command();
        registerRescueCommand(program);
        program.parse();
        return;
    }

    const rpcUrl = args.includes('--rpc') ? args[args.indexOf('--rpc') + 1] : (process.env.RPC_URL || 'https://api.mainnet-beta.solana.com');
    const programId = args.includes('--program') ? args[args.indexOf('--program') + 1] : (process.env.PROGRAM_ID || 'Fg6PaFpoGXkYsidMpSsu3SWJYEHp7rQU9YSTFNDQ4F5i');
    const relayerUrl = args.includes('--relayer') ? args[args.indexOf('--relayer') + 1] : (process.env.SHADOW_RELAYER_URL || 'http://localhost:3000');

    // Rule 10: Validate Config Boundary
    if (!rpcUrl || !programId) throw new Error("Missing required configuration (RPC_URL or PROGRAM_ID)");

    const wallet = Keypair.generate();
    const config = {
        rpcUrl: rpcUrl ?? '',
        programId: programId ?? '',
        relayerUrl: relayerUrl ?? ''
    };
    const client = new SolVoidClient(config, wallet as unknown as WalletAdapter);

    const program = new Command();
    program.name('solvoid-scan').description('SolVoid Digital Fortress CLI');

    // Add global options for usage by subcommands
    program.option('--rpc <url>', 'Solana RPC URL', rpcUrl);
    program.option('--program <id>', 'SolVoid Program ID', programId);
    program.option('--relayer <url>', 'Shadow Relayer URL', relayerUrl);

    // Register modular commands
    registerGhostCommand(program);
    registerRescueCommand(program);
    registerAdminCommand(program, client);

    if (command === 'ghost' || command === 'rescue' || command === 'admin') {
        program.parse(process.argv);
        return;
    }

    try {
        switch (command) {
            case 'protect': {
                const rawAddress = args[1];
                if (!rawAddress) throw new Error("Missing address");

                // Boundary Enforcement: CLI -> Logic (Rule 10)
                const enforcedAddr = enforce(PublicKeySchema, rawAddress, CLI_METADATA);
                const address = new PublicKey(enforcedAddr.value);

                console.log(`\nScanning ${address.toBase58()}...`);

                const passport = await client.getPassport(address.toBase58());
                const results = await client.protect(address);

                console.log(`\n--- PRIVACY PASSPORT ---`);
                const scoreColor = passport.overallScore < 50 ? '\x1b[31m' : passport.overallScore < 80 ? '\x1b[33m' : '\x1b[32m';
                console.log(`Overall Score: ${scoreColor}${passport.overallScore}/100\x1b[0m`);
                console.log(`Badges: ${passport.badges.map(b => b.icon + ' ' + b.name).join(', ') || 'None'}`);

                results.forEach((res) => {
                    console.log(`\n---------------------------------------------------------`);
                    console.log(`Signature: ${res.signature}`);
                    if (res.leaks.length > 0) {
                        res.leaks.forEach((leak) => {
                            const sevColor = leak.severity === 'CRITICAL' ? '\x1b[31m' : '\x1b[33m';
                            console.log(`  - [${sevColor}${leak.severity}\x1b[0m] ${leak.description}`);
                        });
                    }
                });
                break;
            }

            case 'rescue': {
                const rawAddress = args[1];
                if (!rawAddress) throw new Error("Missing address");

                const enforcedAddr = enforce(PublicKeySchema, rawAddress, CLI_METADATA);
                const address = new PublicKey(enforcedAddr.value);

                console.log(`\nExecuting rescue for: ${address.toBase58()}`);
                const result = await client.rescue(address);

                if (result.status === 'analysis_complete') {
                    console.log(`\nRescue analysis complete.`);
                    console.log(`Leaks found: ${result.leakCount}`);
                    console.log(`Current Score: ${result.currentScore} -> Potential: ${result.potentialScore}`);
                } else {
                    console.log(`\n${result.message}`);
                }
                break;
            }

            case 'shield': {
                const amountSolRaw = args[1];
                if (!amountSolRaw) throw new Error("Missing amount");

                const amountSol = parseFloat(amountSolRaw);
                if (isNaN(amountSol) || amountSol <= 0) throw new Error("Invalid amount");

                // Rule 6: Explicit Transformation - SOL to LAMPORT
                const amountLamports = Math.floor(amountSol * 1_000_000_000);

                console.log(`Shielding ${amountSol} SOL (${amountLamports} Lamports)...`);
                const { commitmentData } = await client.shield(amountLamports);

                console.log('\n--- SAVE THESE SECRETS ---');
                console.log('Secret:', commitmentData.secret);
                console.log('Nullifier:', commitmentData.nullifier);
                console.log('Commitment:', commitmentData.commitmentHex);
                break;
            }

            case 'withdraw': {
                const secret = args[1];
                const nullifier = args[2];
                const rawRecipient = args[3];
                const amountRaw = args[4];

                if (!secret || !nullifier || !rawRecipient || !amountRaw) throw new Error("Missing withdrawal params");

                const enforcedRecipient = enforce(PublicKeySchema, rawRecipient, CLI_METADATA);
                const recipient = enforcedRecipient.value;
                const amount = BigInt(Math.floor(parseFloat(amountRaw) * 1_000_000_000));

                console.log(`Preparing withdrawal of ${amountRaw} SOL to ${recipient}...`);

                console.log(`Fetching commitments from: ${relayerUrl}...`);
                const response = await fetch(`${relayerUrl}/commitments`);
                if (!response.ok) throw new Error(`Relayer error: ${response.statusText}`);

                const data = (await response.json()) as { commitments: string[] };
                const commitmentsHex = data.commitments;

                console.log(`Generating ZK proof...`);
                const result = await client.prepareWithdrawal(
                    secret,
                    nullifier,
                    amount,
                    new PublicKey(recipient),
                    commitmentsHex,
                    './withdraw.wasm',
                    './withdraw.zkey'
                );

                console.log('\nWithdrawal Proof Ready:');
                console.log('Nullifier Hash:', result.nullifierHash);
                console.log('Root:', result.root);
                console.log('Proof Size:', result.proof.length, 'bytes');
                break;
            }

            default:
                console.error(`Unknown command: ${command}`);
                process.exit(1);
        }
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        console.error('\x1b[31mError:\x1b[0m', msg);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
