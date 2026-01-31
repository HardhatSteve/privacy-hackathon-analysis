"use client";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { motion, AnimatePresence } from "framer-motion";
import { 
    BanknotesIcon, 
    ArrowPathIcon, 
    GlobeAmericasIcon // Ícone novo para o botão
} from "@heroicons/react/24/outline"; 
import { ZAEON_CONFIG, ABIS } from "src/config/contracts";

// IMPORTANTE: Importando o globo da mesma pasta
import InteractiveGlobe from "components/sub/InteractiveGlobe"; 

const NEWS_DATA = [
    {
        id: "static-1",
        date: "JAN 2026",
        category: "System Update",
        title: "Protocol Initialization",
        description: "Zaeon Protocol contracts deployed on Cronos chain.",
        location: "Global",
        icon: <ArrowPathIcon className="w-4 h-4" />, 
        isLive: false 
    },
    {
        id: "static-2",
        date: "DEC 2025",
        category: "Governance",
        title: "Treasury Module V1",
        description: "Implementation of algorithmic governance rules.",
        location: "On-Chain",
        icon: <BanknotesIcon className="w-4 h-4" />,
        isLive: false
    }
];

export default function NewsModule() {
    const [liveEvents, setLiveEvents] = useState<any[]>([]);
    
    // NOVO ESTADO: Controla a visibilidade do Globo
    const [showGlobe, setShowGlobe] = useState(false);

    useEffect(() => {
        // Setup a Read-Only Provider
        // Fallback simples caso a config esteja vazia para evitar crash no front sem env
        const rpcUrl = ZAEON_CONFIG?.RPC_URL || "https://evm.cronos.org"; 
        
        // Verificação de segurança antes de instanciar contrato
        if (!ZAEON_CONFIG?.ADDRESSES?.TREASURY) return;

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const treasury = new ethers.Contract(ZAEON_CONFIG.ADDRESSES.TREASURY, ABIS.TREASURY, provider);

        const fetchEvents = async () => {
            try {
                const events = await treasury.queryFilter("FundsAllocated"); 
                const formattedEvents = events.reverse().map((e: any, i) => ({
                    id: `live-${i}`,
                    date: "LIVE NOW",
                    category: "Autonomous Funding",
                    title: `Treasury Allocation: Token #${e.args[1]}`,
                    description: `Agent ${e.args[0].slice(0,6)}... received ${ethers.formatEther(e.args[2])} CRO via Algorithmic Governance.`,
                    location: "On-Chain (Cronos)",
                    icon: <BanknotesIcon className="w-4 h-4" />,
                    isLive: true
                }));
                setLiveEvents(formattedEvents);
            } catch(err) { console.log("Error fetching treasury events", err); }
        };

        fetchEvents();

        const listener = (agent: string, tokenId: bigint, amount: bigint) => {
             const newEvent = {
                id: `live-new-${Date.now()}`,
                date: "JUST NOW",
                category: "Autonomous Funding",
                title: `Treasury Allocation: Token #${tokenId}`,
                description: `Agent ${agent.slice(0,6)}... received ${ethers.formatEther(amount)} CRO.`,
                location: "On-Chain (Cronos)",
                icon: <BanknotesIcon className="w-4 h-4" />,
                isLive: true
             };
             setLiveEvents(prev => [newEvent, ...prev]);
        };
        
        try {
            treasury.on("FundsAllocated", listener);
        } catch (e) { console.log("Listener error", e)}

        return () => { 
            try { treasury.off("FundsAllocated", listener); } catch(e){} 
        };
    }, []);

    const combinedData = [...liveEvents, ...NEWS_DATA];

    return (
        <div className="w-full pb-20 relative">
             
             {/* --- COMPONENTE DO GLOBO (Renderizado Condicionalmente) --- */}
             <AnimatePresence>
                {showGlobe && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999]" // Z-index alto para cobrir tudo
                    >
                        <InteractiveGlobe 
                            projectTitle="ZAEON NETWORK [GLOBAL]"
                            complexityScore={85} // Valor alto para o globo ficar bem denso e bonito
                            onClose={() => setShowGlobe(false)}
                        />
                    </motion.div>
                )}
             </AnimatePresence>

             {/* Header */}
            <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#0f172a] dark:text-white/80 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                    Protocol Feed
                </h3>

                {/* --- BOTÃO NOVO AQUI --- */}
                <button 
                    onClick={() => setShowGlobe(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider hover:bg-cyan-500/20 hover:scale-105 transition-all"
                >
                    <GlobeAmericasIcon className="w-4 h-4" />
                    Network View
                </button>
            </div>

            <div className="space-y-4">
                {combinedData.map((item, index) => (
                    <motion.div
                        key={item.id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`group relative p-6 rounded-3xl border transition-all cursor-pointer hover:shadow-lg 
                            ${item.isLive 
                                ? 'bg-green-500/10 border-green-500/30' 
                                : 'bg-white/40 dark:bg-white/[0.03] border-black/5 dark:border-white/5'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-3">
                             <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${item.isLive ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                    {item.date}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                    {item.icon} {item.category}
                                </span>
                            </div>
                        </div>
                        <h4 className="text-sm font-bold dark:text-white mb-2">{item.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}