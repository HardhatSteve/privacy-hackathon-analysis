import pigeon from "../assets/pigeon.png";
import { truncateAddress } from "../utils/format";
import type { Chat } from "../types/chat";

interface ChatSidebarProps {
  chats: Chat[];
  activeChat: Chat | null;
  onOpenChat: (receiver: string) => void;
  onNewChat: () => void;
}

const ChatSidebar = ({
  chats,
  activeChat,
  onOpenChat,
  onNewChat,
}: ChatSidebarProps) => {
  return (
    <aside className="shrink-0 border-r border-white/5 bg-black/20 flex flex-col p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10">
            <img src={pigeon} alt="Pigeon" className="w-10 h-10 object-contain" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-white text-base font-medium">Pigeon</h1>
            <p className="text-[#9d9db9] text-sm font-normal">Online</p>
          </div>
        </div>
        <button
          onClick={onNewChat}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
        >
          New
        </button>
      </div>

      <div className="relative mb-4">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9d9db9]">search</span>
        <input
          className="w-full bg-[#101022]/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-[#9d9db9] focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-300"
          placeholder="Search contacts..."
          type="text"
        />
      </div>

      <nav className="grow overflow-y-auto pr-2 -mr-2">
        <div className="flex flex-col gap-1">
          {chats.length === 0 ? (
            <p className="text-gray-500 text-sm mt-8 text-center">No chats yet</p>
          ) : (
            chats.map((chat) => {
              const isActive = activeChat?.receiver === chat.receiver;
              return (
                <button
                  key={chat.receiver}
                  onClick={() => onOpenChat(chat.receiver)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 w-full text-left relative ${isActive ? "bg-primary/20 border border-primary/50" : "hover:bg-white/5"
                    }`}
                >
                  {isActive && <div className="absolute left-0 top-0 h-full w-1 bg-primary shadow-[0_0_15px_rgba(77,91,206,0.8)]" />}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-[#0b1220] flex items-center justify-center text-sm text-white">
                      <span className="material-symbols-outlined">chat_bubble</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{truncateAddress(chat.receiver)}</p>
                    <p className="text-xs text-[#9d9db9] truncate">{chat.messages.at(-1)?.text?.slice(0, 40) || "No messages"}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </nav>

      <div className="mt-auto pt-4 border-t border-white/5">
        <a className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors duration-200" href="#">
          <span className="material-symbols-outlined text-white">settings</span>
          <p className="text-white text-sm font-medium">Settings</p>
        </a>
      </div>
    </aside>
  );
};

export default ChatSidebar;
