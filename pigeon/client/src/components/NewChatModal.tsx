import type { FormEvent } from "react";

interface NewChatModalProps {
  showModal: boolean;
  onClose: () => void;
  onStartChat: (address: string, message: string) => void;
  loading: boolean;
}

export default function NewChatModal({
  showModal,
  onClose,
  onStartChat,
  loading,
}: NewChatModalProps) {
  if (!showModal) return null;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const address = formData.get("address") as string;
    const message = formData.get("message") as string;
    onStartChat(address.trim(), message.trim() || "👋 Hey there!");
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 w-96 shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Start a new chat</h2>
        <form onSubmit={handleSubmit}>
          <input
            name="address"
            placeholder="Receiver wallet address"
            required
            className="w-full bg-[#1a1a1a]/70 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-blue-500/40"
          />
          <textarea
            name="message"
            placeholder="Initial message..."
            className="w-full bg-[#1a1a1a]/70 border border-white/10 rounded-xl px-4 py-2 mt-3 h-24 outline-none focus:border-blue-500/40"
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white disabled:opacity-50 min-w-20"
            >
              {loading ? (
                <span className="flex items-center gap-1">
                  <span className="animate-pulse">⏳</span> Starting
                </span>
              ) : (
                "Start"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
