import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import fs from "fs";
import { createHash } from "crypto";

// Anchor instruction discriminator for "initialize"
function getAnchorDiscriminator(name) {
  const preimage = `global:${name}`;
  const hash = createHash("sha256").update(preimage).digest();
  return hash.slice(0, 8);
}

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  
  // Load wallet
  const secretKey = JSON.parse(fs.readFileSync("../vault-keypair.json"));
  const wallet = Keypair.fromSecretKey(Uint8Array.from(secretKey));
  console.log("Initializing with wallet:", wallet.publicKey.toBase58());
  
  const programId = new PublicKey("4sF9KPj241iRwnyGdYkyTvfDQGKE8zmWBWVidfhfc7Yi");
  
  // Token mints
  const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");  // Wrapped SOL
  const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"); // Devnet USDC
  
  // Get order book PDA
  const [orderBookPda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("order_book_v3")],
    programId
  );
  console.log("Order Book PDA:", orderBookPda.toBase58());
  console.log("PDA Bump:", bump);
  
  // Check if already initialized
  const existing = await connection.getAccountInfo(orderBookPda);
  if (existing) {
    console.log("Order book already exists! Size:", existing.data.length, "bytes");
    return;
  }
  
  console.log("Building instruction with mints...");
  console.log("  Base Mint (SOL):", SOL_MINT.toBase58());
  console.log("  Quote Mint (USDC):", USDC_MINT.toBase58());
  
  // Build the instruction discriminator
  const discriminator = getAnchorDiscriminator("initialize");
  
  // Build instruction data: discriminator + base_mint (32 bytes) + quote_mint (32 bytes)
  const data = Buffer.concat([
    discriminator,
    SOL_MINT.toBuffer(),
    USDC_MINT.toBuffer(),
  ]);
  
  console.log("Instruction data length:", data.length, "(expected: 8 + 32 + 32 = 72)");
  
  // Build the instruction manually
  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: orderBookPda, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId,
    data,
  });
  
  const transaction = new Transaction().add(instruction);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = wallet.publicKey;
  transaction.sign(wallet);
  
  console.log("Sending transaction...");
  const sig = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false,
  });
  console.log("Sent transaction:", sig);
  
  await connection.confirmTransaction({
    signature: sig,
    blockhash,
    lastValidBlockHeight,
  }, "confirmed");
  
  console.log("✅ Order book initialized!");
  console.log("   Explorer: https://solscan.io/tx/" + sig + "?cluster=devnet");
  
  // Verify
  const newAccount = await connection.getAccountInfo(orderBookPda);
  console.log("   Account size:", newAccount?.data.length, "bytes");
}

main().catch(e => {
  console.error("Error:", e.message || e);
  if (e.logs) console.error("Logs:", e.logs.join("\n"));
});
