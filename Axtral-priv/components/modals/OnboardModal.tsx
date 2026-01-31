"use client";
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { XMarkIcon, ExclamationTriangleIcon, ChevronRightIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { signIn } from "next-auth/react";

export type Role = "student" | "researcher" | "professional" | "entrepreneur" | "cyber_hall";

export default function OnboardModal({
  open,
  onClose,
  role,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  role: Role;
  onSuccess: (data: any) => void;
}) {
  const { t } = useTranslation();

  const [idValue, setIdValue] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [useWallet, setUseWallet] = useState(false);

  const [betaCode, setBetaCode] = useState("");
  const [betaError, setBetaError] = useState(false);

  useEffect(() => {
    if (open) {
      setIdValue(""); setFullName(""); setEmail(""); setPhone("");
      setBetaCode(""); setBetaError(false);
    }
  }, [open]);

  const saveIntentToCookie = () => {
    const data = JSON.stringify({ role, phone, idValue, idType: useWallet ? "wallet" : "role_id" });
    document.cookie = `zaeon_intent=${encodeURIComponent(data)}; path=/; max-age=600`;
  };

  const handleGoogleQuickStart = () => {
    saveIntentToCookie();
    let targetPath = "/";
    if (role === "student" || role === "researcher") targetPath = "/homework";
    else if (role === "professional" || role === "entrepreneur") targetPath = "/workstation";
    signIn("google", { callbackUrl: targetPath }, { prompt: "select_account" });
  };

  const handleBetaSubmit = () => {
    if (betaCode !== "ZAEON-ALPHA-KEY") {
      setBetaError(true);
      setTimeout(() => setBetaError(false), 500);
    } else {
      alert("Code Accepted. Welcome to Beta.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.code === "Escape") { e.preventDefault(); onClose(); }
  };

  if (!open) return null;

  const inputClass =
    "h-10 rounded-lg border border-white/5 bg-black/40 px-3 text-white/30 placeholder:text-white/10 outline-none w-full cursor-not-allowed";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" role="dialog" aria-modal="true" onKeyDown={handleKeyDown}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-[900px] rounded-2xl border border-white/10 bg-[#0b121f] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        <div className="absolute inset-x-0 top-0 h-[2px] bg-[linear-gradient(90deg,#22d3ee,#60a5fa,#22d3ee)]/50" />

        <button onClick={onClose} className="absolute right-3 top-3 z-50 rounded-md p-2 text-white/50 hover:bg-white/10 hover:text-white transition-colors">
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] min-h-[500px]">
          {/* ESQ */}
          <div className="p-8 space-y-5 relative">
            <div className="absolute inset-0 z-10 bg-black/10 pointer-events-none" />
            <div className="flex items-center gap-2 mb-6 opacity-50">
              <LockClosedIcon className="w-4 h-4 text-white/60" />
              <p className="text-xs font-bold text-white/60 tracking-widest uppercase">Registration Locked</p>
            </div>

            {/* inputs travados (mantidos) */}
            <div className="space-y-4 opacity-60 grayscale-[0.5] pointer-events-none select-none">
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <p className="text-[12px] text-white/50 font-semibold text-right">ID</p>
                <input disabled className={inputClass} placeholder="..." value={idValue} />
              </div>
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <p className="text-[12px] text-white/50 font-semibold text-right">{t("modal.name")}</p>
                <input disabled className={inputClass} placeholder="Your Name" value={fullName} />
              </div>
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <p className="text-[12px] text-white/50 font-semibold text-right">{t("modal.email")}</p>
                <input disabled className={inputClass} placeholder="you@email.com" value={email} />
              </div>
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <p className="text-[12px] text-white/50 font-semibold text-right">{t("modal.phone")}</p>
                <input disabled className={inputClass} placeholder="(00) 00000-0000" value={phone} />
              </div>
            </div>

            <div className="absolute bottom-6 left-8 right-8">
              <button disabled className="w-full h-10 rounded-xl bg-white/5 text-white/20 text-sm font-semibold cursor-not-allowed border border-white/5">
                Awaiting Access Code...
              </button>
            </div>
          </div>

          {/* DIR */}
          <div className="relative bg-[linear-gradient(160deg,rgba(15,23,42,0.6),rgba(30,41,59,0.8))] border-l border-white/5 p-8 flex flex-col justify-center items-center text-center">
            <div className="relative z-10 flex flex-col items-center gap-5 w-full max-w-[280px]">
              <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <ExclamationTriangleIcon className="w-7 h-7 text-yellow-500" />
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-bold text-lg tracking-tight">Early Access</h3>
                <p className="text-[12px] leading-relaxed text-slate-300 font-medium">
                  Zaeon is currently available for <strong className="text-yellow-400">BETA testers ONLY</strong>.
                </p>
              </div>

              <Link href="/help-online" className="text-[11px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity">
                Want to help us go online? Look here.
              </Link>

              <div className="w-full h-px bg-white/10 my-1" />

              <div className="w-full space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Access Code</label>
                <div className="relative flex items-center">
                  <input
                    value={betaCode}
                    onChange={(e) => { setBetaCode(e.target.value); setBetaError(false); }}
                    onKeyDown={(e) => e.key === "Enter" && handleBetaSubmit()}
                    placeholder="XXXX-XXXX"
                    className={`w-full h-10 rounded-xl bg-black/40 text-center text-white text-sm font-mono tracking-widest outline-none border transition-all placeholder:text-white/10 ${
                      betaError ? "border-red-500/50" : "border-white/10 focus:border-cyan-400/50"
                    }`}
                  />
                  <button onClick={handleBetaSubmit} className="absolute right-1 top-1 bottom-1 px-3 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white transition-colors">
                    <ChevronRightIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full opacity-60">
                <div className="h-px bg-white/20 flex-1" />
                <span className="text-[10px] uppercase text-white">OR</span>
                <div className="h-px bg-white/20 flex-1" />
              </div>

              {/* Sem imagens */}
              <button
                onClick={handleGoogleQuickStart}
                className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-white text-black hover:scale-110 transition-all duration-300 font-black"
                title="Sign in with Google (Limited Version)"
              >
                G
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}