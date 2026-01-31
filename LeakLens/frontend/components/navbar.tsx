'use client'

import Link from 'next/link'
import { Globe, Github, ExternalLink, ScanSearch } from 'lucide-react'

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Title */}
          <Link href="/" className="flex items-center gap-2">
            <ScanSearch className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg tracking-tight text-foreground">
              LeakLens
            </span>
          </Link>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mainnet Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-medium text-cyan-400 uppercase tracking-wide">Mainnet</span>
            </div>

            {/* Source Button */}
            <a
              href="https://github.com/MatthewSullivn/LeakLens"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/60 hover:bg-muted/80 transition-colors"
            >
              <Github className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Source</span>
            </a>

            {/* Encrypt Trade CTA */}
            <a
              href="https://encrypt.trade"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/40 hover:bg-violet-500/30 transition-colors"
            >
              <span className="text-xs font-medium text-violet-400 uppercase tracking-wide">encrypt.trade</span>
              <ExternalLink className="w-3 h-3 text-violet-400" />
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
