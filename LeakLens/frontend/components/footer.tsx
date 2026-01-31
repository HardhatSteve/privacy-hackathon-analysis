import { memo } from 'react'
import { ScanSearch } from 'lucide-react'

export const Footer = memo(function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <ScanSearch className="w-8 h-8 text-cyan-500" />
            <span className="font-bold">LeakLens.</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {/* <span>v2.0.0-BETA</span>
            <Link href="#security" className="hover:text-foreground transition-colors uppercase tracking-wider text-xs">
              Security.md
            </Link>
            <Link href="#privacy" className="hover:text-foreground transition-colors uppercase tracking-wider text-xs">
              Privacy_Policy
            </Link>
            <Link href="#status" className="hover:text-foreground transition-colors uppercase tracking-wider text-xs">
              Node_Status
            </Link> */}
          </div>

          {/* Copyright */}
          <div className="text-sm text-muted-foreground">
            ©2026 LeakLens Analytics.
          </div>
        </div>
      </div>
    </footer>
  )
})

Footer.displayName = 'Footer'
