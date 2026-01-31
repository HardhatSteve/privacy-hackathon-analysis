import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import type { GetProgramAccountsFilter } from "@solana/web3.js";
import { getChatPda } from "../utils/chatUtils";
import { MIN_ENCRYPTED_LENGTH } from "../utils/chatConstants";
import { useProgram } from "./useProgram";
import { useEncryption } from "../contexts/EncryptionContext";
import type { Chat, Message } from "../types/chat";
import type { IdlAccounts } from "@coral-xyz/anchor";
import type { PigeonProgram } from "../types/pigeon_program";

type ChatAccount = IdlAccounts<PigeonProgram>["chatAccount"];
type DirectMessage = ChatAccount["messages"][number];

// hook for chat-related operations
export const useChatOperations = () => {
  const wallet = useWallet();
  const { getProgram } = useProgram();
  const encryption = useEncryption();

  const fetchChat = useCallback(async (receiverAddr: string): Promise<Message[]> => {
    try {
      if (!wallet.publicKey) return [];
      const program = getProgram();
      const receiver = new PublicKey(receiverAddr);

      const [chatPda] = getChatPda(wallet.publicKey, receiver);

      const acc = await program.account.chatAccount.fetchNullable(chatPda);
      if (!acc || !acc.messages) {
        return [];
      }

      // Decrypt messages
      const messages = await Promise.all(
        acc.messages.map(async (msg: DirectMessage) => {
          try {
            const senderAddr = msg.sender.toBase58();
            const isMyMessage = senderAddr === wallet.publicKey?.toBase58();

            const otherPartyAddr = isMyMessage ? receiverAddr : senderAddr;

            if (encryption.isInitialized) {
              const rawPayload = msg.encryptedPayload;
              const payloadLength = Number(msg.payloadLen ?? 0);

              if (!rawPayload || payloadLength < MIN_ENCRYPTED_LENGTH) {
                console.warn("⚠️ Invalid encrypted data:", {
                  exists: !!rawPayload,
                  length: payloadLength,
                  payloadType: typeof rawPayload,
                  sample: rawPayload ? Array.from(rawPayload).slice(0, 10) : []
                });
                return {
                  sender: msg.sender,
                  text: "⏳ Loading...",
                  timestamp: msg.timestamp,
                };
              }

              const payloadBuffer = new Uint8Array(rawPayload);
              const usableLength = Math.min(payloadBuffer.length, payloadLength);
              const encryptedData = payloadBuffer.slice(0, usableLength);
              const plaintext = await encryption.decryptMessage(encryptedData, otherPartyAddr);

              return {
                sender: msg.sender,
                text: plaintext,
                timestamp: msg.timestamp,
              };
            } else {
              return {
                sender: msg.sender,
                text: "🔒 [Encrypted - Sign message to decrypt] (reload and approve wallet signature)",
                timestamp: msg.timestamp,
              };
            }
          } catch (decryptErr) {
            console.error("Failed to decrypt message:", decryptErr);
            return {
              sender: msg.sender,
              text: "⚠️ [Decryption failed]",
              timestamp: msg.timestamp,
            };
          }
        })
      );

      return messages;
    } catch (err: unknown) {
      console.error("Error fetching chat:", err);
      return [];
    }
  }, [wallet.publicKey, getProgram, encryption]);

  const findExistingChat = useCallback(async (receiverAddr: string): Promise<Chat | null> => {
    try {
      if (!wallet.publicKey) return null;
      const receiver = new PublicKey(receiverAddr);
      const program = getProgram();
      const [chatPda] = getChatPda(wallet.publicKey, receiver);
      const account = await program.account.chatAccount.fetchNullable(chatPda);

      if (account && account.messages.length > 0) {
        const meFirst = Buffer.compare(wallet.publicKey.toBuffer(), receiver.toBuffer()) <= 0;
        return {
          receiver: receiverAddr,
          messages: account.messages as Message[], // Cast might need revisiting if Message type differs strictly
          isSentByMe: meFirst,
        };
      }

      return null;
    } catch (err: unknown) {
      console.error("Error finding chat:", err);
      return null;
    }
  }, [wallet.publicKey, getProgram]);

  const discoverUserChats = useCallback(async (): Promise<Chat[]> => {
    if (!wallet.publicKey) return [];
    try {
      const program = getProgram();
      const me = wallet.publicKey.toBase58();

      const memcmp0: GetProgramAccountsFilter = {
        memcmp: {
          offset: 8,
          bytes: me,
        },
      };

      const memcmp1: GetProgramAccountsFilter = {
        memcmp: {
          offset: 8 + 32,
          bytes: me,
        },
      };

      const [asSender, asReceiver] = await Promise.all([
        program.account.chatAccount.all([memcmp0]),
        program.account.chatAccount.all([memcmp1]),
      ]);

      const merged = new Map<string, Chat>();

      type AccountItem = typeof asSender[0];

      const addAccount = (acc: AccountItem) => {
        const participants = acc.account.participants;
        // Anchor generated types might have specific Message structure, usually compatible
        const messages = acc.account.messages as unknown as Message[];
        const meIsFirst = participants[0].toBase58() === me;
        const other = meIsFirst ? participants[1].toBase58() : participants[0].toBase58();

        const existing = merged.get(other);
        if (!existing || (messages?.length || 0) > (existing.messages?.length || 0)) {
          merged.set(other, {
            receiver: other,
            messages,
            isSentByMe: meIsFirst,
          });
        }
      };

      asSender.forEach(addAccount);
      asReceiver.forEach(addAccount);

      return Array.from(merged.values());
    } catch (err: unknown) {
      console.error("Discover chats failed:", err);
      return [];
    }
  }, [wallet.publicKey, getProgram]);

  return {
    fetchChat,
    findExistingChat,
    discoverUserChats,
  };
};
