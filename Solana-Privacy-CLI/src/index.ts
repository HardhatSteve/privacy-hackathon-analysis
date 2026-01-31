#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";
import * as dotenv from "dotenv";
import ora from "ora";
import { deployToken } from "./commands/deploy";
import { deployLibrary, deployVerifiers } from "./commands/helpers";
import { initConfig } from "./commands/init";
import { registerUser } from "./commands/user";
import { validateNetwork } from "./utils/validation";
import { mintPrivate, burnPrivate, transferPrivate, withdrawPrivate } from "./commands/encrypted";

dotenv.config();

const program = new Command();

program
  .name("deploy-eerc")
  .description("CLI tool for deploying and managing private ERC-20 tokens")
  .version("1.0.0");

// Global options for all commands
program
  .option("-n, --network <network>", "Network to use (default: fuji)", "fuji")
  .option("-g, --gas-price <price>", "Gas price in gwei")
  .option("-s, --speed <speed>", "Transaction speed (slow|normal|fast)", "normal")
  .option("-y, --yes", "Skip confirmation prompts", false);

program
  .command("init")
  .description("Initialize configuration for token deployment")
  .action(async () => {
    const spinner = ora("Initializing configuration...").start();
    try {
      await initConfig();
      spinner.succeed("Configuration initialized successfully");
    } catch (error: any) {
      spinner.fail("Failed to initialize configuration");
      console.error(chalk.red(error?.message || "Unknown error"));
      process.exit(1);
    }
  });

program
  .command("standalone")
  .description("Deploy a new private ERC-20 token")
  .requiredOption("-n, --name <name>", "Token name")
  .requiredOption("-s, --symbol <symbol>", "Token symbol")
  .requiredOption("-t, --total-supply <supply>", "Total token supply")
  .option("-d, --decimals <decimals>", "Number of decimals", "18")
  .action(async (options) => {
    const spinner = ora("Deploying private token...").start();
    try {
      // Validate network configuration
      const networkConfig = await validateNetwork(program.opts().network);

      // Deploy required verifiers and library
      spinner.text = "Deploying verifier contracts...";
      const verifiers = await deployVerifiers(networkConfig);

      spinner.text = "Deploying BabyJubJub library...";
      const library = await deployLibrary(networkConfig);

      // Deploy the token
      spinner.text = "Deploying private token...";
      const tokenAddress = await deployToken({
        ...options,
        network: networkConfig,
        verifiers,
        library,
        mode: "standalone"
      });

      spinner.succeed(
        `Private token deployed successfully at ${chalk.green(tokenAddress)}`,
      );
    } catch (error: any) {
      spinner.fail("Token deployment failed");
      console.error(chalk.red(error?.message || "Unknown error"));
      process.exit(1);
    }
  });

program
  .command("converter")
  .description("Convert an existing ERC-20 token to private")
  .requiredOption("-a, --address <address>", "Existing token address")
  .action(async (options) => {
    const spinner = ora("Converting token to private...").start();
    try {
      // Validate network configuration
      const networkConfig = await validateNetwork(program.opts().network);

      // Deploy required verifiers and library
      spinner.text = "Deploying verifier contracts...";
      const verifiers = await deployVerifiers(networkConfig);

      spinner.text = "Deploying BabyJubJub library...";
      const library = await deployLibrary(networkConfig);

      // Deploy the converter
      spinner.text = "Deploying token converter...";
      const tokenAddress = await deployToken({
        ...options,
        network: networkConfig,
        verifiers,
        library,
        mode: "converter"
      });

      spinner.succeed("Token converted to private successfully");
    } catch (error: any) {
      spinner.fail("Token conversion failed");
      console.error(chalk.red(error?.message || "Unknown error"));
      process.exit(1);
    }
  });

