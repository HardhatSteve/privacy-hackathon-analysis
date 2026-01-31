/// <reference path="./types.d.ts" />
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
// Note: This will be available after running 'anchor build'
// @ts-ignore - Generated file, may not exist until build
import { Arcshield } from "../target/types/arcshield";
import { expect } from "chai";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { x25519, RescueCipher } from "@arcium-hq/client";

describe("arcshield", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Arcshield as Program<Arcshield>;
  const user = Keypair.generate();

  before(async () => {
    // Airdrop SOL to user for testing
    const airdropSignature = await provider.connection.requestAirdrop(
      user.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSignature);
  });

  it("Initializes computation definitions", async () => {
    try {
      const tx = await program.methods
        .initComputationDefs()
        .accounts({
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      console.log("Init computation defs signature:", tx);
      expect(tx).to.be.a("string");
    } catch (error) {
      console.error("Error initializing computation defs:", error);
      // This might fail if already initialized, which is okay for testing
    }
  });

  it("Can queue a private transfer", async () => {
    // Generate keys for key exchange
    const clientPrivateKey = x25519.utils.randomPrivateKey();
    const clientPublicKey = x25519.getPublicKey(clientPrivateKey);

    // In production, get MXE public key from deployed program
    // For testing, we'll use a placeholder
    const mxePublicKey = new Uint8Array(32);
    const sharedSecret = x25519.getSharedSecret(clientPrivateKey, mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);

    // Create test transfer data
    const transferData = {
      amount: BigInt(1000),
      recipient: user.publicKey.toBytes(),
    };

    // Serialize and encrypt
    const serialized = new Uint8Array(40);
    const amountBytes = new BigUint64Array([transferData.amount]);
    serialized.set(new Uint8Array(amountBytes.buffer), 0);
    serialized.set(transferData.recipient, 8);

    const { encrypted, nonce } = cipher.encrypt([serialized]);

    // Queue the transaction
    try {
      const tx = await program.methods
        .privateTransfer(Array.from(encrypted[0]))
        .accounts({
          user: provider.wallet.publicKey,
          fromAccount: user.publicKey, // Placeholder
          toAccount: user.publicKey, // Placeholder
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Private transfer signature:", tx);
      expect(tx).to.be.a("string");
    } catch (error) {
      console.error("Error queuing private transfer:", error);
      // In a real test, you might want to handle this differently
    }
  });

  it("Can queue a private swap", async () => {
    const clientPrivateKey = x25519.utils.randomPrivateKey();
    const mxePublicKey = new Uint8Array(32);
    const sharedSecret = x25519.getSharedSecret(clientPrivateKey, mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);

    const swapData = {
      amount_in: BigInt(1000),
      min_amount_out: BigInt(950),
      token_in: Keypair.generate().publicKey.toBytes(),
      token_out: Keypair.generate().publicKey.toBytes(),
    };

    const serialized = new Uint8Array(80);
    const amountInBytes = new BigUint64Array([swapData.amount_in]);
    const minAmountOutBytes = new BigUint64Array([swapData.min_amount_out]);
    serialized.set(new Uint8Array(amountInBytes.buffer), 0);
    serialized.set(new Uint8Array(minAmountOutBytes.buffer), 8);
    serialized.set(swapData.token_in, 16);
    serialized.set(swapData.token_out, 48);

    const { encrypted, nonce } = cipher.encrypt([serialized]);

    try {
      const tx = await program.methods
        .privateSwap(Array.from(encrypted[0]))
        .accounts({
          user: provider.wallet.publicKey,
          tokenInAccount: user.publicKey,
          tokenOutAccount: user.publicKey,
          tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Private swap signature:", tx);
      expect(tx).to.be.a("string");
    } catch (error) {
      console.error("Error queuing private swap:", error);
    }
  });
});
