"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  BeakerIcon,
  ChartBarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import InteractiveGlobe from "components/sub/InteractiveGlobe"; 

// --- INTERFACES ---
interface ResearchProject {
    id: number | string;
    title: string;
    participants: { grads: number; masters: number; phds: number };
    progress: number;
    status: string;
    details: {
        rank: string;
        agents: string[]; // Apenas decorativo
    };
}

// --- DADOS MOCKADOS (Baseado na sua API e Regras) ---
const SEED_TITLES = [
    "In situ Biosynthesis of Bacterial Cellulose/Graphene Oxide Composites",
    "Mycelium-Based Memristor Arrays: Low-Cost Neuromorphic Computing",
    "Engineered PETase for Rapid Depolymerization of Post-Consumer PET",
    "Artificial Photosynthesis for Flue-Gas CO₂ Capture and In-Situ Conversion",
    "High-Resolution Electronic Skin (E-Skin) Sensor Arrays",
    "Synthetic DNA Archival Data Storage with Error Correction",
    "Bioluminescent Bio-Modules for Urban Accent Lighting",
    "Chitin/Chitosan-Based Membranes for Microplastic Removal",
    "Neuro-Scribe: Brain-Computer Interfaces for Text Generation",
    "Quantum-Oracle: Predictive Models for Climate Change",
    "Helix-Weaver: Automated Protein Folding Simulations"
];

// --- STYLES ---
// Card da direita (Ledger)
const panelRight = "fixed right-6 top-6 bottom-6 z-20 w-full max-w-[420px] rounded-3xl overflow-hidden transition-all duration-500 backdrop-blur-xl bg-black/40 border border-white/10 shadow-[-10px_0_40px_rgba(0,0,0,0.5)] flex flex-col";

