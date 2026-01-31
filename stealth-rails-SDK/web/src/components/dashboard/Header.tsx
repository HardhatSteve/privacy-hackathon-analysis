import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Ghost, Wifi, Zap } from "lucide-react";

export function Header() {
    return (
        <header className="sticky top-0 w-full z-50 glass-panel border-b-0 border-stealth-border h-20">
            <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.href = "/"}>
                    <div className="w-10 h-10 bg-stealth-primary/10 rounded-xl flex items-center justify-center border border-stealth-primary/20 group-hover:bg-stealth-primary/20 transition-all shadow-[0_0_20px_rgba(124,58,237,0.1)]">
                        <Ghost className="w-6 h-6 text-stealth-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight leading-none">
                            Stealth<span className="text-stealth-primary">Rails</span>
                        </h1>
                        <span className="text-[10px] text-stone-500 font-mono tracking-widest uppercase mt-0.5 group-hover:text-stealth-accent transition-colors">Privacy Layer</span>
                    </div>
                </div>

                {/* New Navigation Section */}
                <nav className="hidden md:flex items-center gap-8 ml-8 mr-auto font-medium text-sm text-stone-400">
                    <a href="/" className="hover:text-white transition-colors">Dashboard</a>
                    <a href="/pay" className="hover:text-white transition-colors flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Pay
                    </a>
                    <a href="/dex" className="hover:text-white transition-colors">DEX Demo</a>
                </nav>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 text-xs text-stone-500 bg-stealth-800/50 px-3 py-1.5 rounded-full border border-stealth-border backdrop-blur-md">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </div>
                        <span className="flex items-center gap-1.5 font-medium">
                            <Wifi className="w-3 h-3" /> Devnet
                        </span>
                    </div>
                    <WalletMultiButton style={{
                        backgroundColor: "#1E1E1E",
                        border: "1px solid #333",
                        height: "40px",
                        borderRadius: "12px",
                        fontSize: "14px",
                        fontWeight: "600",
                        fontFamily: "Inter, sans-serif"
                    }} />
                </div>
            </div>
        </header>
    );
}
