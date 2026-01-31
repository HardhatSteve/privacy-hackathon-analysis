import React from "react";

export default function Learn() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-4">
          <a href="/" className="text-white/60 hover:text-white">← Back</a>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">🔐 Privacy on Solana</h1>
          <p className="text-xl text-white/60">Understanding wallet privacy in plain English</p>
        </div>

        {/* Why Privacy Matters */}
        <section className="mb-12 bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-2xl font-bold mb-4 text-emerald-400">Why Should You Care About Privacy?</h2>
          <p className="text-white/80 mb-4">
            Imagine if everyone could see your bank account. Every purchase, every paycheck, every transfer - all public. That's how most blockchains work, including Solana.
          </p>
          <p className="text-white/80">
            Your wallet address is like a username that's linked to ALL your financial activity. Once someone knows it's yours, they can see everything you've ever done.
          </p>
        </section>

        {/* Wallet Surveillance */}
        <section className="mb-12 bg-red-500/10 rounded-xl p-6 border border-red-500/20">
          <h2 className="text-2xl font-bold mb-4 text-red-400">⚠️ How Your Wallet Gets Tracked</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">1. Linking Your Identity</h3>
              <p className="text-white/70">
                When you buy crypto on Coinbase, use an NFT as a profile picture, or share your wallet on Twitter - you've connected your real identity to that address forever.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">2. Transaction Timing</h3>
              <p className="text-white/70">
                Send money at 3:47 PM every Tuesday? That pattern is visible. Analysts can link wallets just by matching when transactions happen.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">3. Amount Patterns</h3>
              <p className="text-white/70">
                If you receive 1,234.56 SOL and then send 1,234.56 SOL somewhere else, it's obvious those transactions are connected - even if you used a different wallet.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">4. RPC Surveillance</h3>
              <p className="text-white/70">
                The servers (RPCs) that connect you to Solana can see your IP address and which wallets you're checking. Free public RPCs may log this data.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">5. Blockchain Analysis Companies</h3>
              <p className="text-white/70">
                Companies like Chainalysis use AI to trace funds across thousands of transactions. They sell this data to governments and corporations.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy Techniques - Jargon Free */}
        <section className="mb-12 bg-emerald-500/10 rounded-xl p-6 border border-emerald-500/20">
          <h2 className="text-2xl font-bold mb-4 text-emerald-400">🛡️ How to Protect Yourself</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Split Your Payments</h3>
              <p className="text-white/70">
                Instead of sending 100 SOL in one transaction, send 23, then 41, then 36. Random amounts are harder to trace than round numbers.
              </p>
              <div className="mt-2 text-sm text-emerald-400">✅ RentReclaim's Private Send does this automatically</div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Add Time Delays</h3>
              <p className="text-white/70">
                Don't send transactions back-to-back. Random delays between transfers break timing patterns that analysts look for.
              </p>
              <div className="mt-2 text-sm text-emerald-400">✅ Private Send adds random jitter between splits</div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Use Fresh Wallets</h3>
              <p className="text-white/70">
                When launching a token or doing something you want private, use a brand new wallet that's never been linked to your identity.
              </p>
              <div className="mt-2 text-sm text-emerald-400">✅ Stealth Launch creates burner wallets automatically</div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Create Noise</h3>
              <p className="text-white/70">
                Before important transactions, make random lookups to unrelated accounts. This masks which accounts you actually care about.
              </p>
              <div className="mt-2 text-sm text-emerald-400">✅ All our tools use decoy reads</div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Use Trusted RPCs</h3>
              <p className="text-white/70">
                Free public RPCs might log your activity. Paid services like Helius have privacy policies and don't sell your data.
              </p>
              <div className="mt-2 text-sm text-emerald-400">✅ We use Helius RPC</div>
            </div>
          </div>
        </section>

        {/* Common Terms Explained */}
        <section className="mb-12 bg-white/5 rounded-xl p-6 border border-white/10">
          <h2 className="text-2xl font-bold mb-4 text-purple-400">📚 Privacy Terms Made Simple</h2>
          
          <div className="space-y-4">
            <div className="border-b border-white/10 pb-4">
              <h3 className="font-semibold text-white">RPC (Remote Procedure Call)</h3>
              <p className="text-white/60">The server that connects your wallet to the blockchain. Think of it like a phone operator connecting your call.</p>
            </div>

            <div className="border-b border-white/10 pb-4">
              <h3 className="font-semibold text-white">On-chain</h3>
              <p className="text-white/60">Stored on the blockchain forever. Once it's on-chain, it can never be deleted.</p>
            </div>

            <div className="border-b border-white/10 pb-4">
              <h3 className="font-semibold text-white">Burner Wallet</h3>
              <p className="text-white/60">A temporary wallet you use once and throw away. Like a prepaid phone.</p>
            </div>

            <div className="border-b border-white/10 pb-4">
              <h3 className="font-semibold text-white">Mint Authority</h3>
              <p className="text-white/60">The wallet that can create more of a token. If you burn this, no more tokens can ever be made.</p>
            </div>

            <div className="border-b border-white/10 pb-4">
              <h3 className="font-semibold text-white">Encryption</h3>
              <p className="text-white/60">Scrambling a message so only someone with the password can read it. Like a secret code.</p>
            </div>

            <div className="border-b border-white/10 pb-4">
              <h3 className="font-semibold text-white">Zero-Knowledge Proof (ZK)</h3>
              <p className="text-white/60">Proving something is true without revealing the details. Like proving you're over 21 without showing your birthday.</p>
            </div>

            <div>
              <h3 className="font-semibold text-white">Obfuscation</h3>
              <p className="text-white/60">Making something harder to understand or trace. Not invisible, just harder to follow.</p>
            </div>
          </div>
        </section>

        {/* Honest Limitations */}
        <section className="mb-12 bg-yellow-500/10 rounded-xl p-6 border border-yellow-500/20">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">⚠️ What Privacy Tools Can't Do</h2>
          <p className="text-white/80 mb-4">
            Let's be honest about limitations:
          </p>
          <ul className="space-y-2 text-white/70">
            <li>• <strong>Amounts are still visible</strong> - Everyone can see how much you sent</li>
            <li>• <strong>Addresses are still public</strong> - Both sender and receiver are on-chain</li>
            <li>• <strong>Timing can still be analyzed</strong> - Delays help but aren't perfect</li>
            <li>• <strong>Determined analysts can still trace</strong> - These tools raise the bar, not eliminate tracking</li>
          </ul>
          <p className="text-white/80 mt-4">
            Our tools add <strong>obfuscation</strong> - they make tracking harder, not impossible. For true anonymity, you'd need zero-knowledge proofs or mixing protocols.
          </p>
        </section>

        {/* CTA */}
        <section className="text-center bg-gradient-to-r from-emerald-500/20 to-purple-500/20 rounded-xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold mb-4">Ready to Try Privacy Tools?</h2>
          <p className="text-white/70 mb-6">Start protecting your financial privacy on Solana today.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/send" className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 rounded-lg font-semibold text-black">Try Private Send</a>
            <a href="/launch" className="px-6 py-3 bg-purple-500 hover:bg-purple-400 rounded-lg font-semibold text-black">Try Stealth Launch</a>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center text-white/40 text-sm">
          <p>Built for the Solana Privacy Hackathon 2026</p>
          <p className="mt-2">Educational content for the Encrypt.trade bounty</p>
        </footer>
      </div>
    </div>
  );
}