// --- MAIN COMPONENT ---
const ResearchLedgerComponent = () => {
  // --- STATES ---
  const [researchData, setResearchData] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ResearchProject | null>(null);

  // --- CARREGAR DADOS ---
  useEffect(() => {
    // Simula API e aplica a regra de participantes
    const loadData = () => {
        setLoading(true);
        setTimeout(() => {
            const projects = SEED_TITLES.map((title, i) => {
                // REGRA DE PARTICIPANTES:
                // Apenas os 3 primeiros têm PhD (1). O resto tem 0.
                // O resto tem média de 3-4 Graduandos e 1 Mestrando.
                const hasPhD = i < 3;
                
                const phds = hasPhD ? 1 : 0;
                const masters = hasPhD ? 2 : 1; // Quem tem PhD geralmente tem mais mestrandos, ou fixo em 1
                const grads = hasPhD ? 2 : Math.floor(Math.random() * 2) + 3; // 3 ou 4

                // Rank baseado na complexidade (PhD = SS ou S)
                let rank = "B";
                if (hasPhD) rank = i === 0 ? "SS" : "S";
                else if (i < 6) rank = "A";

                return {
                    id: 1000 + i,
                    title: title,
                    participants: { grads, masters, phds },
                    progress: Math.floor(Math.random() * 80) + 10,
                    status: "active",
                    details: {
                        rank,
                        agents: ["Node-" + i]
                    }
                };
            });
            setResearchData(projects);
            setLoading(false);
        }, 1000); // 1s de loading fake
    };
    loadData();
  }, []);

  // --- KEYBOARD (ESC fecha globo) ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Escape") setSelectedProject(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Calcula complexidade para o globo (densidade de partículas)
  const getComplexity = (project: ResearchProject) => {
      let base = 10;
      if (project.details.rank === "SS") base = 60;
      else if (project.details.rank === "S") base = 45;
      else if (project.details.rank === "A") base = 30;
      return base + (project.participants.phds * 20) + (project.participants.masters * 10);
  };

  return (
    <div className="w-full min-h-screen relative overflow-hidden font-[family-name:var(--font-outfit)]">
      
      {/* --- GLOBO INTERATIVO (OVERLAY CENTRO) --- */}
      <AnimatePresence>
        {selectedProject && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50"
            >
                <InteractiveGlobe 
                    projectTitle={selectedProject.title}
                    complexityScore={getComplexity(selectedProject)}
                    onClose={() => setSelectedProject(null)}
                />
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- TEXTO DE INTRODUÇÃO (SE NADA SELECIONADO) --- */}
      {!selectedProject && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
              <div className="text-center opacity-30">
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white mb-4">
                      AXTRAL<span className="text-cyan-500">.RESEARCH</span>
                  </h1>
                  <p className="text-sm md:text-base font-mono uppercase tracking-widest text-cyan-200/50">
                      Select a protocol to analyze node data
                  </p>
              </div>
          </div>
      )}

      {/* --- CARD LATERAL DIREITO (LEDGER) --- */}
      <motion.aside 
        initial={{ x: "100%", opacity: 0 }} 
        animate={{ x: 0, opacity: 1 }} 
        transition={{ duration: 1.0, ease: "easeOut" }}
        className={panelRight}
      >
        {/* Header Fixo */}
        <div className="p-6 border-b border-white/10 bg-black/60 backdrop-blur-xl sticky top-0 z-10">
            <div className="flex items-center justify-between mb-1">
                <h3 className="text-white font-bold tracking-wide flex items-center gap-2 text-lg">
                    <BeakerIcon className="h-5 w-5 text-cyan-400" />
                    Protocol Ledger
                </h3>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
                    <span className="text-[10px] text-white/40 font-mono tracking-wider">LIVE FEED</span>
                </div>
            </div>
            <div className="text-[11px] text-white/40 leading-relaxed">
                Active research nodes synchronized with Axtral Core API.
            </div>
            <div className="mt-4 h-0.5 w-full bg-gradient-to-r from-cyan-500/50 via-blue-500/30 to-transparent rounded-full" />
        </div>

        {/* Lista Scrollável */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar scroll-smooth">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
                    <div className="text-[10px] text-white/30 uppercase tracking-widest animate-pulse">
                        Decrypting Ledger...
                    </div>
                </div>
            ) : (
                researchData.map((project) => {
                    const isSelected = selectedProject?.id === project.id;
                    const isSS = project.details.rank === "SS";
                    
                    return (
                        <div 
                            key={project.id}
                            onClick={() => setSelectedProject(project)}
                            className={`
                                relative p-4 rounded-2xl border cursor-pointer transition-all duration-300 group
                                flex flex-col gap-3
                                ${isSelected 
                                    ? "bg-cyan-900/20 border-cyan-500/50 shadow-[0_0_30px_rgba(34,211,238,0.15)] scale-[1.02]" 
                                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 hover:translate-x-[-4px]"}
                            `}
                        >
                            {/* Header do Card */}
                            <div className="flex justify-between items-start">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                                    isSS ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/10 shadow-[0_0_10px_rgba(250,204,21,0.2)]" :
                                    project.details.rank === "S" ? "text-purple-400 border-purple-400/30 bg-purple-400/10" :
                                    "text-cyan-400 border-cyan-400/30 bg-cyan-400/10"
                                }`}>
                                    {isSS && <SparklesIcon className="w-3 h-3" />}
                                    RANK {project.details.rank}
                                </span>
                                <span className="text-[10px] text-white/20 font-mono tracking-widest">
                                    ID::{project.id}
                                </span>
                            </div>

                            {/* Título */}
                            <h4 className="text-sm font-semibold text-white/90 leading-snug group-hover:text-cyan-200 transition-colors">
                                {project.title}
                            </h4>
                            
                            {/* Participantes (Regra Aplicada) */}
                            <div className="flex items-center gap-4 text-[11px] text-white/50 bg-black/30 p-2 rounded-lg border border-white/5">
                                {/* PhDs */}
                                <div className={`flex items-center gap-1.5 ${project.participants.phds > 0 ? "text-yellow-200/80" : "opacity-40"}`}>
                                    <AcademicCapIcon className="w-4 h-4" />
                                    <span className="font-mono">{project.participants.phds} PhD</span>
                                </div>
                                {/* Masters */}
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-white/40" />
                                    <span className="font-mono">{project.participants.masters} MsC</span>
                                </div>
                                {/* Grads */}
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-white/40" />
                                    <span className="font-mono">{project.participants.grads} Grad</span>
                                </div>
                            </div>

                            {/* Barra de Progresso */}
                            <div className="flex items-center justify-between mt-1">
                                <div className="w-full mr-3 h-1 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${project.progress}%` }}
                                        transition={{ duration: 1, delay: 0.2 }}
                                        className={`h-full ${isSS ? "bg-gradient-to-r from-yellow-500 to-amber-300" : "bg-cyan-500"}`} 
                                    />
                                </div>
                                <span className="text-[10px] font-mono text-cyan-400">{project.progress}%</span>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </motion.aside>

    </div>
  );
};

export default dynamic(() => Promise.resolve(ResearchLedgerComponent), { ssr: false });