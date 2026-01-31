"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  XMarkIcon,
  ArrowLeftIcon, // Usado para voltar no menu
  WalletIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  CpuChipIcon,
  ArrowRightStartOnRectangleIcon,
  LockClosedIcon,
  ArrowDownIcon,
  PaperAirplaneIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import dynamic from "next/dynamic";
import { signIn, signOut, useSession } from "next-auth/react";
import GameHint from "@/src/components/ui/game-hint";

// --- TYPES & CONSTANTS ---

type MenuItem = { labelKey: string; action: string };

// Reduzi o menu conforme pedido. "Options" agora é a entrada para o fluxo de fundos.
const MENU_ITEMS: MenuItem[] = [
  { labelKey: "menu.options", action: "crypto_flow" }, // Botão principal
  { labelKey: "menu.manual", action: "link_admin" },
];

const ROLES = [
  { slug: "student", key: "roles.student" },
  { slug: "researcher", key: "roles.researcher" },
  { slug: "professional", key: "roles.professional" },
  { slug: "entrepreneur", key: "roles.entrepreneur" },
  { slug: "cyber_hall", key: "Hall Cibernético" },
] as const;

type Role = typeof ROLES[number]["slug"];

// --- CONSTANTES DE ESTILO (BLUE CYBER GLASS) ---

const panel = [
  "relative z-20 w-full max-w-[420px] mt-24 rounded-3xl overflow-hidden transition-all duration-500", // Reduzi largura max para ficar mais 'menu'
  "backdrop-blur-xl",
  "bg-black/60 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
  "dark:bg-cyan-900/20 dark:border-cyan-400/30 dark:shadow-[0_0_60px_rgba(34,211,238,0.15)]",
].join(" ");

const cardBase = [
  "group relative overflow-hidden flex items-center justify-between rounded-xl px-5 min-h-[64px]",
  "transition-all duration-300 ease-out cursor-pointer",
  "font-bold tracking-wide",
  "text-white",
  "bg-black/40 hover:bg-black/60 border border-white/5 hover:border-white/20",
  "dark:bg-cyan-950/30 dark:hover:bg-cyan-900/50 dark:border-cyan-400/10 dark:hover:border-cyan-400/30",
  "hover:scale-[1.02] active:scale-[0.98] shadow-sm",
].join(" ");

const cardSelected =
  "ring-1 ring-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.3)] scale-[1.02] bg-black/50 dark:bg-cyan-900/40";

const accentBar = (active: boolean) =>
  [
    "absolute left-0 top-0 h-full w-[4px] rounded-l-xl transition-all duration-300",
    active
      ? "bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] opacity-100"
      : "bg-transparent w-[0px] opacity-0",
  ].join(" ");

const inputClass =
  "h-10 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-white/90 placeholder:text-white/20 outline-none focus:border-cyan-400/50 text-sm transition-colors";

const pillClass =
  "h-10 rounded-xl border border-white/10 bg-black/30 px-2 text-white/80 outline-none focus:border-cyan-400/50 text-xs font-mono cursor-pointer hover:bg-white/5 transition-colors";

// --- MAIN COMPONENT ---

