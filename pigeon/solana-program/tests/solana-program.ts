import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, web3 } from "@coral-xyz/anchor";
import { PigeonProgram } from "../target/types/pigeon_program";
import assert from "assert";

describe("Pigeon DM Chat", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider as AnchorProvider);
  const program = anchor.workspace.PigeonProgram as Program<PigeonProgram>;

  const payer = provider.wallet as anchor.Wallet;
  const userA = web3.Keypair.generate();
  const userB = web3.Keypair.generate();
  const userC = web3.Keypair.generate();

  const CHAT_SEED = Buffer.from("chat");
  const NONCE_LENGTH = 12;
  const AUTH_TAG_LENGTH = 16;

  const orderParticipants = (
    a: web3.PublicKey,
    b: web3.PublicKey
  ): [web3.PublicKey, web3.PublicKey] => {
    return Buffer.compare(a.toBuffer(), b.toBuffer()) <= 0 ? [a, b] : [b, a];
  };

  const getChatPda = (walletA: web3.PublicKey, walletB: web3.PublicKey) => {
    const [first, second] = orderParticipants(walletA, walletB);
    return web3.PublicKey.findProgramAddressSync(
      [CHAT_SEED, first.toBuffer(), second.toBuffer()],
      program.programId
    );
  };

  const encodeMessage = (plaintext: string): Uint8Array => {
    const messageBytes = Buffer.from(plaintext, "utf8");
    const payload = new Uint8Array(
      NONCE_LENGTH + messageBytes.length + AUTH_TAG_LENGTH
    );
    payload.set(messageBytes, NONCE_LENGTH);
    // Leave nonce and auth tag as zeroed bytes for deterministic test data
    return payload;
  };

  const decodeMessage = (
    encryptedPayload: number[] | Uint8Array,
    payloadLen: number
  ): string => {
    const raw =
      encryptedPayload instanceof Uint8Array
        ? encryptedPayload
        : Uint8Array.from(encryptedPayload);
    const usable = raw.slice(0, payloadLen);
    if (usable.length < NONCE_LENGTH + AUTH_TAG_LENGTH) {
      return "";
    }
    const textBytes = usable.slice(
      NONCE_LENGTH,
      usable.length - AUTH_TAG_LENGTH
    );
    return Buffer.from(textBytes).toString("utf8");
  };

  const sendEncryptedMessage = async (
    sender: web3.Keypair,
    recipient: web3.PublicKey,
    payload: Uint8Array
  ) => {
    const [participantA, participantB] = orderParticipants(
      sender.publicKey,
      recipient
    );
    const [chatPda] = getChatPda(sender.publicKey, recipient);

    await program.methods
      .sendDm(Buffer.from(payload))
      .accountsPartial({
        authority: sender.publicKey,
        participantA,
        participantB,
        systemProgram: web3.SystemProgram.programId,
      })
      .signers([sender])
      .rpc();

    return chatPda;
  };

  const sendPlaintextMessage = (
    sender: web3.Keypair,
    recipient: web3.PublicKey,
    plaintext: string
  ) => sendEncryptedMessage(sender, recipient, encodeMessage(plaintext));

  before(async () => {
    // Ensure the payer has sufficient funds on localnet for test transfers
    const connection = provider.connection as anchor.web3.Connection;
    const minRequiredLamports = 6 * web3.LAMPORTS_PER_SOL; // 2 SOL each for A, B, C
    const currentBalance = await connection.getBalance(payer.publicKey);
    if (currentBalance < minRequiredLamports) {
      const airdropSig = await connection.requestAirdrop(
        payer.publicKey,
        10 * web3.LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(airdropSig, "confirmed");
      const newBal = await connection.getBalance(payer.publicKey);
      console.log(
        `✅ Airdropped to payer. Balance: ${(newBal / web3.LAMPORTS_PER_SOL).toFixed(2)} SOL`
      );
    }

    const lamports = 2 * web3.LAMPORTS_PER_SOL;
    const tx = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: userA.publicKey,
        lamports,
      }),
      web3.SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: userB.publicKey,
        lamports,
      }),
      web3.SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: userC.publicKey,
        lamports,
      })
    );
    await provider.sendAndConfirm(tx);
    console.log("✅ Test wallets funded");
  });

  describe("PDA Derivation", () => {
    it("derives identical PDA regardless of participant order", async () => {
      const [pdaAtoB] = getChatPda(userA.publicKey, userB.publicKey);
      const [pdaBtoA] = getChatPda(userB.publicKey, userA.publicKey);

      assert.equal(
        pdaAtoB.toBase58(),
        pdaBtoA.toBase58(),
        "PDA should be independent of message direction"
      );
      console.log(`  PDA (A,B): ${pdaAtoB.toBase58()}`);
    });

    it("derives consistent PDA across repeated calls", async () => {
      const [pda1] = getChatPda(userA.publicKey, userB.publicKey);
      const [pda2] = getChatPda(userA.publicKey, userB.publicKey);

      assert.equal(
        pda1.toBase58(),
        pda2.toBase58(),
        "Stable PDA expected for same participant pair"
      );
    });
  });

  describe("Sending Messages", () => {
    it("creates chat account and stores first encrypted message", async () => {
      const chatPda = await sendPlaintextMessage(
        userA,
        userB.publicKey,
        "Hello from A to B!"
      );

      const account = await program.account.chatAccount.fetch(chatPda);
      assert.equal(account.messages.length, 1, "Should contain one message");

      const msg = account.messages[0];
      assert.equal(
        decodeMessage(msg.encryptedPayload, msg.payloadLen),
        "Hello from A to B!"
      );
      assert.equal(msg.sender.toBase58(), userA.publicKey.toBase58());
      assert.ok(msg.timestamp.toNumber() > 0, "Should have valid timestamp");

      const expectedParticipants = orderParticipants(
        userA.publicKey,
        userB.publicKey
      ).map((p) => p.toBase58());
      const actualParticipants = account.participants.map((p) => p.toBase58());
      assert.deepEqual(
        actualParticipants,
        expectedParticipants,
        "Participants stored in canonical order"
      );

      console.log(`  ✅ Message stored at timestamp: ${msg.timestamp}`);
    });

    it("appends additional message from same sender", async () => {
      await sendPlaintextMessage(
        userA,
        userB.publicKey,
        "Second message from A"
      );

      const [chatPda] = getChatPda(userA.publicKey, userB.publicKey);
      const account = await program.account.chatAccount.fetch(chatPda);
      assert.equal(account.messages.length, 2, "Should contain two messages");

      const lastMsg = account.messages[1];
      assert.equal(
        decodeMessage(lastMsg.encryptedPayload, lastMsg.payloadLen),
        "Second message from A"
      );
      assert.equal(lastMsg.sender.toBase58(), userA.publicKey.toBase58());

      console.log(`  ✅ Total messages in chat: ${account.messages.length}`);
    });

    it("stores reply from other participant in same chat", async () => {
      await sendPlaintextMessage(
        userB,
        userA.publicKey,
        "Reply from B"
      );

      const [chatPda] = getChatPda(userA.publicKey, userB.publicKey);
      const account = await program.account.chatAccount.fetch(chatPda);
      assert.equal(account.messages.length, 3, "Should contain three messages");

      const lastMsg = account.messages[2];
      assert.equal(
        decodeMessage(lastMsg.encryptedPayload, lastMsg.payloadLen),
        "Reply from B"
      );
      assert.equal(lastMsg.sender.toBase58(), userB.publicKey.toBase58());

      const expectedParticipants = orderParticipants(
        userA.publicKey,
        userB.publicKey
      ).map((p) => p.toBase58());
      const actualParticipants = account.participants.map((p) => p.toBase58());
      assert.deepEqual(actualParticipants, expectedParticipants);

      console.log(
        `  ✅ Shared chat now contains ${account.messages.length} messages`
      );
    });

    it("sends multiple messages in succession to another participant", async () => {
      const messages = ["Message 1", "Message 2", "Message 3"];

      for (const msg of messages) {
        await sendPlaintextMessage(userA, userC.publicKey, msg);
      }

      const [chatPda] = getChatPda(userA.publicKey, userC.publicKey);
      const account = await program.account.chatAccount.fetch(chatPda);
      assert.equal(account.messages.length, messages.length);

      messages.forEach((msg, idx) => {
        assert.equal(
          decodeMessage(account.messages[idx].encryptedPayload, account.messages[idx].payloadLen),
          msg,
          `Message ${idx} should match`
        );
      });

      console.log(
        `  ✅ Successfully sent ${messages.length} messages in succession`
      );
    });

    it("handles maximum length plaintext (280 chars)", async () => {
      const maxText = "a".repeat(280);
      await sendPlaintextMessage(userC, userA.publicKey, maxText);

      const [chatPda] = getChatPda(userA.publicKey, userC.publicKey);
      const account = await program.account.chatAccount.fetch(chatPda);
      const lastMsg = account.messages[account.messages.length - 1];

      assert.equal(
        decodeMessage(lastMsg.encryptedPayload, lastMsg.payloadLen).length,
        280,
        "Should accept 280 char message"
      );
      assert.equal(
        lastMsg.payloadLen,
        NONCE_LENGTH + 280 + AUTH_TAG_LENGTH,
        "Payload length should include nonce and auth tag"
      );

      console.log(`  ✅ 280 character message accepted`);
    });

    it("allows empty plaintext (nonce + tag only)", async () => {
      await sendPlaintextMessage(userC, userB.publicKey, "");

      const [chatPda] = getChatPda(userB.publicKey, userC.publicKey);
      const account = await program.account.chatAccount.fetch(chatPda);
      const firstMsg = account.messages[0];

      assert.equal(
        decodeMessage(firstMsg.encryptedPayload, firstMsg.payloadLen),
        "",
        "Decoded message should be empty string"
      );
      assert.equal(
        firstMsg.payloadLen,
        NONCE_LENGTH + AUTH_TAG_LENGTH,
        "Empty message still stores nonce + auth tag"
      );

      console.log(`  ✅ Empty plaintext accepted`);
    });
  });

  describe("Error Handling", () => {
    it("rejects payload exceeding encrypted size limit", async () => {
      const oversizedPayload = encodeMessage("x".repeat(281));
      let threw = false;
      let errorCode = "";

      try {
        await sendEncryptedMessage(userA, userB.publicKey, oversizedPayload);
      } catch (err: any) {
        threw = true;
        errorCode = err.error?.errorCode?.code || "";
        const message = String(err);
        assert.ok(
          message.includes("MessageTooLong") ||
            message.includes("Message too long") ||
            message.includes("6000") ||
            errorCode === "MessageTooLong",
          "Should return ChatError::MessageTooLong"
        );
        console.log(
          `  ✅ Correctly rejected oversized payload (${errorCode || "MessageTooLong"})`
        );
      }

      assert.equal(threw, true, "Expected sendDm to fail with long message");
    });

    it("rejects extremely large payloads", async () => {
      const veryLargePayload = encodeMessage("x".repeat(1000));
      let threw = false;

      try {
        await sendEncryptedMessage(userB, userC.publicKey, veryLargePayload);
      } catch (err: any) {
        threw = true;
        console.log("  ✅ Correctly rejected 1000 char message");
      }

      assert.equal(threw, true, "Expected to reject message with 1000 chars");
    });

    it("requires transaction signature from sender", async () => {
      const payload = encodeMessage("Unsigned message");
      const [participantA, participantB] = orderParticipants(
        userA.publicKey,
        userB.publicKey
      );
      let threw = false;

      try {
        await program.methods
          .sendDm(Buffer.from(payload))
          .accountsPartial({
            authority: userA.publicKey,
            participantA,
            participantB,
            systemProgram: web3.SystemProgram.programId,
          })
          .signers([])
          .rpc();
      } catch (err: any) {
        threw = true;
        console.log("  ✅ Correctly rejected unsigned transaction");
      }

      assert.equal(threw, true, "Should reject transaction without sender signature");
    });
  });

  describe("Account State Verification", () => {
    it("verifies timestamp monotonicity", async () => {
      const [chatPda] = getChatPda(userA.publicKey, userB.publicKey);
      const account = await program.account.chatAccount.fetch(chatPda);

      for (let i = 1; i < account.messages.length; i++) {
        const prevTime = account.messages[i - 1].timestamp.toNumber();
        const currTime = account.messages[i].timestamp.toNumber();
        assert.ok(
          currTime >= prevTime,
          `Message ${i} timestamp should be >= previous message`
        );
      }

      console.log(
        `  ✅ All ${account.messages.length} messages have valid timestamp ordering`
      );
    });

    it("keeps participants immutable after initialization", async () => {
      const [chatPda] = getChatPda(userC.publicKey, userA.publicKey);
      const accountBefore = await program.account.chatAccount.fetch(chatPda);
      const participantsBefore = accountBefore.participants.map((p) => p.toBase58());

      await sendPlaintextMessage(userC, userA.publicKey, "Another message");

      const accountAfter = await program.account.chatAccount.fetch(chatPda);
      const participantsAfter = accountAfter.participants.map((p) => p.toBase58());

      assert.deepEqual(participantsAfter, participantsBefore);

      console.log("  ✅ Participants remain immutable");
    });

    it("lists all stored messages with decoded senders", async () => {
      const [chatPda] = getChatPda(userA.publicKey, userB.publicKey);
      const account = await program.account.chatAccount.fetch(chatPda);

      console.log(`  📝 Chat history (${account.messages.length} messages):`);
      account.messages.forEach((msg, idx) => {
        const senderLabel =
          msg.sender.toBase58() === userA.publicKey.toBase58() ? "A" : "B";
        const plaintext = decodeMessage(msg.encryptedPayload, msg.payloadLen);
        const preview = plaintext.length > 50 ? `${plaintext.slice(0, 50)}...` : plaintext;
        console.log(`    [${idx}] ${senderLabel}: "${preview}"`);
      });

      assert.ok(account.messages.length > 0, "Should have messages in chat");
    });
  });
});