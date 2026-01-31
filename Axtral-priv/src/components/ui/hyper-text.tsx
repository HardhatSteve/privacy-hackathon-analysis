"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const RUNES = "ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ";

interface HyperLogoProps {
  logoSrc?: string;
  lightLogoSrc?: string;
  duration?: number;
  className?: string;
  logoWidth?: number;
  logoHeight?: number;
  onComplete?: () => void;
}

export default function HyperLogo({
  logoSrc = "/axtral-logo.png",
  lightLogoSrc = "/axtral-light.png",
  duration = 2000,
  className,
  logoWidth = 160,
  logoHeight = 50,
  onComplete,
}: HyperLogoProps) {
  const [runesActive, setRunesActive] = useState(true);
  const [cypherText, setCypherText] = useState("");
  
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Loop das Runas
    const interval = setInterval(() => {
      let result = "";
      for (let i = 0; i < 6; i++) {
        result += RUNES[Math.floor(Math.random() * RUNES.length)];
      }
      setCypherText(result);
    }, 60);

    // Para as runas e avisa que acabou
    const stopRunesTimeout = setTimeout(() => {
      setRunesActive(false);
      clearInterval(interval);
      if (onComplete) setTimeout(onComplete, 2000); 
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(stopRunesTimeout);
    };
  }, [duration, onComplete]);

  const currentLogo = mounted && resolvedTheme === "light" ? lightLogoSrc : logoSrc;

  return (
    // REMOVI min-h. O container tem o tamanho exato da logo para o centro ser exato.
    <div 
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: logoWidth, height: logoHeight }}
    >
      {/* CAMADA 1: LOGO + REFLEXO */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
      >
        {/* A Logo em si */}
        <Image
          src={currentLogo}
          alt="Axtral Logo"
          width={logoWidth}
          height={logoHeight}
          className="object-contain"
          priority
        />
        
        {/* O Reflexo (Posicionado Absolute para não empurrar o centro para cima) */}
        <div 
          className="absolute top-full left-0 w-full opacity-40 mix-blend-overlay"
          style={{
            height: logoHeight,
            transform: "scaleY(-1)",
            marginTop: "-2px", 
            maskImage: "linear-gradient(to top, transparent 10%, black 90%)",
            WebkitMaskImage: "linear-gradient(to top, transparent 10%, black 90%)",
            pointerEvents: "none"
          }}
        >
          <Image
            src={currentLogo}
            alt="Reflection"
            width={logoWidth}
            height={logoHeight}
            className="object-contain blur-[1px]"
            priority
          />
        </div>
      </motion.div>

      {/* CAMADA 2: RUNAS (Sobrepostas) */}
      <AnimatePresence>
        {runesActive && (
          <motion.div
            key="runes"
            // Absolute inset-0 garante que fique exatamente EM CIMA da logo, no centro
            className="absolute inset-0 flex items-center justify-center z-20"
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0, 
              scale: 1.2, 
              filter: "blur(12px)", 
              transition: { duration: 0.3 } 
            }}
          >
            {/* Fundo leve para leitura */}
            <span className="text-2xl font-mono tracking-[0.3em] text-foreground/90 whitespace-nowrap drop-shadow-lg bg-background/5 backdrop-blur-[2px] px-2 rounded">
              {cypherText}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}