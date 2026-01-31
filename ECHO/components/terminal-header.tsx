"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const commands = [
  "$ ./echo --init",
  "> ECHO v1.0",
  "> ready_to_analyze.sh_",
];

export function TerminalHeader() {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);

  useEffect(() => {
    if (currentLine >= commands.length) return;

    const command = commands[currentLine];
    
    if (currentChar < command.length) {
      const timer = setTimeout(() => {
        setCurrentChar(currentChar + 1);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setDisplayedLines([...displayedLines, command]);
        setCurrentLine(currentLine + 1);
        setCurrentChar(0);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentChar, currentLine, displayedLines]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="inline-block rounded-lg border-2 border-blue-500/30 bg-black/70 backdrop-blur-md px-8 py-5 shadow-2xl shadow-blue-500/20"
    >
      <div className="font-mono text-base space-y-1">
        {displayedLines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={
              line.startsWith("$")
                ? "text-blue-400"
                : "text-blue-500/70"
            }
          >
            {line}
          </motion.div>
        ))}
        {currentLine < commands.length && (
          <div className="text-blue-400">
            {commands[currentLine].slice(0, currentChar)}
            <span className="animate-pulse">_</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
