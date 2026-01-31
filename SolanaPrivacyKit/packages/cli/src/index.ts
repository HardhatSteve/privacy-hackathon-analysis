#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { readFileSync, existsSync } from "fs";
import {
  shieldAmount,
  createPrivateTransfer,
  verifyZKProof,
  loadFromEnv,
  DEFAULT_RPC_URL,
  PrivacyClient,
  setDefaultClient,
  type Config,
} from "@privacy-devkit/sdk";
import { loadConfig, writeConfig } from "./config-loader.js";

const program = new Command();

function getConfig(opts: {
  rpcUrl?: string;
  network?: string;
  shadowwireApiKey?: string;
  shadowwireWallet?: string;
  backend?: string;
}): Config {
  const file = loadConfig();
  const env = loadFromEnv();
  const rpcUrl = opts.rpcUrl ?? file?.rpcUrl ?? env.rpcUrl ?? DEFAULT_RPC_URL;
  const shadowwireApiKey = opts.shadowwireApiKey ?? file?.shadowwireApiKey ?? env.shadowwireApiKey;
  const shadowwireWallet = opts.shadowwireWallet ?? file?.shadowwireWallet ?? env.shadowwireWallet;
  return {
    rpcUrl,
    network: "devnet",
    ...(shadowwireApiKey ? { shadowwireApiKey } : {}),
    ...(shadowwireWallet ? { shadowwireWallet } : {}),
  };
}

function ensureBackend(opts: {
  backend?: string;
  rpcUrl?: string;
  network?: string;
  shadowwireApiKey?: string;
  shadowwireWallet?: string;
}): void {
  if (!opts.backend) return;
  const config = getConfig(opts);
  const client = new PrivacyClient(config);
  client.setBackend(opts.backend as "mock" | "shadowwire" | "arcium");
  setDefaultClient(client);
}

program
  .name("privacy")
  .description("Solana Privacy Devkit CLI (devnet only)")
  .version("1.0.0");

program
  .command("init")
  .description("Create .privacy/config.json with rpcUrl, network, optional ShadowWire")
  .option("-r, --rpc-url <url>", "Devnet RPC URL", DEFAULT_RPC_URL)
  .option("-n, --network <name>", "Network (devnet only)", "devnet")
  .option("--shadowwire-api-key <key>", "ShadowWire API key (optional)")
  .option("--shadowwire-wallet <address>", "ShadowWire wallet for deposit/transfer")
  .action((opts) => {
    const rpcUrl = opts.rpcUrl ?? DEFAULT_RPC_URL;
    const network = (opts.network === "devnet" ? "devnet" : "devnet") as "devnet";
    const dir = process.cwd();
    writeConfig(dir, {
      rpcUrl,
      network,
      ...(opts.shadowwireApiKey ? { shadowwireApiKey: opts.shadowwireApiKey } : {}),
      ...(opts.shadowwireWallet ? { shadowwireWallet: opts.shadowwireWallet } : {}),
    });
    console.log(chalk.green("Created"), chalk.cyan(".privacy/config.json"));
    console.log(chalk.gray("  rpcUrl:"), rpcUrl);
    console.log(chalk.gray("  network:"), network);
    if (opts.shadowwireApiKey) console.log(chalk.gray("  shadowwireApiKey:"), "(set)");
    if (opts.shadowwireWallet) console.log(chalk.gray("  shadowwireWallet:"), opts.shadowwireWallet);
  });

program
  .command("shield <amount> <token>")
  .description("Shield amount of token (calls SDK shieldAmount)")
  .option("--backend <name>", "Backend: mock | shadowwire", "mock")
  .option("--rpc-url <url>", "Override RPC URL")
  .option("--network <name>", "Override network (devnet only)")
  .action(
    async (
      amountStr: string,
      token: string,
      opts: { backend?: string; rpcUrl?: string; network?: string }
    ) => {
      const amount = Number(amountStr);
      if (Number.isNaN(amount) || amount <= 0) {
        console.error(chalk.red("Error: amount must be a positive number"));
        process.exit(1);
      }
      ensureBackend(opts);
      try {
        const result = await shieldAmount(amount, token);
        console.log(chalk.green("Shield result:"));
        console.log(chalk.gray("  success:"), result.success);
        if (result.txId) console.log(chalk.gray("  txId:"), result.txId);
        if (result.commitment) console.log(chalk.gray("  commitment:"), result.commitment);
        if (result.unsignedTransaction)
          console.log(chalk.gray("  unsignedTransaction:"), "(base64, sign and send)");
      } catch (err) {
        console.error(chalk.red("Error:"), err instanceof Error ? err.message : err);
        process.exit(1);
      }
    }
  );

program
  .command("transfer <recipient> <amount>")
  .description("Create private transfer (calls SDK createPrivateTransfer)")
  .option("--backend <name>", "Backend: mock | shadowwire", "mock")
  .option("--rpc-url <url>", "Override RPC URL")
  .option("--network <name>", "Override network (devnet only)")
  .action(
    async (
      recipient: string,
      amountStr: string,
      opts: { backend?: string; rpcUrl?: string; network?: string }
    ) => {
      const amount = Number(amountStr);
      if (Number.isNaN(amount) || amount <= 0) {
        console.error(chalk.red("Error: amount must be a positive number"));
        process.exit(1);
      }
      ensureBackend(opts);
      try {
        const result = await createPrivateTransfer(recipient, amount);
        console.log(chalk.green("Transfer result:"));
        console.log(chalk.gray("  success:"), result.success);
        if (result.signature) console.log(chalk.gray("  signature:"), result.signature);
        if (result.slot != null) console.log(chalk.gray("  slot:"), result.slot);
      } catch (err) {
        console.error(chalk.red("Error:"), err instanceof Error ? err.message : err);
        process.exit(1);
      }
    }
  );

program
  .command("verify <proof>")
  .description("Verify ZK proof (proof: hex string, or path to .json / .bin file)")
  .option("--backend <name>", "Backend: mock | shadowwire", "mock")
  .option("--public-inputs <inputs>", "Comma-separated public inputs (optional)")
  .option("--rpc-url <url>", "Override RPC URL")
  .option("--network <name>", "Override network (devnet only)")
  .action(
    async (
      proofArg: string,
      opts: { backend?: string; publicInputs?: string; rpcUrl?: string; network?: string }
    ) => {
      ensureBackend(opts);
      let proof: string | Buffer;
      let publicInputs: string[] = opts.publicInputs
        ? opts.publicInputs.split(",").map((s) => s.trim())
        : [];
      if (existsSync(proofArg)) {
        if (proofArg.endsWith(".json")) {
          const data = JSON.parse(readFileSync(proofArg, "utf-8")) as {
            proof?: string;
            commitment?: string;
            publicInputs?: string[];
          };
          proof = data.proof ?? "";
          publicInputs =
            data.publicInputs ?? (data.commitment != null ? [data.commitment] : []);
        } else if (proofArg.endsWith(".bin")) {
          proof = readFileSync(proofArg);
        } else {
          proof = readFileSync(proofArg);
        }
      } else {
        proof = proofArg;
      }
      try {
        const ok = await verifyZKProof(proof, publicInputs);
        if (ok) {
          console.log(chalk.green("Proof verified successfully."));
        } else {
          console.log(chalk.red("Proof verification failed."));
          process.exit(1);
        }
      } catch (err) {
        console.error(chalk.red("Error:"), err instanceof Error ? err.message : err);
        process.exit(1);
      }
    }
  );

program.parse();