program
  .command("register")
  .description("Register a new user")
  .option("-k, --key <key>", "Private key (optional, will generate if not provided)")
  .action(async (options) => {
    const spinner = ora("Registering user...").start();
    try {
      const networkConfig = await validateNetwork(program.opts().network);
      const user = await registerUser(networkConfig, options.key);
      spinner.succeed("User registered successfully");
      console.log(chalk.green("Public Key:"), user.publicKey);
      console.log(chalk.green("Address:"), user.address);
    } catch (error: any) {
      spinner.fail("User registration failed");
      console.error(chalk.red(error?.message || "Unknown error"));
      process.exit(1);
    }
  });

program
  .command("mint")
  .description("Mint tokens privately")
  .requiredOption("-a, --amount <amount>", "Amount of tokens to mint")
  .requiredOption("-t, --token <address>", "Token contract address")
  .option("-r, --recipient <address>", "Recipient address (defaults to sender)")
  .action(async (options) => {
    const spinner = ora("Minting tokens privately...").start();
    try {
      const networkConfig = await validateNetwork(program.opts().network);
      await mintPrivate(networkConfig, options);
      spinner.succeed("Tokens minted privately successfully");
    } catch (error: any) {
      spinner.fail("Private minting failed");
      console.error(chalk.red(error?.message || "Unknown error"));
      process.exit(1);
    }
  });

program
  .command("transfer")
  .description("Transfer tokens privately")
  .requiredOption("-a, --amount <amount>", "Amount of tokens to transfer")
  .requiredOption("-t, --token <address>", "Token contract address")
  .requiredOption("-r, --recipient <address>", "Recipient address")
  .option("-m, --memo <memo>", "Transfer memo (optional)")
  .action(async (options) => {
    const spinner = ora("Transferring tokens privately...").start();
    try {
      const networkConfig = await validateNetwork(program.opts().network);
      await transferPrivate(networkConfig, options);
      spinner.succeed("Tokens transferred privately successfully");
    } catch (error: any) {
      spinner.fail("Private transfer failed");
      console.error(chalk.red(error?.message || "Unknown error"));
      process.exit(1);
    }
  });

program
  .command("burn")
  .description("Burn tokens privately")
  .requiredOption("-a, --amount <amount>", "Amount of tokens to burn")
  .requiredOption("-t, --token <address>", "Token contract address")
  .action(async (options) => {
    const spinner = ora("Burning tokens privately...").start();
    try {
      const networkConfig = await validateNetwork(program.opts().network);
      await burnPrivate(networkConfig, options);
      spinner.succeed("Tokens burned privately successfully");
    } catch (error: any) {
      spinner.fail("Private burning failed");
      console.error(chalk.red(error?.message || "Unknown error"));
      process.exit(1);
    }
  });

program
  .command("withdraw")
  .description("Withdraw tokens (converter mode only)")
  .requiredOption("-a, --amount <amount>", "Amount of tokens to withdraw")
  .requiredOption("-t, --token <address>", "Token contract address")
  .option("-r, --recipient <address>", "Recipient address (defaults to sender)")
  .action(async (options) => {
    const spinner = ora("Withdrawing tokens...").start();
    try {
      const networkConfig = await validateNetwork(program.opts().network);
      await withdrawPrivate(networkConfig, options);
      spinner.succeed("Tokens withdrawn successfully");
    } catch (error: any) {
      spinner.fail("Withdrawal failed");
      console.error(chalk.red(error?.message || "Unknown error"));
      process.exit(1);
    }
  });

// Add help text for common errors
program.on('--help', () => {
  console.log('\nCommon Issues:');
  console.log('  Network Connection: Ensure you have proper network configuration in .env');
  console.log('  Gas Issues: Use --gas-price option to specify custom gas price');
  console.log('  Transaction Speed: Use --speed option to adjust transaction speed');
  console.log('\nExamples:');
  console.log('  $ deploy-eerc standalone -n MyToken -s MTK -t 1000000');
  console.log('  $ deploy-eerc converter -a 0x1234...');
  console.log('  $ deploy-eerc register');
  console.log('  $ deploy-eerc transfer -t 0x1234... -a 100 -r 0x5678...');
});

program.parse();
