"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { StealthRails } from "@stealth-rails/sdk";
import { Toaster, toast } from "sonner";
import { ArrowDown, Settings, RefreshCw, ShieldCheck } from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Header } from "@/components/dashboard/Header";

export default function DexPage() {
    const { connection } = useConnection();
    const wallet = useWallet();

    const [amount, setAmount] = useState("");
    const [shield, setShield] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSwap = async () => {
        if (!wallet.publicKey) return;
        setLoading(true);
        const toastId = toast.loading(shield ? "Swapping & Shielding..." : "Swapping...");

        try {
            // 1. Simulate Swap (SOL -> USDC)
            await new Promise(r => setTimeout(r, 1000));

            if (shield) {
                // 2. Shield Logic via SDK
                toast.loading("Routing via Stealth Rails...", { id: toastId });
                const rails = new StealthRails(connection, wallet);

                await rails.depositToPrivate({
                    amount: parseFloat(amount) // In reality this would be the output amount
                });

                toast.success("Swap + Shield Complete!", {
                    id: toastId,
                    description: "Assets received in Private Balance."
                });
            } else {
                toast.success("Swap Complete", { id: toastId });
            }

        } catch (e) {
            console.error(e);
            toast.error("Transaction Failed", { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#1c1c1c] text-white flex flex-col font-sans">
            <Toaster theme="dark" position="bottom-right" />
            <Header />

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-[420px] bg-[#2a2a2a] rounded-3xl p-4 shadow-2xl border border-white/5 relative overflow-hidden">
                    {/* Jupiter-like Gradient */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-green-500"></div>

                    <div className="flex justify-between items-center mb-6 px-2 pt-2">
                        <h2 className="font-bold text-lg">Jupiter Swap</h2>
                        <div className="flex gap-2 text-stone-400">
                            <RefreshCw className="w-5 h-5 hover:text-white cursor-pointer" />
                            <Settings className="w-5 h-5 hover:text-white cursor-pointer" />
                        </div>
                    </div>

                    {/* Input */}
                    <div className="bg-[#151515] rounded-xl p-4 mb-2 border border-transparent hover:border-white/10 transition-colors">
                        <div className="flex justify-between mb-2">
                            <span className="text-stone-500 text-xs font-semibold">You Pay</span>
                            <span className="text-stone-500 text-xs">Balance: 0.00 SOL</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-transparent text-2xl font-bold focus:outline-none w-[60%] placeholder-stone-600"
                                placeholder="0.00"
                            />
                            <div className="flex items-center gap-2 bg-[#2a2a2a] px-3 py-1 rounded-full border border-white/5 font-semibold text-sm">
                                <div className="w-5 h-5 rounded-full bg-purple-500"></div> SOL
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center -my-3 relative z-10">
                        <div className="bg-[#2a2a2a] p-2 rounded-lg border border-[#151515]">
                            <ArrowDown className="w-4 h-4 text-stone-400" />
                        </div>
                    </div>

                    {/* Output */}
                    <div className="bg-[#151515] rounded-xl p-4 mt-2 border border-transparent hover:border-white/10 transition-colors">
                        <div className="flex justify-between mb-2">
                            <span className="text-stone-500 text-xs font-semibold">You Receive</span>
                            <span className="text-stone-500 text-xs">Balance: 0.00 USDC</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="text-2xl font-bold text-stone-300">
                                {amount ? (parseFloat(amount) * 145.2).toFixed(2) : "0.00"}
                            </div>
                            <div className="flex items-center gap-2 bg-[#2a2a2a] px-3 py-1 rounded-full border border-white/5 font-semibold text-sm">
                                <div className="w-5 h-5 rounded-full bg-blue-500"></div> USDC
                            </div>
                        </div>
                    </div>

                    {/* Toggle */}
                    <div className="mt-4 flex items-center justify-between bg-green-900/10 border border-green-500/20 p-3 rounded-xl cursor-pointer" onClick={() => setShield(!shield)}>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className={`w-5 h-5 ${shield ? 'text-green-500' : 'text-stone-500'}`} />
                            <span className={`text-sm font-semibold ${shield ? 'text-green-400' : 'text-stone-400'}`}>Shield Output (Stealth)</span>
                        </div>
                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${shield ? 'bg-green-500' : 'bg-stone-700'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${shield ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                    </div>

                    <button
                        onClick={handleSwap}
                        disabled={loading || !wallet.publicKey || !amount}
                        className="w-full mt-4 bg-gradient-to-r from-cyan-500 to-green-500 text-black font-bold py-4 rounded-xl text-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        {loading ? "Swapping..." : "Swap"}
                    </button>
                </div>
            </div>
        </main>
    );
}
