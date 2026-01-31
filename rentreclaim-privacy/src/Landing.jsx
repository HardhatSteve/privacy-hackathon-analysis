import { useState } from "react";

const CONFIG = {
  appUrl: "/app",
};


export default function Landing() {
  const [mobileMenu, setMobileMenu] = useState(false);
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>


      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 grid place-content-center text-lg">🧹</div>
            <span className="font-bold text-xl">Rent<span className="text-emerald-400">Reclaim</span></span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <a href="#how" className="hover:text-white transition">How it works</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <a href="#faq" className="hover:text-white transition">FAQ</a>
            <div className="h-4 w-px bg-white/20"></div>
            <a href="/send" className="hover:text-white transition text-purple-400">🔒 Send</a>
            <a href="/launch" className="hover:text-white transition text-emerald-400">🪄 Launch</a>
            <a href="/learn" className="hover:text-white transition text-yellow-400">📚 Learn</a>
            <a href="/privacy" className="hover:text-white transition text-blue-400">🔐 Ecosystem</a>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 text-white/70 hover:text-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <a href="/app" className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-semibold hover:opacity-90 transition">Launch App</a>
          </div>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-slate-900/95 border-t border-white/10 px-4 py-4 space-y-3">
            <a href="/app" className="block py-2 text-white hover:text-emerald-400">🧹 RentReclaim</a>
            <a href="/send" className="block py-2 text-purple-400 hover:text-purple-300">🔒 Private Send</a>
            <a href="/launch" className="block py-2 text-emerald-400 hover:text-emerald-300">🪄 Stealth Launch</a>
            <a href="/learn" className="block py-2 text-yellow-400 hover:text-yellow-300">📚 Learn</a>
            <a href="/privacy" className="block py-2 text-blue-400 hover:text-blue-300">🔐 Ecosystem</a>
            <a href="/radr" className="block py-2 text-white/70 hover:text-white">⚡ Radr Demo</a>
            <a href="/arcium" className="block py-2 text-white/70 hover:text-white">🔒 Arcium Demo</a>
            <a href="/inco" className="block py-2 text-white/70 hover:text-white">🔮 Inco Demo</a>
            <a href="/privacycash" className="block py-2 text-white/70 hover:text-white">🔐 Privacy Cash</a>
          </div>
        )}
      </header>

      <section className="relative pt-20 pb-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-6">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                Free to scan - Pay only on recovery
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Recover Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Hidden SOL</span>
              </h1>
              <p className="mt-6 text-lg text-white/60 max-w-xl leading-relaxed">
                Every empty token account holds ~0.001 SOL in rent (was ~0.002 before SIMD-0436). Clean up your wallet and get your SOL back instantly.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <a href={CONFIG.appUrl} className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-semibold hover:opacity-90 transition inline-flex items-center justify-center gap-2 text-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Scan My Wallet Free
                </a>
                <a href="#how" className="px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20 transition inline-flex items-center justify-center gap-2">See How It Works</a>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-white/50">
                <div className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>Non-custodial</div>
                <div className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Instant recovery</div>
                <div className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>No seed phrase needed</div>
              </div>
              {/* SIMD-0436 Banner */}
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
                <span className="px-2 py-0.5 rounded bg-emerald-500 text-black text-xs font-bold">SIMD-0436</span>
                <span className="text-sm text-white/70">Solana halved rent costs (~50%) — great time to reclaim!</span>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500" /><div className="w-3 h-3 rounded-full bg-yellow-500" /><div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-xs text-white/40">Example Recovery Preview</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/50 text-left">
                      <th className="pb-3">Accounts</th>
                      <th className="pb-3">Gross SOL</th>
                      <th className="pb-3">Fee (20%)</th>
                      <th className="pb-3 text-emerald-400">You Get</th>
                    </tr>
                  </thead>
                  <tbody className="text-white">
                    <tr className="border-t border-white/10">
                      <td className="py-3">25</td>
                      <td className="py-3">0.026</td>
                      <td className="py-3 text-white/50">0.005</td>
                      <td className="py-3 text-emerald-400 font-semibold">0.021</td>
                    </tr>
                    <tr className="border-t border-white/10">
                      <td className="py-3">50</td>
                      <td className="py-3">0.051</td>
                      <td className="py-3 text-white/50">0.010</td>
                      <td className="py-3 text-emerald-400 font-semibold">0.041</td>
                    </tr>
                    <tr className="border-t border-white/10">
                      <td className="py-3">100</td>
                      <td className="py-3">0.102</td>
                      <td className="py-3 text-white/50">0.020</td>
                      <td className="py-3 text-emerald-400 font-semibold">0.082</td>
                    </tr>
                  </tbody>
                </table>
                <div className="mt-4 p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-white/60">
                  <span className="text-white font-medium">100% Non-custodial.</span> Your keys never leave your wallet. All transactions are built locally and signed by you.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs uppercase tracking-wider mb-4">Simple Process</div>
            <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
            <p className="mt-4 text-white/60 max-w-xl mx-auto">Recover your locked SOL in three simple steps. No technical knowledge required.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <StepCard number="1" title="Connect Wallet" description="Connect Phantom, Solflare, Backpack, or any Solana wallet. No seed phrase needed - just a standard wallet connection." />
            <StepCard number="2" title="Scan and Select" description="We find all empty token accounts holding rent. You choose which ones to reclaim - skip any you want to keep." />
            <StepCard number="3" title="Recover SOL" description="Sign the transactions in your wallet popup. Your SOL flows back instantly. You keep 80% of recovered rent." />
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs uppercase tracking-wider mb-4">Transparent Pricing</div>
            <h2 className="text-3xl md:text-4xl font-bold">Choose Your Cleanup Mode</h2>
            <p className="mt-4 text-white/60 max-w-xl mx-auto">No hidden fees, no subscriptions. You only pay from successful recoveries.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/5 p-6 relative">
              <div className="absolute -top-3 left-6 px-3 py-1 bg-emerald-500 text-black text-xs font-semibold rounded-full">RECOMMENDED</div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <h3 className="text-xl font-semibold">Instant Clean-Up</h3>
              </div>
              <ul className="space-y-3 text-white/70 mt-4">
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-400 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span>We pay the transaction fees</span></li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-400 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span><strong className="text-white">20% fee</strong> on recovered SOL (you keep 80%)</span></li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-emerald-400 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span>Example: Recover 0.10 SOL → You get <strong className="text-emerald-400">0.08 SOL</strong></span></li>
              </ul>
              <a href={CONFIG.appUrl} className="mt-6 w-full px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-semibold hover:opacity-90 transition inline-flex items-center justify-center gap-2">
                Start Instant Cleanup
              </a>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <h3 className="text-xl font-semibold">Advanced Clean-Up</h3>
              </div>
              <ul className="space-y-3 text-white/70 mt-4">
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-blue-400 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span>You pay transaction fees directly</span></li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-blue-400 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span><strong className="text-white">Lower fee</strong> (flat rate per account)</span></li>
                <li className="flex items-start gap-2"><svg className="w-4 h-4 text-blue-400 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span>For power users who want more control</span></li>
              </ul>
              <a href={CONFIG.appUrl} className="mt-6 w-full px-6 py-3 rounded-xl border border-white/20 hover:border-white/40 text-white font-semibold transition inline-flex items-center justify-center gap-2">
                Advanced Mode
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="safety" className="py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs uppercase tracking-wider mb-4">Safety First</div>
            <h2 className="text-3xl md:text-4xl font-bold">Non-Custodial by Design</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                What We Do
              </h3>
              <ul className="space-y-2 text-white/70">
                <li className="flex items-start gap-2"><span className="text-emerald-400">✓</span><span>Scan your public token accounts</span></li>
                <li className="flex items-start gap-2"><span className="text-emerald-400">✓</span><span>Build close-account transactions locally</span></li>
                <li className="flex items-start gap-2"><span className="text-emerald-400">✓</span><span>Let you review and sign in your wallet</span></li>
              </ul>
            </div>
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
              <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                What We Do NOT Do
              </h3>
              <ul className="space-y-2 text-white/70">
                <li className="flex items-start gap-2"><span className="text-red-400">✗</span><span>Access your private keys or seed phrase</span></li>
                <li className="flex items-start gap-2"><span className="text-red-400">✗</span><span>Move funds without your signature</span></li>
                <li className="flex items-start gap-2"><span className="text-red-400">✗</span><span>Sell or share your wallet data</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6 max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 grid place-content-center flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <h3 className="font-semibold text-yellow-400">Review Before Signing</h3>
                <ul className="text-sm text-white/60 mt-2 space-y-1">
                  <li>• Only empty (0 balance) accounts are shown</li>
                  <li>• Skip any accounts you want to keep</li>
                  <li>• Always check transaction details in your wallet popup</li>
                  <li>• If any site asks for your seed phrase - it is a scam</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2></div>
          <div className="grid gap-4">
            <FaqCard q="Is this safe? Do you have access to my wallet?" a="No, we never have access to your wallet. We are 100% non-custodial. Transactions are built in your browser, and you sign them in your wallet popup. We never see your private keys or seed phrase." />
            <FaqCard q="What is the difference between Instant and Advanced mode?" a="Instant mode: We cover transaction fees, you pay 20% of recovered SOL. Advanced mode: You pay transaction fees directly but get a lower flat fee per account. Most users prefer Instant for simplicity." />
            <FaqCard q="What accounts do you close?" a="We only close zero-balance SPL Token and Token-2022 accounts where you have valid close authority. We skip frozen, malformed, or accounts with any remaining balance." />
            <FaqCard q="Will this affect my tokens?" a="No. We only touch accounts with exactly zero balance. Any account holding tokens - even dust amounts - is completely ignored and will not appear in the list." />
            <FaqCard q="Which wallets are supported?" a="Phantom, Solflare, and Backpack are fully supported. Any wallet that supports standard Solana wallet adapter should work." />
            <FaqCard q="What if a transaction fails?" a="If a transaction fails, you do not pay any fee for that batch. Only successful closes are charged. Failed accounts can be retried." />
          </div>
        </div>
      </section>

      {/* 2026 Destiny Section */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm mb-6">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            NEW: 2026 Destiny Reveal
          </div>
          <h3 className="text-2xl md:text-3xl font-bold">🔮 What Does Your Wallet Say About 2026?</h3>
          <p className="mt-3 text-white/60 max-w-xl mx-auto">Your wallet address holds secrets about your crypto destiny. Discover your archetype, lucky token, power month, and hidden SOL.</p>
          <a href="/destiny" className="mt-6 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:opacity-90 transition inline-flex items-center gap-2 text-lg">
            🔮 Reveal My 2026 Destiny
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </a>
          <p className="mt-4 text-white/40 text-sm">✨ "My wallet told me my 2026 destiny AND gave me free SOL"</p>
        </div>
      </section>


      <section className="py-20 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-2xl md:text-3xl font-bold">Ready to Recover Your SOL?</h3>
          <p className="mt-3 text-white/60">Free to scan. Takes 30 seconds. See exactly what you will recover before signing.</p>
          <a href={CONFIG.appUrl} className="mt-6 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-semibold hover:opacity-90 transition inline-flex items-center gap-2 text-lg">
            Launch App
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </a>
        </div>
      </section>


      {/* Security Tip Section */}
      <section className="py-12 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 grid place-content-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <div>
                <h4 className="font-semibold text-white">🔒 Security Tip</h4>
                <p className="text-sm text-white/60">Consider a hardware wallet for long-term SOL storage</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 grid place-content-center text-sm">🧹</div>
              <span className="font-bold">RentReclaim</span>
            </div>
            <div className="text-sm text-white/40">Built for Solana degens 💚</div>
            <div className="text-sm text-white/40">© {new Date().getFullYear()} RentReclaim</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StepCard({ number, title, description }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-emerald-500/30 transition">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 grid place-content-center text-black font-bold mb-4">{number}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-white/60 text-sm mt-2 leading-relaxed">{description}</p>
    </div>
  );
}

function FaqCard({ q, a }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h4 className="font-semibold">{q}</h4>
      <p className="text-white/60 text-sm mt-2 leading-relaxed">{a}</p>
    </div>
  );
}
