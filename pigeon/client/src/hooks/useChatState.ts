import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useNavigate } from "react-router-dom";

import { useEncryption } from "../contexts/EncryptionContext";
import { useChatOperations, useMessageOperations } from "../hooks";
import type { Chat } from "../types";

interface ChatState {
    chats: Chat[];
    activeChat: Chat | null;
    loading: boolean;
    openChat: (receiverAddr: string) => Promise<void>;
    sendMessage: (message: string) => Promise<void>;
    startNewChat: (address: string, message: string) => Promise<void>;
    setError: (error: string | null) => void;
}

// Core hook managing all chat state and operations.
// Consolidates chat list, active chat, and message sending.
export function useChatState(
    setError: (error: string | null) => void
): ChatState {
    const wallet = useWallet();
    const navigate = useNavigate();
    const encryption = useEncryption();

    const { fetchChat, findExistingChat, discoverUserChats } = useChatOperations();
    const { sendMessage: sendMessageOp, startNewChat: startNewChatOp } = useMessageOperations();

    const [chats, setChats] = useState<Chat[]>([]);
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [loading, setLoading] = useState(false);

    // Redirect if not connected
    useEffect(() => {
        if (!wallet.connected) navigate("/");
    }, [wallet.connected, navigate]);

    // Initialize encryption when wallet connects
    useEffect(() => {
        if (!wallet.connected || !encryption.isEncryptionReady || encryption.isInitialized) {
            return;
        }

        encryption.initializeEncryption().catch(() => {
            // Silent - user may have rejected signature
        });
    }, [wallet.connected, encryption]);

    // Discover chats on connect
    useEffect(() => {
        if (!wallet.connected) {
            setChats([]);
            setActiveChat(null);
            return;
        }

        discoverUserChats().then(setChats);
    }, [wallet.connected, discoverUserChats]);

    const openChat = useCallback(
        async (receiverAddr: string) => {
            if (!wallet.publicKey) return;

            setLoading(true);
            try {
                const msgs = await fetchChat(receiverAddr);
                const receiverPk = new PublicKey(receiverAddr);
                const meFirst = Buffer.compare(
                    wallet.publicKey.toBuffer(),
                    receiverPk.toBuffer()
                ) <= 0;

                const chat: Chat = {
                    receiver: receiverAddr,
                    messages: msgs,
                    isSentByMe: meFirst,
                };

                setActiveChat(chat);
                setChats((prev) => {
                    const idx = prev.findIndex((c) => c.receiver === receiverAddr);
                    if (idx >= 0) {
                        const updated = [...prev];
                        updated[idx] = chat;
                        return updated;
                    }
                    return [...prev, chat];
                });
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : "Failed to open chat";
                setError(msg);
            } finally {
                setLoading(false);
            }
        },
        [wallet.publicKey, fetchChat, setError]
    );

    const sendMessage = useCallback(
        async (message: string) => {
            if (!activeChat || !message.trim()) return;

            setLoading(true);
            try {
                await sendMessageOp({ activeChat, message: message.trim() });
                await new Promise((r) => setTimeout(r, 1000));
                await openChat(activeChat.receiver);
            } catch (e: unknown) {
                const err = e instanceof Error ? e.message : "Failed to send";
                if (err.includes("blockhash")) {
                    setError("Network congestion. Please try again.");
                } else if (err.includes("insufficient")) {
                    setError("Insufficient SOL balance.");
                } else {
                    setError(err);
                }
            } finally {
                setLoading(false);
            }
        },
        [activeChat, sendMessageOp, openChat, setError]
    );

    const startNewChat = useCallback(
        async (address: string, message: string) => {
            if (!address) {
                setError("Please enter a wallet address");
                return;
            }

            setLoading(true);
            try {
                // Check for existing chat
                const existing = await findExistingChat(address);
                if (existing) {
                    setError("Chat already exists! Opening it...");
                    await openChat(address);
                    return;
                }

                const { receiverAddress } = await startNewChatOp({
                    receiverAddress: address,
                    initialMessage: message,
                });

                await new Promise((r) => setTimeout(r, 1000));
                const updated = await discoverUserChats();
                setChats(updated);
                await openChat(receiverAddress);
            } catch (e: unknown) {
                const err = e instanceof Error ? e.message : "Failed to start chat";
                if (err.includes("blockhash")) {
                    setError("Network congestion. Please try again.");
                } else if (err.includes("insufficient")) {
                    setError("Insufficient SOL balance.");
                } else {
                    setError(err);
                }
            } finally {
                setLoading(false);
            }
        },
        [findExistingChat, startNewChatOp, discoverUserChats, openChat, setError]
    );

    return {
        chats,
        activeChat,
        loading,
        openChat,
        sendMessage,
        startNewChat,
        setError,
    };
}
