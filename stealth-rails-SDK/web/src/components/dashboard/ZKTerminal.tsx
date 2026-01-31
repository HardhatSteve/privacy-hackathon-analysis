import { useEffect, useState, useRef } from 'react';
import { Terminal, ShieldCheck, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LOG_MESSAGES = [
    "Initializing ZK-SNARK Prover...",
    "Loading Merkle Tree Root [0x7f...3a]",
    "Connecting to Light Protocol RPC...",
    "Fetching Compressed Accounts...",
    "Verifying UTXO Ownership...",
    "Encrypting Payment Metadata...",
    "Generating Groth16 Proof (Phase 1)...",
    "Generating Groth16 Proof (Phase 2)...",
    "Proof Generated Successfully [23ms]",
    "Bundling Transaction...",
    "Broadcasting to Solana Mainnet...",
    "Confirmed in Slot 23821932...",
];

export function ZKTerminal({ active }: { active: boolean }) {
    const [logs, setLogs] = useState<string[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!active) return;

        let index = 0;
        setLogs(["System Ready."]);

        const interval = setInterval(() => {
            if (index < LOG_MESSAGES.length) {
                setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${LOG_MESSAGES[index]}`]);
                index++;
                bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            } else {
                clearInterval(interval);
            }
        }, 800); // Add a new log every 800ms

        return () => clearInterval(interval);
    }, [active]);

    return (
        <div className="w-full bg-[#0A0A0A] border border-stealth-border rounded-xl font-mono text-xs p-4 h-[200px] overflow-hidden relative group">
            <div className="absolute top-2 right-2 flex gap-2">
                <div className="flex items-center gap-1 bg-stealth-800/50 px-2 py-1 rounded text-[10px] text-stone-500 border border-white/5">
                    <Terminal className="w-3 h-3" />
                    <span>SECURE_ENCLAVE_V2</span>
                </div>
            </div>

            <div className="space-y-1 h-full overflow-y-auto pb-4 scrollbar-none">
                <div className="text-stone-600 mb-2">
                    // Light Protocol Privacy Runtime<br />
                    // Copyright (c) 2026 StealthRails Inc.
                </div>
                {logs.map((log, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-green-500/80"
                    >
                        <span className="text-stealth-primary mr-2">➜</span>
                        {log}
                    </motion.div>
                ))}
                {!active && logs.length === 0 && (
                    <div className="text-stone-700 italic mt-4 opacity-50">
                        Waiting for transaction signature...
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none bg-scanline opacity-10"></div>
        </div>
    );
}
