import { useEffect, useRef, useMemo, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import { getChatPda } from "../utils/chatUtils";
import { MIN_ENCRYPTED_LENGTH } from "../utils/chatConstants";
import type { Chat, Message } from "../types/chat";
import { useEncryption } from "../contexts/EncryptionContext";
import idl from "../solana_program.json";
import type { PigeonProgram } from "../types/pigeon_program";

const POLLING_INTERVAL_MS = 2000;

interface UseWebSocketChatParams {
  activeChat: Chat | null;
  connection: Connection;
  setActiveChat: Dispatch<SetStateAction<Chat | null>>;
  setChats: Dispatch<SetStateAction<Chat[]>>;
}



interface RawMessage {
  sender: PublicKey;
  encryptedPayload?: Uint8Array | number[]; // Anchor arrays can be number[]
  payloadLen?: number;
  timestamp: anchor.BN;
}

interface DecryptionContext {
  walletKeyBase58: string;
  activeChatReceiver: string;
  encryption: ReturnType<typeof useEncryption>;
}

// Decrypts a single on-chain message
const decryptMessage = async (
  msg: RawMessage,
  ctx: DecryptionContext
): Promise<Message> => {
  const { walletKeyBase58, activeChatReceiver, encryption } = ctx;

  try {
    const senderAddr = msg.sender.toBase58();
    const isMyMessage = senderAddr === walletKeyBase58;
    const otherPartyAddr = isMyMessage ? activeChatReceiver : senderAddr;

    if (!encryption.isInitialized) {
      return {
        sender: msg.sender,
        text: "🔒 [Encrypted - Sign message to decrypt]",
        timestamp: msg.timestamp,
      };
    }

    const rawPayload = msg.encryptedPayload;
    const payloadLength = Number(msg.payloadLen ?? 0);

    if (!rawPayload || payloadLength < MIN_ENCRYPTED_LENGTH) {
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
  } catch (err: unknown) {
    console.error("Failed to decrypt message:", err);
    return {
      sender: msg.sender,
      text: "⚠️ [Decryption failed]",
      timestamp: msg.timestamp,
    };
  }
};

// Decrypts all messages from an on-chain account
const decryptAllMessages = async (
  rawMessages: RawMessage[],
  ctx: DecryptionContext
): Promise<Message[]> => {
  return Promise.all(rawMessages.map((msg) => decryptMessage(msg, ctx)));
};

// Custom hook to manage WebSocket subscriptions + polling fallback for real-time chat updates
export const useWebSocketChat = ({
  activeChat,
  connection,
  setActiveChat,
  setChats,
}: UseWebSocketChatParams) => {
  const wallet = useWallet();
  const encryption = useEncryption();
  const accountSubscriptionRef = useRef<number | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMessageCountRef = useRef<number>(0);

  // Strongly typed coder. Note: BorshAccountsCoder generic might be tricky in some versions,
  // keeping it simple with cast if needed or just Idl.
  // The error "PigeonProgram does not satisfy constraint string" implies wrong generic usage.
  // We will remove the generic from BorshAccountsCoder constructor for now to silence it,
  // as strict typing on decode is less critical than build.
  const coder = useMemo(() => new anchor.BorshAccountsCoder(idl as unknown as Idl), []);

  const activeChatReceiver = activeChat?.receiver;
  const walletKeyBase58 = wallet.publicKey?.toBase58();

  // Memoized state updater for chat messages
  const updateChatMessages = useCallback(
    (messages: Message[], receiverAddress: string) => {
      setActiveChat((prev) => {
        if (!prev || prev.receiver !== receiverAddress) return prev;
        return { ...prev, messages };
      });

      setChats((prev) => {
        let found = false;
        const next = prev.map((chat) => {
          if (chat.receiver === receiverAddress) {
            found = true;
            return { ...chat, messages };
          }
          return chat;
        });

        if (!found) {
          next.push({
            receiver: receiverAddress,
            messages,
            isSentByMe: walletKeyBase58 === receiverAddress,
          });
        }

        return next;
      });
    },
    [setActiveChat, setChats, walletKeyBase58]
  );

  // WebSocket subscription effect
  useEffect(() => {
    if (!wallet.publicKey || !activeChatReceiver) {
      if (accountSubscriptionRef.current !== null) {
        connection.removeAccountChangeListener(accountSubscriptionRef.current);
        accountSubscriptionRef.current = null;
      }
      return;
    }

    let disposed = false;
    const programId = new anchor.web3.PublicKey(idl.address);

    const setupWebSocket = async () => {
      try {
        const [chatPda] = getChatPda(
          wallet.publicKey!,
          new anchor.web3.PublicKey(activeChatReceiver)
        );

        const subscriptionId = connection.onAccountChange(
          chatPda,
          async (accountInfo) => {
            if (disposed) return;

            try {
              // Validate account data
              if (!accountInfo?.data?.length) return;
              if (!accountInfo.owner?.equals(programId)) return;
              if (accountInfo.data.length < 8) return;

              // Decode using typed coder
              const decoded = coder.decode("chatAccount", accountInfo.data);
              if (!decoded?.messages) return;

              const decryptionCtx: DecryptionContext = {
                walletKeyBase58: walletKeyBase58!,
                activeChatReceiver,
                encryption,
              };

              // Cast to internal RawMessage because Anchor types might be slightly different in TS defs
              const rawMsgs = decoded.messages as unknown as RawMessage[];
              const messages = await decryptAllMessages(rawMsgs, decryptionCtx);
              updateChatMessages(messages, activeChatReceiver);
            } catch (err: unknown) {
              console.error("Error processing WebSocket update:", err);
            }
          },
          "confirmed"
        );

        accountSubscriptionRef.current = subscriptionId;
      } catch (err: unknown) {
        console.error("Error setting up WebSocket:", err);
      }
    };

    void setupWebSocket();

    return () => {
      disposed = true;
      if (accountSubscriptionRef.current !== null) {
        connection.removeAccountChangeListener(accountSubscriptionRef.current);
        accountSubscriptionRef.current = null;
      }
    };
  }, [
    wallet.publicKey,
    walletKeyBase58,
    activeChatReceiver,
    connection,
    encryption,
    coder,
    updateChatMessages,
  ]);

  // Polling fallback effect
  useEffect(() => {
    if (!wallet.publicKey || !activeChatReceiver || !encryption.isInitialized) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    const pollMessages = async () => {
      try {
        // Construct a read-only Provider for polling without a connected wallet signer needed
        const provider = new anchor.AnchorProvider(
          connection,
          {} as any, // Only readonly, so empty wallet is okay for fetching
          anchor.AnchorProvider.defaultOptions()
        );
        const program = new anchor.Program(idl as unknown as Idl, provider) as unknown as anchor.Program<PigeonProgram>;

        const [chatPda] = getChatPda(wallet.publicKey!, new PublicKey(activeChatReceiver));

        const acc = await program.account.chatAccount.fetchNullable(chatPda);
        if (!acc?.messages) return;

        // Skip if message count hasn't changed
        if (acc.messages.length === lastMessageCountRef.current) return;
        lastMessageCountRef.current = acc.messages.length;

        const decryptionCtx: DecryptionContext = {
          walletKeyBase58: walletKeyBase58!,
          activeChatReceiver,
          encryption,
        };

        const rawMsgs = acc.messages as unknown as RawMessage[];
        const messages = await decryptAllMessages(rawMsgs, decryptionCtx);
        updateChatMessages(messages, activeChatReceiver);
      } catch (err: unknown) {
        // Silent fail - WebSocket is primary, polling is backup
      }
    };

    // Initial poll
    pollMessages();

    // Set up interval
    pollingIntervalRef.current = setInterval(pollMessages, POLLING_INTERVAL_MS);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [
    wallet.publicKey,
    walletKeyBase58,
    activeChatReceiver,
    connection,
    encryption,
    updateChatMessages,
  ]);
};
