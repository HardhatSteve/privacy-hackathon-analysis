"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
// Certifique-se de importar o componente que criamos no passo anterior
import HyperLogo from "src/components/ui/hyper-text";

export default function IntroOverlay({ onComplete }: { onComplete: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Chamado quando a animação da Logo termina
  const handleLogoComplete = () => {
    setShowLoading(true);
    
    // Tempo da barra de loading encher (1.5s) + pequena margem
    setTimeout(() => {
      onComplete();
    }, 1800);
  };

  // Fundo neutro durante a hidratação
  if (!mounted) return <div className="fixed inset-0 z-[99999] bg-white dark:bg-[#030014]" />;

  return (
    <motion.div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white dark:bg-[#030014] overflow-hidden"
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
    >
      <div className="relative flex flex-col items-center justify-center w-full">
        <AnimatePresence mode="wait">
          
          {!showLoading ? (
            /* FASE 1: A LOGO (Runas -> Logo -> Espelho) */
            <motion.div
              key="logo-phase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ 
                opacity: 0, 
                scale: 0.9, 
                filter: "blur(10px)",
                transition: { duration: 0.5 } 
              }}
              className="flex items-center justify-center"
            >
              <HyperLogo 
                duration={3000} // Tempo total das runas até fixar a logo
                logoWidth={180} 
                logoHeight={60}
                onComplete={handleLogoComplete} // Avisa quando pode ir pro loading
              />
            </motion.div>
          ) : (
            /* FASE 2: BARRA DE LOADING */
            <motion.div 
              key="loading-phase"
              initial={{ width: "0px", opacity: 0 }}
              animate={{ width: "240px", opacity: 1 }}
              transition={{ duration: 0.5, ease: "backOut" }}
              className="h-[3px] bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden relative"
            >
              <motion.div 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="h-full bg-black dark:bg-white rounded-full"
              />
            </motion.div>
          )}
          
        </AnimatePresence>
      </div>
    </motion.div>
  );
}