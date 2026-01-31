import { useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import type { WalletContextState } from "@solana/wallet-adapter-react";
import type { Connection } from "@solana/web3.js";

import pigeon from "../assets/pigeon.png";
import { TipModal } from "./TipModal";
import { truncateAddress, getNetworkLabel } from "../utils/format";
import { MAX_MESSAGE_LENGTH } from "../utils/chatConstants";
import type { Chat } from "../types/chat";

interface ChatWindowProps {
  activeChat: Chat | null;
  wallet: WalletContextState;
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  loading: boolean;
  balance: number | null;
  connection: Connection;
}

/** Message bubble styles */
const BUBBLE_STYLES = {
  sent: "text-white max-w-lg rounded-xl px-4 py-3 rounded-br-sm bg-gradient-to-r from-[#4f46e5] to-[#06b6d4]",
  received:
    "text-white max-w-lg rounded-xl px-4 py-3 rounded-bl-sm bg-[#0f1724] border border-white/5",
} as const;

const ChatWindow = ({
  activeChat,
  wallet,
  input,
  onInputChange,
  onSendMessage,
  loading,
  balance,
  connection,
}: ChatWindowProps) => {
  const [tipModalOpen, setTipModalOpen] = useState(false);

  const formatTimestamp = (timestamp: { toNumber?: () => number } | number) => {
    const seconds =
      typeof timestamp === "number"
        ? timestamp
        : (timestamp?.toNumber?.() ?? Date.now() / 1000);
    return new Date(seconds * 1000).toLocaleTimeString();
  };

  return (
    <main className="flex-1 flex flex-col">
      {/* Chat Header */}
      <header className="flex items-center justify-between gap-2 px-6 py-3 border-b border-white/5 glassmorphic shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10">
            <img
              src={pigeon}
              alt="Pigeon"
              className="w-10 h-10 object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white break-words">
                {activeChat ? activeChat.receiver : "No chat selected"}
              </h2>
              {activeChat && (
                <>
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-semibold rounded-full border border-green-500/30 flex items-center gap-1">
                    🔒 E2EE
                  </span>
                  <button
                    onClick={() => setTipModalOpen(true)}
                    className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-semibold rounded-full border border-purple-500/30 flex items-center gap-1 hover:bg-purple-500/30 transition-colors"
                  >
                    💰 Tip
                  </button>
                </>
              )}
            </div>
            <p className="text-xs text-green-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Real-time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Balance Display */}
          {wallet.publicKey && (
            <div className="text-right mr-2">
              <div className="text-xs text-gray-400">
                {getNetworkLabel(
                  (connection as { rpcEndpoint?: string }).rpcEndpoint ?? ""
                )}
              </div>
              <div className="font-semibold text-sm">
                {balance !== null ? (
                  <span className="text-blue-400">◎ {balance.toFixed(4)}</span>
                ) : (
                  <span className="text-gray-500">Loading...</span>
                )}
              </div>
            </div>
          )}
          <div className="ml-2">
            <WalletMultiButton />
          </div>
        </div>
      </header>

      {/* Messages Pane */}
      <div className="flex-1 relative overflow-y-auto p-6">
        {/* subtle centered background logo */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
          <img src={pigeon} alt="pigeon-bg" className="opacity-5 max-w-xs" />
        </div>

        <div className="space-y-6 relative z-10">
          {activeChat ? (
            activeChat.messages.map((m, i) => {
              const isMyMessage =
                m.sender?.toBase58 &&
                wallet.publicKey?.toBase58 &&
                m.sender.toBase58() === wallet.publicKey.toBase58();

              const timeStr = formatTimestamp(m.timestamp);
              const senderLabel = isMyMessage
                ? `You · ${timeStr}`
                : `${truncateAddress(activeChat.receiver)} · ${timeStr}`;

              return (
                <div
                  className={`flex items-end gap-3 ${isMyMessage ? "justify-end" : "justify-start"}`}
                  key={i}
                >
                  <div
                    className={`flex flex-1 flex-col gap-1 ${isMyMessage ? "items-end text-right" : "items-start text-left"}`}
                  >
                    <p className="text-[#9d9db9] text-[13px] font-normal">
                      {senderLabel}
                    </p>
                    <p
                      className={
                        isMyMessage
                          ? `${BUBBLE_STYLES.sent} ml-4`
                          : `${BUBBLE_STYLES.received} mr-4`
                      }
                    >
                      {m.text}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500 text-center mt-10 text-sm">
              Choose a chat or start a new one
            </p>
          )}
        </div>
      </div>

      {/* Message Input */}
      {activeChat && (
        <div className="p-6 pt-4 mt-auto">
          <div className="relative glassmorphic rounded-xl p-2 flex items-center gap-2 ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-primary transition-all duration-300">
            <button className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors duration-200">
              <span className="material-symbols-outlined">add_circle</span>
            </button>
            <input
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSendMessage();
                }
              }}
              className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-gray-400 py-2"
              placeholder="Send a secure message..."
              type="text"
              maxLength={MAX_MESSAGE_LENGTH}
              disabled={loading}
            />
            <button className="w-10 h-10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors duration-200">
              <span className="material-symbols-outlined">
                sentiment_satisfied
              </span>
            </button>
            <button
              onClick={onSendMessage}
              disabled={!input.trim() || loading}
              className="h-10 px-4 bg-primary rounded-lg text-white font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-1">
                  <span className="animate-pulse">⏳</span> Sending
                </span>
              ) : (
                <>
                  Send
                  <span className="material-symbols-outlined text-base">
                    send
                  </span>
                </>
              )}
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {input.length}/{MAX_MESSAGE_LENGTH} characters
          </div>
        </div>
      )}

      {/* Tip Modal */}
      {activeChat && (
        <TipModal
          isOpen={tipModalOpen}
          onClose={() => setTipModalOpen(false)}
          recipientAddress={activeChat.receiver}
        />
      )}
    </main>
  );
};

export default ChatWindow;
