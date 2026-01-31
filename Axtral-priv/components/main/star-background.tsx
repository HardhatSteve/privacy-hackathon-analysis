"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

// --- CONFIGURAÇÕES VISUAIS ---
const PARTICLE_COUNT = 2200; 
const GLOBE_RADIUS_RATIO = 0.35; 
const LOGO_SCALE_RATIO = 0.35;   
const LOGO_STROKE_WIDTH = 80;    

// Configuração da Serpente
const SNAKE_THICKNESS = 60; // Raio da espessura (120px de diâmetro total)
const SNAKE_SPEED = 0.01;   // Velocidade de movimento

// Paleta Cyan/Blue (Cybercore)
const COLORS = [
  "#22d3ee", // Cyan Neon
  "#0ea5e9", // Sky Blue
  "#3b82f6", // Royal Blue
  "#60a5fa", // Light Blue
  "#a5f3fc", // Almost White Cyan
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  theta: number;
  phi: number;
  logoTargetX?: number;
  logoTargetY?: number;
}

const ParticleGlobeLogo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    
    let particles: Particle[] = [];
    let animationId: number;
    let time = 0;

    // Fases: 0=Globo, 1=Serpente, 2=Logo, 3=Explosão
    let phase = 0; 
    let phaseTimer = 0;

    const applyDPR = () => {
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // --- GEOMETRIA DO LOGO (Mantida Intacta) ---
    const calculateLogoTargets = (w: number, h: number) => {
      const cx = w * 0.75; 
      const cy = h * 0.55; 
      const size = Math.min(w, h) * LOGO_SCALE_RATIO;
      
      const heightTri = size * 2; 
      const side = heightTri / (Math.sqrt(3)/2);
      const halfSide = side / 2;

      const topX = cx; const topY = cy - size; 
      const botY = cy + size; 
      const botLeftX = cx - halfSide; const botRightX = cx + halfSide; 

      const innerSize = size * 0.60;
      const innerHeight = innerSize;
      const innerHalfWidth = innerHeight / (Math.sqrt(3)/2) / 2;

      const innerPeakX = cx; const innerPeakY = botY - innerHeight; 
      const innerBaseLeftX = cx - innerHalfWidth;
      const innerBaseRightX = cx + innerHalfWidth;

      let pIndex = 0;

      const addThickLine = (x1: number, y1: number, x2: number, y2: number, thickness: number, count: number) => {
        const dx = x2 - x1; const dy = y2 - y1;
        const length = Math.sqrt(dx*dx + dy*dy);
        const ux = dx / length; const uy = dy / length;
        const px = -uy; const py = ux;  
        for (let i = 0; i < count; i++) {
          if (pIndex >= particles.length) break;
          const t = Math.random(); 
          const w = (Math.random() - 0.5) * thickness;
          particles[pIndex].logoTargetX = x1 + (ux * length * t) + (px * w);
          particles[pIndex].logoTargetY = y1 + (uy * length * t) + (py * w);
          pIndex++;
        }
      };

      const fillTriangle = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, count: number) => {
        for (let i = 0; i < count; i++) {
          if (pIndex >= particles.length) break;
          let r1 = Math.random(); let r2 = Math.random();
          if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
          particles[pIndex].logoTargetX = x1 + r1 * (x2 - x1) + r2 * (x3 - x1);
          particles[pIndex].logoTargetY = y1 + r1 * (y2 - y1) + r2 * (y3 - y1);
          pIndex++;
        }
      };

      const totalParticles = particles.length;
      const legPart = Math.floor(totalParticles * 0.25);
      const longBasePart = Math.floor(totalParticles * 0.20);
      const innerPart = Math.floor(totalParticles * 0.20);
      const foundationPart = Math.floor(totalParticles * 0.10);

      addThickLine(botLeftX, botY, topX, topY, LOGO_STROKE_WIDTH, legPart);
      addThickLine(topX, topY, botRightX, botY, LOGO_STROKE_WIDTH, legPart);
      addThickLine(botRightX, botY, innerBaseLeftX, botY, LOGO_STROKE_WIDTH, longBasePart);
      fillTriangle(innerBaseLeftX, botY, innerBaseRightX, botY, innerPeakX, innerPeakY, innerPart);
      addThickLine(innerBaseLeftX, botY, innerBaseRightX, botY, LOGO_STROKE_WIDTH * 0.8, foundationPart);

      while (pIndex < particles.length) {
        const r = Math.random();
        if (r < 0.6) {
            const t = Math.random();
            particles[pIndex].logoTargetX = innerBaseLeftX + t * (botRightX - innerBaseLeftX);
            particles[pIndex].logoTargetY = botY + (Math.random()-0.5) * (LOGO_STROKE_WIDTH * 0.5);
        } else {
            particles[pIndex].logoTargetX = innerPeakX + (Math.random()-0.5) * LOGO_STROKE_WIDTH;
            particles[pIndex].logoTargetY = innerPeakY + (Math.random()-0.5) * LOGO_STROKE_WIDTH;
        }
        pIndex++;
      }
    };

    const initParticles = () => {
      particles = [];
      const phi = Math.PI * (3 - Math.sqrt(5)); 

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const y_pos = 1 - (i / (PARTICLE_COUNT - 1)) * 2; 
        const radius = Math.sqrt(1 - y_pos * y_pos); 
        const theta = phi * i; 
        const x = Math.random() * width;
        const y = Math.random() * height;

        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 1,
          color: COLORS[i % COLORS.length],
          theta: theta, 
          phi: Math.acos(y_pos), 
        });
      }
      calculateLogoTargets(width, height);
    };

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)"; 
      ctx.fillRect(0, 0, width, height);

      phaseTimer++;

      // Fases: Globo(5s) -> Serpente(6s) -> Logo(6s) -> Explosão(2s)
      if (phase === 0 && phaseTimer > 300) { phase = 1; phaseTimer = 0; }
      else if (phase === 1 && phaseTimer > 360) { phase = 2; phaseTimer = 0; }
      else if (phase === 2 && phaseTimer > 360) { phase = 3; phaseTimer = 0; }
      else if (phase === 3 && phaseTimer > 120) { phase = 0; phaseTimer = 0; }

      time += SNAKE_SPEED; 
      const centerX = width * 0.75; 
      const centerY = height * 0.5; 
      const globeRadius = Math.min(width, height) * GLOBE_RADIUS_RATIO;

      particles.forEach((p, i) => {
        let targetX = p.x;
        let targetY = p.y;
        let scale = 1; 

        // FASE 0: GLOBO 3D
        if (phase === 0) {
          const rotationSpeed = time * 2;
          const sphereX = globeRadius * Math.sin(p.phi) * Math.cos(p.theta + rotationSpeed);
          const sphereZ = globeRadius * Math.sin(p.phi) * Math.sin(p.theta + rotationSpeed);
          const sphereY = globeRadius * Math.cos(p.phi);
          const perspective = 300 / (300 - sphereZ); 
          scale = Math.max(0.1, perspective); 
          targetX = centerX + sphereX;
          targetY = centerY + sphereY;
          p.x += (targetX - p.x) * 0.05;
          p.y += (targetY - p.y) * 0.05;
        }

        // FASE 1: SERPENTE GROSSA E ERRANTE
        else if (phase === 1) {
          // Aumentei o lag para a cauda ser mais longa
          const lag = i * 0.002; 
          const t = time * 2 - lag; // Acelerando um pouco o tempo local
          
          // Trajetória Complexa (Wandering)
          // Combinação de senos e cossenos para cobrir a tela inteira
          const wanderX = Math.cos(t) * (width * 0.4) + Math.sin(t * 2.1) * (width * 0.1);
          const wanderY = Math.sin(t * 1.3) * (height * 0.4) + Math.cos(t * 1.7) * (height * 0.1);
          
          // Centro da serpente neste momento
          const snakeCenterX = (width * 0.5) + wanderX;
          const snakeCenterY = (height * 0.5) + wanderY;

          // Espessura (Volume da Serpente)
          // Distribuímos as partículas aleatoriamente em um círculo ao redor do centro
          // Isso cria um tubo sólido ("grosso")
          const r = Math.random() * SNAKE_THICKNESS;
          const theta = Math.random() * Math.PI * 2;
          
          targetX = snakeCenterX + Math.cos(theta) * r;
          targetY = snakeCenterY + Math.sin(theta) * r;

          // Movimento fluido para o alvo
          p.x += (targetX - p.x) * 0.1;
          p.y += (targetY - p.y) * 0.1;
        }

        // FASE 2: LOGO PIRÂMIDE
        else if (phase === 2) {
          if (p.logoTargetX !== undefined && p.logoTargetY !== undefined) {
            const dx = p.logoTargetX - p.x;
            const dy = p.logoTargetY - p.y;
            p.x += dx * 0.08;
            p.y += dy * 0.08;
            if (Math.abs(dx) < 5) { 
              p.x += (Math.random() - 0.5) * 1.5;
              p.y += (Math.random() - 0.5) * 1.5;
            }
          }
        }

        // FASE 3: EXPLOSÃO
        else if (phase === 3) {
           const dx = p.x - centerX;
           const dy = p.y - centerY;
           const angle = Math.atan2(dy, dx);
           p.x += Math.cos(angle) * 15;
           p.y += Math.sin(angle) * 15;
        }

        ctx.beginPath();
        let alpha = 1;
        if (phase === 0) alpha = scale > 1 ? 1 : 0.3; 
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.arc(p.x, p.y, p.size * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1; 
      });

      animationId = requestAnimationFrame(draw);
    };

    applyDPR();
    initParticles();
    draw();

    const onResize = () => { applyDPR(); initParticles(); };
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas);

    return () => { cancelAnimationFrame(animationId); ro.disconnect(); };
  }, [mounted, theme]);

  if (!mounted) return <div className="fixed inset-0 z-0 bg-black" />;

  return (
    <div className="fixed inset-0 z-0 bg-black pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export const StarsCanvas = ParticleGlobeLogo;
export default ParticleGlobeLogo;