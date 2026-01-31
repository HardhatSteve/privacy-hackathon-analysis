import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

import { orderParticipants } from "../utils/chatUtils";
import { MAX_MESSAGE_LENGTH } from "../utils/chatConstants";
import { sendTransactionWithRetry } from "../utils/transaction";
import { useProgram } from "./useProgram";
import { useEncryption } from "../contexts/EncryptionContext";
import type { Chat } from "../types/chat";

interface SendMessageParams {
  activeChat: Chat;
  message: string;
}

interface StartChatParams {
  receiverAddress: string;
  initialMessage: string;
}

interface StartChatResult {
  signature: string;
  receiverAddress: string;
}

// Hook for sending messages and starting new chats.
// Handles encryption, transaction building, and retry logic.
export const useMessageOperations = () => {
  const wallet = useWallet();
  const { getProgram, connection } = useProgram();
  const encryption = useEncryption();

  // Builds the encrypted message instruction for the chat program.
  const buildMessageInstruction = useCallback(
    async (message: string, receiverPk: PublicKey) => {
      if (!wallet.publicKey) throw new Error("Wallet not connected");

      const program = getProgram();
      const encryptedMessage = await encryption.encryptMessage(
        message.trim(),
        receiverPk.toBase58()
      );
      const encryptedBuffer = Buffer.from(encryptedMessage);

      const [participantA, participantB] = orderParticipants(
        wallet.publicKey,
        receiverPk
      );

      return program.methods
        .sendDm(encryptedBuffer)
        .accountsPartial({
          authority: wallet.publicKey,
          participantA,
          participantB,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
    },
    [wallet.publicKey, getProgram, encryption]
  );

  // Send a message to an existing chat.
  const sendMessage = useCallback(
    async ({ activeChat, message }: SendMessageParams): Promise<string> => {
      if (!activeChat || !message.trim()) {
        throw new Error("Invalid message or chat");
      }

      if (message.length > MAX_MESSAGE_LENGTH) {
        throw new Error(
          `Message too long! Maximum ${MAX_MESSAGE_LENGTH} characters.`
        );
      }

      // Capacity check removed (rolling buffer implemented on-chain)

      // Ensure encryption is initialized
      if (!encryption.isInitialized) {
        await encryption.initializeEncryption();
      }

      if (!wallet.publicKey) throw new Error("Wallet not connected");

      const receiverPk = new PublicKey(activeChat.receiver);
      const ix = await buildMessageInstruction(message, receiverPk);
      const tx = new Transaction().add(ix);

      const signature = await sendTransactionWithRetry(wallet, connection, tx);

      console.log("Transaction signature:", signature);
      console.log("🔒 Message encrypted and sent");

      return signature;
    },
    [wallet, connection, encryption, buildMessageInstruction]
  );

  /**
   * Start a new chat with an initial message.
   */
  const startNewChat = useCallback(
    async ({
      receiverAddress,
      initialMessage,
    }: StartChatParams): Promise<StartChatResult> => {
      const trimmedMessage = initialMessage.trim() || "👋 Hey there!";

      if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
        throw new Error(
          `Message too long! Maximum ${MAX_MESSAGE_LENGTH} characters.`
        );
      }

      if (!wallet.publicKey) throw new Error("Wallet not connected");

      // Validate address
      let receiver: PublicKey;
      try {
        receiver = new PublicKey(receiverAddress);
      } catch {
        throw new Error("Invalid Solana wallet address");
      }

      // Check if chatting with self
      if (receiver.equals(wallet.publicKey)) {
        throw new Error("You cannot chat with yourself!");
      }

      // Ensure encryption is initialized
      if (!encryption.isInitialized) {
        await encryption.initializeEncryption();
      }

      const ix = await buildMessageInstruction(trimmedMessage, receiver);
      const tx = new anchor.web3.Transaction().add(ix);

      const signature = await sendTransactionWithRetry(wallet, connection, tx);

      console.log("Transaction signature:", signature);
      console.log("🔒 First message encrypted and sent");

      return { signature, receiverAddress: receiver.toBase58() };
    },
    [wallet, connection, encryption, buildMessageInstruction]
  );

  return {
    sendMessage,
    startNewChat,
  };
};
