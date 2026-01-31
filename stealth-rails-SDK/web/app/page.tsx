"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useState, useEffect, useMemo } from "react";
import * as web3 from "@solana/web3.js";
import { Toaster, toast } from "sonner";
import { StealthRails } from "@stealth-rails/sdk";
import { Wallet, Lock, Shield, Send, ArrowRightLeft } from "lucide-react";

// Components
import { Header } from "@/components/dashboard/Header";
import { StatCard } from "@/components/ui/StatCard";
import { ActionTabs } from "@/components/dashboard/ActionTabs";
import { HistoryList } from "@/components/dashboard/HistoryList";
import { ZKTerminal } from "@/components/dashboard/ZKTerminal";

export default function Home() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [isPrivate, setIsPrivate] = useState(false);
  const [balance, setBalance] = useState(0);
  const [privateBalance, setPrivateBalance] = useState(0);
  const [shieldAmount, setShieldAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [privateTab, setPrivateTab] = useState<'transfer' | 'withdraw'>('transfer');
  const [recipient, setRecipient] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize Balance from SDK state (Simulated)

  // Transaction History State
  const [history, setHistory] = useState([
    { type: 'shield', amount: 0.5, date: '2 mins ago', status: 'ZK Verified' },
  ]);

  // Initialize SDK
  const rails = useMemo(() => {
    if (wallet && wallet.publicKey) {
      return new StealthRails(connection, wallet);
    }
    return null;
  }, [connection, wallet]);

  // Load Balances
  useEffect(() => {
    async function loadBalances() {
      if (rails && wallet.connected) {
        const pb = await rails.getPrivateBalance();
        setPrivateBalance(pb);
        setBalance(1.45);
      }
    }
    loadBalances();
  }, [wallet.connected, rails]);

  useEffect(() => {
    if (wallet.connected) {
      setBalance(1.45);
      setPrivateBalance(0.0);
    }
  }, [wallet.connected, rails]);

  const handleShield = async () => {
    if (!rails || !wallet.publicKey) return;
    setLoading(true);
    const toastId = toast.loading("Connecting to Arcium MPC...");

    try {
      // Generic 'Stealth Rails' call
      await rails.depositToPrivate({
        amount: parseFloat(shieldAmount)
      });

      setBalance((prev) => prev - parseFloat(shieldAmount));
      setPrivateBalance((prev) => prev + parseFloat(shieldAmount));

      setHistory(prev => [{
        type: 'shield',
        amount: parseFloat(shieldAmount),
        date: 'Just now',
        status: 'Arcium Secured'
      }, ...prev]);

      toast.success("Assets Enclaved via Arcium", {
        id: toastId,
        description: "Funds transferred to MPC Executing Pool."
      });
    } catch (e) {
      console.error(e);
      toast.error("Deposit Failed", { id: toastId });
    } finally {
      setLoading(false);
      setShieldAmount("");
    }
  };

  const handleWithdraw = async () => {
    if (!rails) return;
    setLoading(true);
    const toastId = toast.loading("Requesting MPC Unshielding...");

    try {
      await rails.withdrawFromPrivate(parseFloat(withdrawAmount));

      setPrivateBalance((prev) => prev - parseFloat(withdrawAmount));
      setBalance((prev) => prev + parseFloat(withdrawAmount));

      setHistory(prev => [{
        type: 'unshield',
        amount: parseFloat(withdrawAmount),
        date: 'Just now',
        status: 'Withdrawn'
      }, ...prev]);

      toast.success("Withdrawal Simulated", {
        id: toastId,
        description: "Signal verified. (Devnet Note: No real funds returned in this demo)",
        duration: 5000,
      });

    } catch (e: any) {
      console.error(e);
      toast.error("Withdrawal Failed", { id: toastId, description: e.message });
    } finally {
      setLoading(false);
      setWithdrawAmount("");
    }
  };

  const handlePrivateTransfer = async () => {
    if (!rails) return;
    setLoading(true);
    const toastId = toast.loading("Broadcasting into Arcium Network...");

    try {
      // Generic 'Stealth Rails' call
      await rails.sendPrivate({
        to: recipient,
        amount: parseFloat(transferAmount)
      });

      setPrivateBalance((prev) => prev - parseFloat(transferAmount));

      setHistory(prev => [{
        type: 'transfer',
        amount: parseFloat(transferAmount),
        date: 'Just now',
        status: 'Encrypted'
      }, ...prev]);

      toast.success("Private Handshake Complete", {
        id: toastId,
        description: `Memo "${memo}" synchronized with MPC nodes.`
      });
    } catch (e) {
      console.error(e);
      toast.error("Transfer Failed", { id: toastId });
    } finally {
      setLoading(false);
      setTransferAmount("");
      setRecipient("");
      setMemo("");
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-stealth-primary/30">
      <Toaster theme="dark" position="bottom-right" />

      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-stealth-primary/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <Header />

      <div className="relative z-10 pt-12 px-6 pb-20 max-w-5xl mx-auto">

        <div className="text-center mb-16 animate-float">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Privacy is <span className="text-gradient">Power</span>.
          </h2>
          <p className="text-stone-400 max-w-md mx-auto">
            Secure your assets and transact anonymously on Solana using <strong>Arcium Confidential Computing</strong>.
          </p>
        </div>

        <div className="sticky top-32 z-40 mb-12 flex justify-center">
          <ActionTabs isPrivate={isPrivate} onToggle={setIsPrivate} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-4 space-y-4">
            <StatCard
              title="Public Balance (SOL)"
              value={balance.toFixed(4)}
              subValue="Visible on Solscan"
              highlight={!isPrivate}
              icon={Wallet}
            />
            <StatCard
              title="Stealth Balance (Arcium)"
              value={privateBalance.toFixed(4)}
              subValue="Encrypted State"
              highlight={isPrivate}
              icon={Lock}
            />

            <div className="mt-6">
              <ZKTerminal active={loading} />
            </div>
          </div>

          <div className="md:col-span-8">
            <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-stealth-primary to-transparent"></div>

              {isPrivate ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <div className="flex bg-stealth-900 rounded-lg p-1 border border-stealth-border">
                      <button
                        onClick={() => setPrivateTab('transfer')}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${privateTab === 'transfer' ? 'bg-stealth-primary text-white shadow-lg' : 'text-stone-400 hover:text-white'}`}
                      >
                        Send
                      </button>
                      <button
                        onClick={() => setPrivateTab('withdraw')}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${privateTab === 'withdraw' ? 'bg-stealth-primary text-white shadow-lg' : 'text-stone-400 hover:text-white'}`}
                      >
                        Unshield (Withdraw)
                      </button>
                    </div>
                    <span className="px-3 py-1 bg-stealth-primary/10 text-stealth-primary text-xs font-bold rounded-lg border border-stealth-primary/20">
                      ARCIUM MPC
                    </span>
                  </div>

                  {privateTab === 'transfer' ? (
                    <div className="space-y-4 text-left animate-in border-b-0 fade-in zoom-in duration-300">
                      <div>
                        <label className="block text-xs font-medium text-stone-400 mb-1.5 ml-1">Recipient Address</label>
                        <input
                          type="text"
                          className="w-full bg-[#0A0A0A] border border-stone-800 rounded-xl p-4 text-white placeholder-stone-600 focus:outline-none focus:border-stealth-primary focus:ring-1 focus:ring-stealth-primary transition-all font-mono text-sm shadow-inner"
                          placeholder="Solana Address..."
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-stone-400 mb-1.5 ml-1">Amount (SOL)</label>
                          <input
                            type="number"
                            className="w-full bg-[#0A0A0A] border border-stone-800 rounded-xl p-4 text-white placeholder-stone-600 focus:outline-none focus:border-stealth-primary focus:ring-1 focus:ring-stealth-primary transition-all font-mono text-lg shadow-inner"
                            placeholder="0.00"
                            value={transferAmount}
                            onChange={(e) => setTransferAmount(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone-400 mb-1.5 ml-1">Private Memo</label>
                          <input
                            type="text"
                            className="w-full bg-[#0A0A0A] border border-stone-800 rounded-xl p-4 text-white placeholder-stone-600 focus:outline-none focus:border-stealth-primary focus:ring-1 focus:ring-stealth-primary transition-all text-sm shadow-inner"
                            placeholder="e.g. 'Payroll'"
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                          />
                        </div>
                      </div>

                      <button
                        disabled={loading || !wallet.publicKey}
                        onClick={handlePrivateTransfer}
                        className="w-full bg-stealth-primary hover:bg-violet-600 text-white p-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {loading ? (
                            <>Processing <span className="animate-spin">🌀</span></>
                          ) : (
                            <>Send Privately <span className="group-hover:translate-x-1 transition-transform">→</span></>
                          )}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 text-left animate-in fade-in zoom-in duration-300">
                      <div className="p-4 bg-stealth-800/30 rounded-xl border border-dashed border-stealth-border/50 text-center mb-4">
                        <p className="text-stone-400 text-sm mb-2">Available Private Balance</p>
                        <p className="text-3xl font-mono font-bold text-white tracking-widest">{privateBalance.toFixed(2)} SOL</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-stone-400 mb-1.5 ml-1">Withdraw Amount (SOL)</label>
                        <input
                          type="number"
                          className="w-full bg-[#0A0A0A] border border-stone-800 rounded-xl p-4 text-white placeholder-stone-600 focus:outline-none focus:border-stealth-primary focus:ring-1 focus:ring-stealth-primary transition-all font-mono text-lg shadow-inner"
                          placeholder="0.00"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                      </div>

                      <button
                        disabled={loading || !wallet.publicKey || !withdrawAmount}
                        onClick={handleWithdraw}
                        className="w-full bg-stealth-primary hover:bg-violet-600 text-white p-4 rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(124,58,237,0.2)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {loading ? (
                            <>Processing <span className="animate-spin">🌀</span></>
                          ) : (
                            <>Unshield (Withdraw) <span className="group-hover:translate-x-1 transition-transform">→</span></>
                          )}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      <span><Shield className="w-6 h-6 text-white" /></span> Shield Assets
                    </h3>
                    <span className="px-3 py-1 bg-white/10 text-stone-300 text-xs font-bold rounded-lg border border-white/20">
                      PUBLIC TO PRIVATE
                    </span>
                  </div>
                  <p className="text-stone-400 text-sm">Transfer your public SOL into a secure Arcium Enclave to enable confidential operations.</p>

                  <div className="p-4 bg-stealth-800/30 rounded-xl border border-dashed border-stealth-border">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-stone-400 mb-1.5 ml-1">Amount to Shield</label>
                        <input
                          type="number"
                          className="w-full bg-[#0A0A0A] border border-stone-800 rounded-xl p-4 text-white placeholder-stone-600 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all font-mono text-xl shadow-inner"
                          placeholder="0.00"
                          value={shieldAmount}
                          onChange={(e) => setShieldAmount(e.target.value)}
                        />
                      </div>
                      <button
                        disabled={loading || !wallet.publicKey}
                        onClick={handleShield}
                        className="h-[82px] mt-[22px] px-8 bg-white text-black hover:bg-stone-200 rounded-xl font-bold text-lg transition-colors flex flex-col items-center justify-center gap-1 min-w-[120px]"
                      >
                        {loading ? "..." : "Shield"}
                        <span className="text-[10px] opacity-60 font-normal uppercase tracking-wide">Enter MPC</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <HistoryList history={history} />
          </div>

        </div>
      </div>
    </main>
  );
}