const HeroContentComponent = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { data: session, status } = useSession();

  // Navigation State
  const [index, setIndex] = useState(0); // Índice do menu principal
  const [menuView, setMenuView] = useState<"root" | "crypto">("root"); // Controle de visualização (Multi-modal)

  // Crypto Form State
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState("USDC");
  const [network, setNetwork] = useState("ETH");
  const [address, setAddress] = useState("");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const isLoggedIn = status === "authenticated";

  // --- KEYBOARD NAVIGATION ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Se estiver no modo Crypto, ESC volta para Root
      if (menuView === "crypto") {
        if (e.code === "Escape") setMenuView("root");
        return;
      }

      // Navegação Menu Principal
      if (["ArrowUp", "KeyW"].includes(e.code)) {
        e.preventDefault();
        setIndex((i) => (i - 1 + MENU_ITEMS.length) % MENU_ITEMS.length);
        return;
      }
      if (["ArrowDown", "KeyS"].includes(e.code)) {
        e.preventDefault();
        setIndex((i) => (i + 1) % MENU_ITEMS.length);
        return;
      }

      if (e.code === "Enter") {
        const item = MENU_ITEMS[index];
        if (!item) return;

        if (item.action === "crypto_flow") {
          e.preventDefault();
          setMenuView("crypto");
        } else if (item.action === "link_admin") {
          router.push("/workstation/admin");
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, menuView, router]);

  // --- RENDERIZADORES ---

  const renderRootMenu = () => (
    <motion.ul
      key="root-menu"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-3"
    >
      {MENU_ITEMS.map((item, i) => {
        const selected = i === index;
        const isCrypto = item.action === "crypto_flow";

        return (
          <li key={item.labelKey}>
            <button
              onClick={() => {
                if (isCrypto) setMenuView("crypto");
                else router.push("/workstation/admin");
              }}
              onMouseEnter={() => setIndex(i)}
              className={`${cardBase} ${selected ? cardSelected : ""} w-full`}
            >
              <div className={accentBar(selected)} />
              
              <div className="flex items-center gap-3">
                {isCrypto ? (
                  <WalletIcon className={`h-5 w-5 ${selected ? 'text-cyan-400' : 'text-white/40'}`} />
                ) : (
                  <CpuChipIcon className={`h-5 w-5 ${selected ? 'text-cyan-400' : 'text-white/40'}`} />
                )}
                <span className="text-[16px] font-medium tracking-[0.01em]">
                  {t(item.labelKey)}
                </span>
              </div>

              <ChevronRightIcon className="h-5 w-5 opacity-40 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
            </button>
          </li>
        );
      })}

      {/* Language Selector (Simplificado) */}
      <li>
        <div className={`${cardBase} py-2 cursor-default mt-4 border-dashed border-white/10 bg-transparent hover:bg-transparent`}>
           <div className="flex items-center gap-3 w-full justify-between">
              <span className="text-[12px] opacity-40 uppercase tracking-widest font-bold">
                {t("options.language")}
              </span>
              <select
                className="bg-black/30 border border-white/10 rounded-lg text-xs text-white/80 px-2 py-1 outline-none focus:border-cyan-400"
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
              >
                <option value="en">EN</option>
                <option value="pt">PT</option>
                <option value="es">ES</option>
              </select>
           </div>
        </div>
      </li>
    </motion.ul>
  );

  const renderCryptoView = () => (
    <motion.div
      key="crypto-view"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full"
    >
      {/* Header do Sub-menu */}
      <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
        <button
          onClick={() => setMenuView("root")}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div>
          <h3 className="text-white font-bold text-lg leading-none">Transfer</h3>
          <p className="text-[10px] text-cyan-400 uppercase tracking-wider font-semibold mt-0.5">
            On-Chain Funds
          </p>
        </div>
      </div>

      {/* Inputs Compactos */}
      <div className="space-y-4 flex-1">
        
        {/* FROM SECTION */}
        <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-3">
          <div className="flex justify-between items-center">
             <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Asset</label>
             <span className="text-[10px] text-white/30">Bal: 0.00</span>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${inputClass} text-lg font-mono tracking-tight`}
            />
            <select
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className={`${pillClass} w-24`}
            >
              <option value="USDC">USDC</option>
              <option value="ETH">ETH</option>
              <option value="BTC">BTC</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
             <div className="h-px bg-white/5 flex-1" />
             <ArrowDownIcon className="h-4 w-4 text-white/20" />
             <div className="h-px bg-white/5 flex-1" />
          </div>

           <div className="flex justify-between items-center">
             <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Network</label>
          </div>
          <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className={`${pillClass} w-full`}
            >
              <option value="ETH">Ethereum Mainnet</option>
              <option value="ARB">Arbitrum One</option>
              <option value="BASE">Base</option>
              <option value="POL">Polygon</option>
            </select>
        </div>

        {/* TO SECTION */}
        <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-3">
           <div className="flex justify-between items-center">
             <label className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Recipient</label>
             <button className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
               <QrCodeIcon className="h-3 w-3" /> Scan
             </button>
          </div>
          <input
            type="text"
            placeholder="0xAddress or ENS"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={`${inputClass} font-mono text-xs`}
          />
        </div>
        
        {/* Info */}
        <div className="flex items-start gap-2 px-1">
           <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500/50 mt-0.5 shrink-0" />
           <p className="text-[10px] text-white/30 leading-tight">
             Transactions are irreversible. Please verify the network and address before confirming.
           </p>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-6 pt-4 border-t border-white/5">
        <button
          onClick={() => alert("Logic to trigger wallet signature")}
          className="w-full h-12 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-200 font-bold tracking-wide flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(6,182,212,0.1)]"
        >
          <PaperAirplaneIcon className="h-5 w-5 -rotate-45 mb-1" />
          Send Funds
        </button>
      </div>
    </motion.div>
  );

  return (
    <div
      ref={containerRef}
      className="w-full min-h-screen flex justify-start items-start z-10 relative px-4 md:pl-20 py-12 overflow-hidden"
    >
      <div className="flex flex-col items-start z-20 w-full max-w-[420px]">
        
        {/* PAINEL PRINCIPAL (SIDEBAR) */}
        <motion.aside
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.0, ease: [0.23, 1, 0.32, 1] }}
          className={panel}
        >
          {/* Header Fixo */}
          <div className="flex items-center gap-3 px-6 pt-7 pb-2">
            <p className="text-xs font-bold text-white/40 tracking-[0.1em] uppercase">
              {menuView === 'root' ? t("footer.powered") : "SECURE TERMINAL"}
            </p>
          </div>

          {/* Área de Conteúdo Dinâmico (AnimatePresence faz a mágica) */}
          <div className="px-4 sm:px-6 pb-8 pt-2 relative min-h-[420px]">
            <AnimatePresence mode="popLayout" initial={false}>
              {menuView === "root" ? renderRootMenu() : renderCryptoView()}
            </AnimatePresence>
          </div>

          {/* Footer Fixo */}
          <div className="px-6 pb-5 border-t border-white/5 pt-4 flex justify-between items-center">
             <div className="text-[10px] opacity-30 tracking-wide text-white">
               v2.4.0-alpha
             </div>
             {isLoggedIn && (
               <button 
                onClick={() => signOut()}
                className="text-[10px] text-red-400/60 hover:text-red-400 uppercase font-bold tracking-wider"
               >
                 Logout
               </button>
             )}
          </div>
        </motion.aside>

        {/* Dicas (só aparecem no root para não poluir o crypto form) */}
        {menuView === "root" && (
            <div className="mt-6 w-full px-2">
            <GameHint
                isVisible={true}
                hints={[
                t("hints.options", "DICA: O menu 'Options' agora é seu hub financeiro."),
                t("hints.roles", "DICA: Transações na rede Arbitrum são mais rápidas."),
                ]}
            />
            </div>
        )}
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(HeroContentComponent), { ssr: false });