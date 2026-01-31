import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor";
import { StealthRails } from "../sdk/src/stealth_rails"; // Relative import for monorepo demo

async function main() {
    // 1. Setup Connection and Wallet
    const connection = new Connection("https://api.devnet.solana.com", "confirmed");
    const keypair = Keypair.generate();
    const wallet = new Wallet(keypair);

    console.log("🚀 Initializing Stealth Rails SDK...");
    const rails = new StealthRails(connection, wallet);

    // 2. Define a Mint (e.g., Circle's USDC on Devnet, or any SPL)
    const MOCK_MINT = new PublicKey("So11111111111111111111111111111111111111112");

    console.log(`\n🛡️  Shielding 1.0 SOL...`);
    try {
        // In a real run, this would need funded wallet and real mint
        // const sig = await rails.shield(MOCK_MINT, 1.0);
        // console.log(`   Success! TX: ${sig}`);
        console.log(`   (Mock) Shielded 1.0 SOL to compressed state.`);
    } catch (e) {
        console.error("   Error shielding:", e);
    }

    console.log(`\n🕵️  Sending Private Transfer...`);
    const recipient = Keypair.generate().publicKey;
    try {
        // const sig = await rails.privateTransfer(MOCK_MINT, 0.5, recipient);
        // console.log(`   Success! TX: ${sig}`);
        console.log(`   (Mock) Sent 0.5 sSOL privately to ${recipient.toBase58()}`);
    } catch (e) {
        console.error("   Error transferring:", e);
    }

    console.log("\n✅ Example Finished!");
}

main().catch(console.error);
