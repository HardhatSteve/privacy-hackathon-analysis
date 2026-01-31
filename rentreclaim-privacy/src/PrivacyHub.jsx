import React, { useState } from "react";

const tracks = [
  { track: "Private Payments", prize: "$15,000", focus: "Confidential transfers on Solana" },
  { track: "Privacy Tooling", prize: "$15,000", focus: "Tools for developers to build with privacy" },
  { track: "Open Track", prize: "$18,000", focus: "Privacy applications (Light Protocol)" },
];

const sponsors = [
  { name: "Radr Labs", prize: "$15,000", url: "/radr", demo: true },
  { name: "Arcium", prize: "$10,000", url: "/arcium", demo: true },
  { name: "Inco", prize: "$6,000", url: "/inco", demo: true },
  { name: "Privacy Cash", prize: "$6,000", url: "/privacycash", demo: true },
  { name: "Helius", prize: "$5,000", url: "https://helius.dev/", demo: false },
  { name: "Range", prize: "$1,500", url: "/send", demo: true, note: "In Private Send" },
  { name: "Encrypt.trade", prize: "$1,000", url: "/learn", demo: false },
];

const submissions = [
  { emoji: "🔒", title: "Private Send", blurb: "Private Payments + Range", href: "/send", bg: "bg-purple-500/10 border-purple-500/30" },
  { emoji: "🪄", title: "Stealth Launch", blurb: "Private Launchpads", href: "/launch", bg: "bg-emerald-500/10 border-emerald-500/30" },
  { emoji: "🧹", title: "RentReclaim", blurb: "Open Track", href: "/app", bg: "bg-blue-500/10 border-blue-500/30" },
];

const bountyDemos = [
  { emoji: "⚡", title: "Radr ShadowPay", href: "/radr", color: "text-purple-400" },
  { emoji: "🔒", title: "Arcium MPC", href: "/arcium", color: "text-orange-400" },
  { emoji: "🔮", title: "Inco FHE", href: "/inco", color: "text-cyan-400" },
  { emoji: "🔐", title: "Privacy Cash", href: "/privacycash", color: "text-emerald-400" },
];

export default function PrivacyHub() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <a href="/" className="text-white/60 hover:text-white">← Back</a>
        <h1 className="text-3xl font-bold mt-6">🔐 Privacy Ecosystem</h1>
        <p className="text-white/70 mt-2">Bounties, demos, and resources for the Solana Privacy Hackathon</p>
        <a href="https://solana.com/privacyhack" target="_blank" rel="noreferrer" className="mt-4 inline-block px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg">Privacy Hack →</a>

        <h2 className="text-xl font-semibold mt-10 mb-4">Our Submissions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {submissions.map(s => (
            <a key={s.title} href={s.href} className={`p-4 rounded-xl border ${s.bg} hover:scale-105 transition`}>
              <div className="text-2xl">{s.emoji}</div>
              <div className="font-semibold mt-2">{s.title}</div>
              <div className="text-white/60 text-sm">{s.blurb}</div>
            </a>
          ))}
        </div>

        <h2 className="text-xl font-semibold mt-10 mb-4">Sponsor Bounty Demos</h2>
        <div className="grid md:grid-cols-4 gap-3">
          {bountyDemos.map(d => (
            <a key={d.title} href={d.href} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
              <div className={`text-xl ${d.color}`}>{d.emoji}</div>
              <div className="font-medium mt-1">{d.title}</div>
            </a>
          ))}
        </div>

        <h2 className="text-xl font-semibold mt-10 mb-4">Main Tracks</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-white/60"><th className="py-2">Track</th><th className="py-2">Prize</th><th className="py-2">Focus</th></tr></thead>
            <tbody>
              {tracks.map(t => <tr key={t.track} className="border-t border-white/10"><td className="py-2">{t.track}</td><td className="py-2 text-emerald-400">{t.prize}</td><td className="py-2 text-white/70">{t.focus}</td></tr>)}
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-semibold mt-10 mb-4">All Sponsor Bounties</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {sponsors.map(s => (
            <a key={s.name} href={s.url} target={s.url.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
              <div className="flex justify-between items-center">
                <span className="font-semibold">{s.name}</span>
                <span className="text-emerald-400 text-sm">{s.prize}</span>
              </div>
              {s.demo && <div className="text-xs text-purple-400 mt-1">✅ Demo Ready {s.note && `(${s.note})`}</div>}
            </a>
          ))}
        </div>

        <h2 className="text-xl font-semibold mt-10 mb-4">Submission Requirements</h2>
        <ul className="list-disc ml-5 text-white/80 space-y-1">
          <li>Open source code mandatory</li>
          <li>Deploy to Solana devnet or mainnet</li>
          <li>Include demo video (max 3 minutes)</li>
          <li>Provide documentation</li>
        </ul>

        <p className="mt-10 text-center text-white/40 text-sm">No analytics. No tracking. Just privacy.</p>
      </div>
    </div>
  );
}
