import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

import { ChatSidebar, ChatWindow, NewChatModal } from "../components";
import {
  useChatState,
  useBalance,
  useSidebarResize,
  useAutoError,
  useWebSocketChat,
} from "../hooks";

export default function Chats() {
  const wallet = useWallet();
  const { connection } = useConnection();

  const [error, setError] = useAutoError();
  const [input, setInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const sidebar = useSidebarResize();
  const balance = useBalance(wallet, connection);

  // Chat State
  const chat = useChatState(setError);

  // Real-time updates
  useWebSocketChat({
    activeChat: chat.activeChat,
    connection,
    setActiveChat: () => { }, // Managed by useChatState
    setChats: () => { },
  });

  const handleSendMessage = async () => {
    await chat.sendMessage(input);
    setInput("");
  };

  const handleStartChat = async (address: string, message: string) => {
    await chat.startNewChat(address, message);
    setShowModal(false);
  };

  return (
    <div className="flex min-h-screen bg-linear-to-br from-[#050505] via-[#0a0a0a] to-[#141414] text-gray-100">
      <div
        style={{ width: sidebar.width }}
        className={`shrink-0 ${sidebar.isResizing ? "" : "transition-[width] duration-150 ease-out"}`}
      >
        <ChatSidebar
          chats={chat.chats}
          activeChat={chat.activeChat}
          onOpenChat={chat.openChat}
          onNewChat={() => setShowModal(true)}
        />
      </div>

      <div
        onMouseDown={sidebar.startResizing}
        className="w-3 cursor-col-resize flex items-center justify-center z-10"
        title="Drag to resize"
      >
        <div className="w-0.5 h-10 bg-white/10 rounded" />
      </div>

      <ChatWindow
        activeChat={chat.activeChat}
        wallet={wallet}
        input={input}
        onInputChange={setInput}
        onSendMessage={handleSendMessage}
        loading={chat.loading}
        balance={balance}
        connection={connection}
      />

      <NewChatModal
        showModal={showModal}
        onClose={() => setShowModal(false)}
        onStartChat={handleStartChat}
        loading={chat.loading}
      />

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600/90 text-white px-4 py-2 rounded-lg shadow">
          {error}
        </div>
      )}
    </div>
  );
}
