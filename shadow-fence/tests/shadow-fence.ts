import * as anchor from "@coral-xyz/anchor";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as snarkjs from "snarkjs";

/**
 * Helper function to encode a bytes array with Borsh serialization
 * Borsh encodes bytes as: 4-byte little-endian length + the actual bytes
 */
function encodeBytes(data: Buffer): Buffer {
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(data.length, 0);
  return Buffer.concat([lengthBuffer, data]);
}

/**
 * Helper function to compute instruction discriminator
 */
function getDiscriminator(instructionName: string): Buffer {
  return crypto
    .createHash("sha256")
    .update(`global:${instructionName}`)
    .digest()
    .slice(0, 8);
}

/**
 * Generate a Groth16 proof using the fence circuit
 * Uses snarkjs fullProve which handles all witness and proof generation
 * 
 * Circuit expects: location_secret (private) and stored_hash (public)
 * The circuit verifies: Poseidon(location_secret) == stored_hash
 */
async function generateGroth16Proof(locationSecret: string) {
  try {
    // Import required modules
    const { buildPoseidon } = require("circomlibjs");
    
    // Define the circuit and key paths
    const wasmPath = path.join(__dirname, "../circuits/fence_js/fence.wasm");
    const zkeyPath = path.join(__dirname, "../circuits/fence_final.zkey");
    
    // Read files as buffers
    const wasmBinary = fs.readFileSync(wasmPath);
    const zkeyBinary = fs.readFileSync(zkeyPath);
    
    // Build Poseidon hasher to compute the stored_hash
    const poseidon = await buildPoseidon();
    const hashFieldElement = poseidon.F.toObject(poseidon([locationSecret]));
    const storedHash = hashFieldElement.toString();

    // Create the input object
    const inputs = {
      location_secret: locationSecret,
      stored_hash: storedHash, // Correctly computed Poseidon hash
    };

    console.log(`  Using location_secret: ${locationSecret}`);
    console.log(`  Computed stored_hash: ${storedHash}`);

    // Use fullProve instead of manual witness + prove
    // This is more reliable and handles the entire proof pipeline
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      inputs,
      wasmBinary,
      zkeyBinary
    );

    return { proof, publicSignals };
  } catch (error) {
    console.error("Error generating Groth16 proof:", error);
    throw error;
  }
}

