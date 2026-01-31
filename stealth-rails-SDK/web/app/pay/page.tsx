"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import * as web3 from "@solana/web3.js";
import { Toaster, toast } from "sonner";
import { StealthRails } from "@stealth-rails/sdk";
import { Wallet, ShieldCheck, ArrowRight, Loader2, Lock } from "lucide-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Header } from "@/components/dashboard/Header";

function PayContent() {
    const { connection } = useConnection();
    const wallet = useWallet();
    const searchParams = useSearchParams();

    const [to, setTo] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Initialize from URL
    useEffect(() => {
        const toParam = searchParams.get("to");
        const amountParam = searchParams.get("amount");
        if (toParam) setTo(toParam);
        if (amountParam) setAmount(amountParam);
    }, [searchParams]);

    const handlePay = async () => {
        if (!wallet.publicKey || !wallet.signTransaction) {
            toast.error("Please connect wallet");
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Processing Stealth Payment...");

        try {
            const rails = new StealthRails(connection, wallet);

            // Execute Private Transfer via Arcium
            const sig = await rails.sendPrivate({
                to,
                amount: parseFloat(amount)
            });

            console.log("Stealth Pay Signature:", sig);

            setSuccess(true);
            toast.success("Payment Sent Anonymously!", {
                id: toastId,
                description: "Transaction secured by Arcium Network."
            });

        } catch (e: any) {
            console.error(e);
            toast.error("Payment Failed", {
                id: toastId,
                description: e.message || "Unknown error"
            });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500 max-w-lg mx-auto">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                    <ShieldCheck className="w-12 h-12 text-green-500" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold mb-2">Payment Shielded & Sent</h2>
                    <p className="text-stone-400">Your funds successfully moved to the <span className="text-white font-bold">Arcium Privacy Pool</span>.</p>
                    <div className="mt-4 bg-white/5 p-4 rounded-xl text-xs font-mono text-left space-y-2 border border-white/10">
                        <div className="flex justify-between">
                            <span className="text-stone-500">Public Dest (Pool):</span>
                            <span className="text-green-400">8dZou...4KSi</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-stone-500">Private Dest:</span>
                            <span className="text-white">{to.slice(0, 6)}...{to.slice(-4)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-stone-500">Status:</span>
                            <span className="text-green-500">Encrypted via MPC</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setSuccess(false)}
                    className="text-stealth-primary hover:text-white transition-colors"
                >
                    Send Another
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto w-full">
            <div className="glass-panel p-8 rounded-3xl border border-stealth-border/50 shadow-2xl relative overflow-hidden">
                {/* Glow Effect */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-stealth-primary/10 rounded-full blur-[60px] pointer-events-none"></div>

                <div className="mb-8 text-center">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                        <Lock className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold">Stealth Pay</h1>
                    <p className="text-stone-400 text-sm mt-1">Universal Privacy Adapter</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-stone-500 uppercase tracking-wider ml-1">Recipient</label>
                        <input
                            type="text"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            placeholder="Solana Address..."
                            className="w-full bg-[#0A0A0A] border border-stone-800 rounded-xl p-4 text-white placeholder-stone-600 focus:outline-none focus:border-stealth-primary focus:ring-1 focus:ring-stealth-primary transition-all font-mono text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-stone-500 uppercase tracking-wider ml-1">Amount (SOL)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-[#0A0A0A] border border-stone-800 rounded-xl p-4 text-white placeholder-stone-600 focus:outline-none focus:border-stealth-primary focus:ring-1 focus:ring-stealth-primary transition-all font-mono text-lg"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 text-sm font-bold">SOL</div>
                        </div>
                    </div>

                    <button
                        onClick={handlePay}
                        disabled={loading || !to || !amount || !wallet.publicKey}
                        className="w-full bg-white text-black hover:bg-stone-200 py-4 rounded-xl font-bold text-lg transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Pay Privately"}
                        {!loading && <ArrowRight className="w-5 h-5" />}
                    </button>

                    {!wallet.publicKey && (
                        <div className="text-center">
                            <WalletMultiButton className="!bg-transparent !text-stone-400 !h-auto !p-0 hover:!text-white transition-colors !font-normal text-sm" />
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-center gap-4 text-xs text-stone-600">
                    <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Arcium Secured</span>
                    <span>•</span>
                    <span>Encrypted via MPC</span>
                </div>
            </div>
        </div>
    );
}

export default function PayPage() {
    return (
        <main className="min-h-screen bg-[#050505] text-white selection:bg-stealth-primary/30 flex flex-col">
            <Toaster theme="dark" position="bottom-center" />
            <Header />

            <div className="flex-1 flex items-center justify-center p-6 relative z-10">
                <Suspense fallback={<div>Loading...</div>}>
                    <PayContent />
                </Suspense>
            </div>

            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[800px] h-[800px] bg-stealth-primary/10 rounded-full blur-[180px] animate-pulse-slow"></div>
            </div>
        </main>
    );
}
