import { useState } from "react";
import { decryptNote, encryptNote } from "./cryptoNote.js";

export default function DecryptTool() {
  const [payload, setPayload] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [plaintext, setPlaintext] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const copyToClipboard = async (text) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setToast("Copied to clipboard");
      setTimeout(() => setToast(""), 1500);
    } catch {}
  };

  const onDecrypt = async () => {
    setError("");
    setPlaintext("");
    try {
      if (!payload.trim()) throw new Error("Paste an encrypted note payload.");
      const text = await decryptNote(payload.trim(), passphrase);
      setPlaintext(text);
    } catch (e) {
      setError(e?.message || String(e));
    }
  };

  const onInsertDemo = async () => {
    setError("");
    setPlaintext("");
    try {
      const demoText = "Hello Judges 👋\n\nThis is a demo v1 note. If you can read this, decryption works!";
      const demoPass = "demo";
      const demoPayload = await encryptNote(demoText, demoPass);
      setPayload(demoPayload);
      setPassphrase(demoPass);
      await copyToClipboard(demoPayload);
      setToast('Demo payload inserted & copied (passphrase: "demo")');
      setTimeout(() => setToast(""), 2500);
    } catch (e) {
      setError("Could not generate demo payload. Try a modern browser.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 grid place-content-center text-sm">🔓</div>
            <h1 className="text-2xl font-bold">Offline Decrypt Tool</h1>
          </div>
          <a href="/" className="text-white/70 hover:text-white text-sm">← Back</a>
        </div>

        <p className="text-white/60 text-sm mb-6">
          Works offline. Paste the encrypted payload (JSON) and enter the passphrase. Or use the demo button.
        </p>

        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onInsertDemo}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-semibold"
          >
            Insert demo & Copy
          </button>
          {plaintext && (
            <button
              onClick={() => copyToClipboard(plaintext)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10"
            >
              Copy decrypted text
            </button>
          )}
          {toast && <span className="text-xs text-emerald-300 ml-1">{toast}</span>}
        </div>

        <div className="grid gap-4">
          <label className="block">
            <div className="text-sm mb-1 text-white/80">Encrypted payload (JSON)</div>
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="w-full h-40 rounded-xl bg-white/5 border border-white/10 p-3 outline-none focus:border-white/20"
              placeholder='{"v":1,"i":150000,"s":"...","n":"...","c":"..."}'
            />
          </label>

          <label className="block">
            <div className="text-sm mb-1 text-white/80">Passphrase</div>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              className="w-full rounded-xl bg-white/5 border border-white/10 p-3 outline-none focus:border-white/20"
              placeholder='Try "demo" if you used the demo button'
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={onDecrypt}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-semibold"
            >
              Decrypt
            </button>
            <button
              type="button"
              onClick={() => { setPayload(""); setPassphrase(""); setPlaintext(""); setError(""); }}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10"
            >
              Reset
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              ❌ {error}
            </div>
          )}

          {plaintext && (
            <div>
              <div className="text-sm mb-1 text-emerald-400">✓ Decrypted message</div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 break-words">
                <pre className="whitespace-pre-wrap text-white/90">{plaintext}</pre>
              </div>
            </div>
          )}

          <p className="text-xs text-white/40 mt-2">
            Supports passphrase-protected payloads (v:1). Works entirely offline.
          </p>
        </div>
      </div>
    </div>
  );
}