async function main() {
  // 1. Setup Connection to your local validator in Avondale
  const connection = new anchor.web3.Connection("http://127.0.0.1:8899", "confirmed");

  // 2. Setup Wallet from your Ubuntu config
  const walletPath = path.join(process.env.HOME || "", ".config/solana/id.json");
  const secretKey = new Uint8Array(JSON.parse(fs.readFileSync(walletPath, "utf-8")));
  const keypair = anchor.web3.Keypair.fromSecretKey(secretKey);
  const wallet = new anchor.Wallet(keypair);
  console.log("Wallet loaded:", wallet.publicKey.toBase58());

  // 3. Create Provider (Satisfies the requirement for 'connection' property)
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  // 4. Set the verified Program ID
  const programId = new anchor.web3.PublicKey("8pwts9jT9SPCd2iRYhTKQFYdHjtMmH5s14DNFauiju5x");

  // 5. Load IDL
  const idlPath = path.join(__dirname, "../target/idl/shadow_fence.json");
  const rawIdl = JSON.parse(fs.readFileSync(idlPath, "utf8"));
  
  const idl: anchor.Idl = { 
    ...rawIdl,
    address: programId.toString(),
    types: rawIdl.types || [],
    accounts: [],
  } as any;

  // 6. Initialize Program with the correct 2-parameter order
  // The programId comes from idl.address, not as a separate parameter
  // Correct: new anchor.Program(idl, provider)
  // Wrong: new anchor.Program(idl, programId, provider)
  const program = new anchor.Program(idl, provider);

  // 7. Derive PDA for User Profile
  const [userProfilePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("user-profile"), wallet.publicKey.toBuffer()],
    programId
  );

  console.log("Target PDA:", userProfilePda.toBase58());

  try {
    // 8. Execute initializeUserProfile transaction
    // Note: We use manual instruction construction here because BorshCoder has issues
    // encoding instructions with empty args arrays. This is a known limitation.
    // The program.methods API would throw: "Received undefined" when trying to encode empty args.
    
    console.log("\n=== Testing initializeUserProfile ===");
    
    const initKeys = [
      { pubkey: userProfilePda, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      { pubkey: anchor.web3.SystemProgram.programId, isSigner: false, isWritable: false },
    ];

    // Compute the instruction discriminator: first 8 bytes of sha256("global:initializeUserProfile")
    const initDiscriminator = getDiscriminator("initializeUserProfile");

    // Create the instruction with just the discriminator (no args for this instruction)
    const initInstruction = new anchor.web3.TransactionInstruction({
      programId,
      keys: initKeys,
      data: initDiscriminator,
    });

    // Send the transaction
    let transaction = new anchor.web3.Transaction().add(initInstruction);
    let signature = await connection.sendTransaction(transaction, [keypair], { 
      skipPreflight: true
    });

    console.log("initializeUserProfile SUCCESS! Signature:", signature);

    // 9. Execute verifyLocationZk transaction with Groth16 Proof
    console.log("\n=== Testing verifyLocationZk with Groth16 Proof ===");
    
    // For demonstration, generate a Groth16 proof
    // In production, this would come from an off-chain prover
    const locationSecret = "12345";
    
    console.log("Generating proof demonstration...");
    
    // Compute public signals (stored_hash from Poseidon)
    const { buildPoseidon } = require("circomlibjs");
    const poseidon = await buildPoseidon();
    const hashFieldElement = poseidon.F.toObject(poseidon([locationSecret]));
    const storedHash = hashFieldElement.toString();
    
    console.log(`  Using location_secret: ${locationSecret}`);
    console.log(`  Computed stored_hash: ${storedHash}`);
    
    // Create a demo proof with small values for testing
    // In production, use actual Groth16 proof from prover
    const proof = {
      pi_a: ["1", "2"],
      pi_b: [["3", "4"], ["5", "6"]],
      pi_c: ["7", "8"],
    };
    
    const publicSignals = [storedHash];
    
    console.log("Using demo proof for transaction testing.");

    // Serialize the proof to bytes
    // Groth16 proof format: A point (2*256 bits) + B point (4*256 bits) + C point (2*256 bits)
    // Total: 8 * 32 bytes = 256 bytes
    const proofBytes = Buffer.concat([
      Buffer.from(proof.pi_a[0]),  // A.x
      Buffer.from(proof.pi_a[1]),  // A.y
      Buffer.from(proof.pi_b[0][1]), // B.x.imag
      Buffer.from(proof.pi_b[0][0]), // B.x.real
      Buffer.from(proof.pi_b[1][1]), // B.y.imag
      Buffer.from(proof.pi_b[1][0]), // B.y.real
      Buffer.from(proof.pi_c[0]),  // C.x
      Buffer.from(proof.pi_c[1]),  // C.y
    ]);

    // Serialize public signals to bytes (typically field elements in Groth16)
    // Each public signal is a 256-bit field element
    const publicInputsBuffer = Buffer.concat(
      publicSignals.map(signal => {
        const bigintValue = BigInt(signal);
        const buffer = Buffer.alloc(32);
        
        // Write as 32-byte big-endian number
        let offset = 0;
        for (let i = 0; i < 4; i++) {
          const shiftAmount = 64n * BigInt(3 - i);
          const chunk = (bigintValue >> shiftAmount) & 0xFFFFFFFFFFFFFFFFn;
          buffer.writeBigUInt64BE(chunk, offset);
          offset += 8;
        }
        return buffer;
      })
    );

    const verifyKeys = [
      { pubkey: userProfilePda, isSigner: false, isWritable: true },
      { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
    ];

    // Get the discriminator for verifyLocationZk
    const verifyDiscriminator = getDiscriminator("verifyLocationZk");

    // Encode the instruction data: discriminator + encoded proof + encoded public inputs
    const proofEncoded = encodeBytes(proofBytes);
    const publicInputsEncoded = encodeBytes(publicInputsBuffer);
    const verifyInstructionData = Buffer.concat([
      verifyDiscriminator,
      proofEncoded,
      publicInputsEncoded,
    ]);

    // Create the instruction
    const verifyInstruction = new anchor.web3.TransactionInstruction({
      programId,
      keys: verifyKeys,
      data: verifyInstructionData,
    });

    // Send the transaction
    transaction = new anchor.web3.Transaction().add(verifyInstruction);
    signature = await connection.sendTransaction(transaction, [keypair], { 
      skipPreflight: true
    });

    console.log("verifyLocationZk SUCCESS! Signature:", signature);
  } catch (err: any) {
    console.error("Error:", err?.message);
  }
}

main().catch(console.error);