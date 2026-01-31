import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import * as fs from "fs";
import * as os from "os";

// Arcium program ID on devnet
const ARCIUM_PROGRAM_ID = new PublicKey("ArcmXvRxSaUNEzNMfMgWfTvPGPfMbLdGCCXqMGVBpump");

// Your program ID
const NAHUALLI_PROGRAM_ID = new PublicKey("FKVrFruzE7dmE9ProgpbCy1A2oj8Nub2N6QbXGJi26by");

// Cluster offset for devnet
const CLUSTER_OFFSET = 456;

async function main() {
  // Load keypair
  const keypairPath = `${os.homedir()}/.config/solana/id.json`;
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  const payer = Keypair.fromSecretKey(new Uint8Array(keypairData));

  console.log("Payer:", payer.publicKey.toBase58());

  // Connect to devnet with Helius RPC
  const rpcUrl = process.env.RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");

  console.log("Connected to:", rpcUrl);
  console.log("Balance:", await connection.getBalance(payer.publicKey) / 1e9, "SOL");

  // Derive MXE account PDA
  const [mxeAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("mxe"), NAHUALLI_PROGRAM_ID.toBuffer()],
    ARCIUM_PROGRAM_ID
  );

  console.log("MXE Account PDA:", mxeAccount.toBase58());

  // Check if MXE account exists
  const accountInfo = await connection.getAccountInfo(mxeAccount);
  if (accountInfo) {
    console.log("MXE Account already exists!");
    console.log("Account size:", accountInfo.data.length, "bytes");
    console.log("Owner:", accountInfo.owner.toBase58());
  } else {
    console.log("MXE Account does not exist. Needs initialization.");
    console.log("\nTo initialize, you need to call the Arcium program's init_mxe instruction.");
    console.log("This requires the Arcium IDL which is not publicly available.");
    console.log("\nAlternative: Contact Arcium team on Discord for help with devnet deployment.");
  }
}

main().catch(console.error);
