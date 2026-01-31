"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- CONFIGURAÇÕES VISUAIS ---
const GLOBE_RADIUS_RATIO = 0.35;
const COLORS = ["#22d3ee", "#0ea5e9", "#3b82f6", "#60a5fa", "#a5f3fc"];

interface InteractiveGlobeProps {
  projectTitle: string;
  complexityScore: number; // Define a densidade do globo
  onClose: () => void;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  theta: number;
  phi: number;
  originalTheta: number; // Para voltar ao lugar
  originalPhi: number;
}

export default function InteractiveGlobe({ projectTitle, complexityScore, onClose }: InteractiveGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dataRevealed, setDataRevealed] = useState(false);
  const [stats, setStats] = useState({ reqs: 0, fixes: 0 });

  // Calcula estatísticas baseadas no título (pseudo-aleatório determinístico)
  useEffect(() => {
    const seed = projectTitle.length;
    setStats({
      reqs: seed * 142 + Math.floor(Math.random() * 500),
      fixes: Math.floor(seed * 4.5),
    });
  }, [projectTitle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // A densidade de partículas depende da complexidade do projeto
    // Projetos complexos (SS tier) tem mais partículas
    const particleCount = 1500 + (complexityScore * 20); 
    
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    let particles: Particle[] = [];
    let animationId: number;
    let time = 0;

    // Ajuste de DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Inicializa Esfera Fibonacci
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < particleCount; i++) {
      const y = 1 - (i / (particleCount - 1)) * 2;
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;
      
      particles.push({
        x: 0, y: 0,
        size: Math.random() * 1.5 + 0.5,
        color: COLORS[i % COLORS.length],
        theta: theta,
        phi: Math.acos(y),
        originalTheta: theta,
        originalPhi: Math.acos(y),
      });
    }

    const draw = () => {
      // Rastro suave
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fillRect(0, 0, width, height);

      time += 0.005;
      const centerX = width / 2;
      const centerY = height / 2;
      
      // O raio pulsa levemente se dados foram revelados
      const pulse = dataRevealed ? Math.sin(time * 5) * 20 : 0;
      const globeRadius = Math.min(width, height) * GLOBE_RADIUS_RATIO + pulse;

      particles.forEach((p) => {
        // Rotação
        const rotationSpeed = dataRevealed ? time * 0.5 : time * 2; // Desacelera ao clicar
        
        // Se revelado, as partículas "explodem" levemente para fora
        const expansion = dataRevealed ? (Math.random() * 50) : 0;
        
        const sphereX = (globeRadius + expansion) * Math.sin(p.phi) * Math.cos(p.theta + rotationSpeed);
        const sphereZ = (globeRadius + expansion) * Math.sin(p.phi) * Math.sin(p.theta + rotationSpeed);
        const sphereY = (globeRadius + expansion) * Math.cos(p.phi);

        const perspective = 350 / (350 - sphereZ);
        const scale = Math.max(0.1, perspective);
        const alpha = scale > 1 ? 1 : 0.2;

        p.x = centerX + sphereX;
        p.y = centerY + sphereY;

        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.arc(p.x, p.y, p.size * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Linhas de conexão (Data Strands) se revelado
        if (dataRevealed && Math.random() > 0.98) {
             ctx.beginPath();
             ctx.strokeStyle = p.color;
             ctx.lineWidth = 0.5;
             ctx.globalAlpha = 0.3;
             ctx.moveTo(centerX, centerY);
             ctx.lineTo(p.x, p.y);
             ctx.stroke();
             ctx.globalAlpha = 1;
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [complexityScore, dataRevealed]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
        
      {/* Canvas Interativo */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full cursor-pointer"
        onClick={() => setDataRevealed(!dataRevealed)}
      />

      {/* Overlay de Dados (Aparece ao clicar) */}
      <AnimatePresence>
        {dataRevealed && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative z-50 pointer-events-none text-center bg-black/60 border border-cyan-500/30 p-6 rounded-2xl backdrop-blur-xl shadow-[0_0_50px_rgba(34,211,238,0.2)]"
          >
            <h2 className="text-cyan-400 text-xs font-bold tracking-[0.2em] uppercase mb-2">Data Decrypted</h2>
            <div className="text-4xl font-mono text-white font-bold mb-1">
               {stats.reqs.toLocaleString()} <span className="text-sm text-gray-400">Reqs</span>
            </div>
            <div className="text-xl font-mono text-red-400 font-bold">
               {stats.fixes.toLocaleString()} <span className="text-sm text-gray-400">Corrections</span>
            </div>
            <div className="mt-4 text-[10px] text-white/50 max-w-[300px]">
                {projectTitle}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão Fechar */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 z-50 text-white/50 hover:text-white transition-colors"
      >
        CLOSE [X]
      </button>

      {!dataRevealed && (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute bottom-10 text-white/30 text-xs tracking-widest pointer-events-none"
        >
            TAP THE SPHERE TO ANALYZE DATA
        </motion.div>
      )}
    </div>
  );
}