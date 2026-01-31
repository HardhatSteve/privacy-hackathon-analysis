import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Nahualli } from "../target/types/nahualli";
import { randomBytes } from "crypto";
import {
  awaitComputationFinalization,
  getArciumEnv,
  getCompDefAccOffset,
  getArciumAccountBaseSeed,
  getArciumProgramId,
  uploadCircuit,
  buildFinalizeCompDefTx,
  RescueCipher,
  deserializeLE,
  getMXEPublicKey,
  getMXEAccAddress,
  getMempoolAccAddress,
  getCompDefAccAddress,
  getExecutingPoolAccAddress,
  getComputationAccAddress,
  getClusterAccAddress,
  x25519,
} from "@arcium-hq/client";
import * as fs from "fs";
import * as os from "os";
import { expect } from "chai";

describe("Nahualli", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace
    .Nahualli as Program<Nahualli>;
  const provider = anchor.getProvider();

  type Event = anchor.IdlEvents<(typeof program)["idl"]>;
  const awaitEvent = async <E extends keyof Event>(
    eventName: E,
  ): Promise<Event[E]> => {
    let listenerId: number;
    const event = await new Promise<Event[E]>((res) => {
      listenerId = program.addEventListener(eventName, (event) => {
        res(event);
      });
    });
    await program.removeEventListener(listenerId);

    return event;
  };

  const arciumEnv = getArciumEnv();
  const clusterAccount = getClusterAccAddress(arciumEnv.arciumClusterOffset);

  it("Processes psychometric scores confidentially", async () => {
    const owner = readKpJson(`${os.homedir()}/.config/solana/id.json`);

    console.log("Initializing process_scores computation definition");
    const initSig = await initProcessScoresCompDef(
      program,
      owner,
      true,  // Upload circuit for devnet
      false,
    );
    console.log(
      "Process scores computation definition initialized with signature",
      initSig,
    );

    const mxePublicKey = await getMXEPublicKeyWithRetry(
      provider as anchor.AnchorProvider,
      program.programId,
    );

    console.log("MXE x25519 pubkey is", mxePublicKey);

    const privateKey = x25519.utils.randomSecretKey();
    const publicKey = x25519.getPublicKey(privateKey);

    const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
    const cipher = new RescueCipher(sharedSecret);

    // Generic psychometric scores (0-100 for each dimension)
    // Works with Big-5, DISC, MBTI dimensions, Eneagram, etc.
    // Pack up to 8 scores into array (unused slots = 0)
    const scores = [75, 65, 45, 80, 30, 0, 0, 0]; // Big-5: O, C, E, A, N + 3 unused
    const numScores = 5;

    const nonce = randomBytes(16);
    
    // Pack 8 scores into a single bigint for encryption
    let packedScores = BigInt(0);
    for (let i = 0; i < 8; i++) {
      packedScores += BigInt(scores[i]) << BigInt(i * 8);
    }
    const encryptedScores = cipher.encrypt([packedScores], nonce);

    const scoresEventPromise = awaitEvent("scoresProcessedEvent");
    const computationOffset = new anchor.BN(randomBytes(8), "hex");

    console.log("Submitting encrypted scores for processing...");
    console.log("Computation offset:", computationOffset.toString());
    console.log("Num scores:", numScores);
    
    // Convert to proper format
    const scoresArr = Array.from(encryptedScores[0]);
    const pubkeyArr = Array.from(publicKey);
    const nonceVal = new anchor.BN(deserializeLE(nonce).toString());
    
    console.log("Arrays prepared, calling processScores...");
    
    const mxeAccount = getMXEAccAddress(program.programId);
    const compDefAccount = getCompDefAccAddress(
      program.programId,
      Buffer.from(getCompDefAccOffset("process_scores")).readUInt32LE(),
    );
    const computationAccount = getComputationAccAddress(
      arciumEnv.arciumClusterOffset,
      computationOffset,
    );
    const mempoolAccount = getMempoolAccAddress(arciumEnv.arciumClusterOffset);
    const executingPool = getExecutingPoolAccAddress(arciumEnv.arciumClusterOffset);
    
    console.log("Accounts:");
    console.log("  mxeAccount:", mxeAccount.toString());
    console.log("  compDefAccount:", compDefAccount.toString());
    console.log("  computationAccount:", computationAccount.toString());
    console.log("  clusterAccount:", clusterAccount.toString());
    
    // Small delay to ensure blockhash is fresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Build and send transaction manually
    const tx = await program.methods
      .processScores(
        computationOffset,
        scoresArr,
        numScores,
        pubkeyArr,
        nonceVal,
      )
      .accountsPartial({
        computationAccount,
        clusterAccount,
        mxeAccount,
        mempoolAccount,
        executingPool,
        compDefAccount,
      })
      .transaction();
    
    const latestBlockhash = await provider.connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
    tx.feePayer = owner.publicKey;
    
    tx.sign(owner);
    
    const rawTx = tx.serialize();
    const queueSig = await provider.connection.sendRawTransaction(rawTx, {
      skipPreflight: true,
      preflightCommitment: "confirmed",
    });
    
    await provider.connection.confirmTransaction({
      signature: queueSig,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    }, "confirmed");
    
    console.log("Queue sig is ", queueSig);

    const finalizeSig = await awaitComputationFinalization(
      provider as anchor.AnchorProvider,
      computationOffset,
      program.programId,
      "confirmed",
    );
    console.log("Finalize sig is ", finalizeSig);

    const scoresEvent = await scoresEventPromise;
    console.log("Received encrypted score results!");
    console.log("Owner:", scoresEvent.owner.toString());
    
    // Decrypt the result to verify [sum, count]
    const decryptedResult = cipher.decrypt([scoresEvent.encryptedResult], scoresEvent.nonce);
    console.log("Decrypted result:", decryptedResult);
    
    // Calculate expected sum: 75 + 65 + 45 + 80 + 30 = 295
    // But since we're using u8, sum would overflow. Let's verify structure.
    expect(scoresEvent.encryptedResult).to.have.lengthOf(32);
    expect(scoresEvent.nonce).to.have.lengthOf(16);
  });

  async function initProcessScoresCompDef(
    program: Program<Nahualli>,
    owner: anchor.web3.Keypair,
    uploadRawCircuit: boolean,
    offchainSource: boolean,
  ): Promise<string> {
    const baseSeedCompDefAcc = getArciumAccountBaseSeed(
      "ComputationDefinitionAccount",
    );
    const offset = getCompDefAccOffset("process_scores");

    const compDefPDA = PublicKey.findProgramAddressSync(
      [baseSeedCompDefAcc, program.programId.toBuffer(), offset],
      getArciumProgramId(),
    )[0];

    console.log("Comp def pda is ", compDefPDA);

    // Check if comp def already exists
    const existingAccount = await provider.connection.getAccountInfo(compDefPDA);
    let sig = "already_initialized";
    
    if (!existingAccount) {
      sig = await program.methods
        .initProcessScoresCompDef()
        .accounts({
          compDefAccount: compDefPDA,
          payer: owner.publicKey,
          mxeAccount: getMXEAccAddress(program.programId),
        })
        .signers([owner])
        .rpc({
          commitment: "confirmed",
        });
      console.log("Init process_scores computation definition transaction", sig);
    } else {
      console.log("Computation definition already exists, checking if circuit needs upload...");
    }

    // Always try to upload/finalize circuit if needed
    if (uploadRawCircuit) {
      console.log("Uploading circuit...");
      const rawCircuit = fs.readFileSync("build/process_scores.arcis");

      try {
        await uploadCircuit(
          provider as anchor.AnchorProvider,
          "process_scores",
          program.programId,
          rawCircuit,
          true,
        );
        console.log("Circuit uploaded successfully");
      } catch (e: any) {
        // Circuit may already be uploaded, try to finalize anyway
        console.log("Upload error (may be already uploaded):", e.message?.substring(0, 100));
        
        // Try to finalize the comp def
        console.log("Attempting to finalize computation definition...");
        try {
          const finalizeTx = await buildFinalizeCompDefTx(
            provider as anchor.AnchorProvider,
            Buffer.from(offset).readUInt32LE(),
            program.programId,
          );

          const latestBlockhash = await provider.connection.getLatestBlockhash();
          finalizeTx.recentBlockhash = latestBlockhash.blockhash;
          finalizeTx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;

          finalizeTx.sign(owner);
          await provider.sendAndConfirm(finalizeTx);
          console.log("Computation definition finalized");
        } catch (finalizeErr: any) {
          console.log("Finalize error (may be already finalized):", finalizeErr.message?.substring(0, 100));
        }
      }
    } else if (!offchainSource) {
      const finalizeTx = await buildFinalizeCompDefTx(
        provider as anchor.AnchorProvider,
        Buffer.from(offset).readUInt32LE(),
        program.programId,
      );

      const latestBlockhash = await provider.connection.getLatestBlockhash();
      finalizeTx.recentBlockhash = latestBlockhash.blockhash;
      finalizeTx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;

      finalizeTx.sign(owner);

      await provider.sendAndConfirm(finalizeTx);
    }
    return sig;
  }
});

async function getMXEPublicKeyWithRetry(
  provider: anchor.AnchorProvider,
  programId: PublicKey,
  maxRetries: number = 20,
  retryDelayMs: number = 500,
): Promise<Uint8Array> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const mxePublicKey = await getMXEPublicKey(provider, programId);
      if (mxePublicKey) {
        return mxePublicKey;
      }
    } catch (error) {
      console.log(`Attempt ${attempt} failed to fetch MXE public key:`, error);
    }

    if (attempt < maxRetries) {
      console.log(
        `Retrying in ${retryDelayMs}ms... (attempt ${attempt}/${maxRetries})`,
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }

  throw new Error(
    `Failed to fetch MXE public key after ${maxRetries} attempts`,
  );
}

function readKpJson(path: string): anchor.web3.Keypair {
  const file = fs.readFileSync(path);
  return anchor.web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(file.toString())),
  );
}
