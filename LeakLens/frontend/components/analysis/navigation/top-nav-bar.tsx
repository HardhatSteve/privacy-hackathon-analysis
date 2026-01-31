'use client'

import { memo, useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Copy, Download, Wallet, CheckCircle, 
  Menu, Search, FileJson, FileText, Table, ScanSearch
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatAddress, cn } from '@/lib/utils'
import { getSeverityColor } from '../utils'
import { exportJSON, exportCSV, exportPDF } from '@/lib/export'
import { MobileBottomSheet } from './mobile-menu'
import type { AnalysisResult } from '../types'

// ============================================================================
// TYPES
// ============================================================================

interface TopNavBarProps {
  wallet: string
  copied: boolean
  onCopy: () => void
  confidence: string
  riskLevel?: string
  data?: AnalysisResult | null
}

interface ExportMenuItemProps {
  icon: React.ReactNode
  label: string
  status: 'available' | 'coming-soon'
  onClick?: () => void
}

// ============================================================================
// EXPORT MENU ITEM
// ============================================================================

const ExportMenuItem = memo(function ExportMenuItem({ icon, label, status, onClick }: ExportMenuItemProps) {
  return (
    <button
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left",
        status === 'coming-soon' ? "text-muted-foreground cursor-not-allowed" : "hover:bg-muted/50"
      )}
      onClick={status === 'available' ? onClick : undefined}
      disabled={status === 'coming-soon'}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {status === 'coming-soon' && (
        <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded">Soon</span>
      )}
    </button>
  )
})

// ============================================================================
// TOP NAVIGATION BAR
// ============================================================================

export const TopNavBar = memo(function TopNavBar({ 
  wallet, 
  copied, 
  onCopy, 
  confidence,
  riskLevel = 'MEDIUM',
  data = null
}: TopNavBarProps) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)

  const handleAnalyzeDifferent = useCallback(() => {
    router.push('/')
  }, [router])

  const closeExport = useCallback(() => setExportMenuOpen(false), [])

  const handleExportPDF = useCallback(() => {
    if (data) {
      exportPDF(data, wallet)
      closeExport()
    }
  }, [data, wallet, closeExport])

  const handleExportJSON = useCallback(() => {
    if (data) {
      exportJSON(data, wallet)
      closeExport()
    }
  }, [data, wallet, closeExport])

  const handleExportCSV = useCallback(() => {
    if (data) {
      exportCSV(data, wallet)
      closeExport()
    }
  }, [data, wallet, closeExport])

  const riskColors = getSeverityColor(riskLevel)
  const canExport = !!data

  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const check = () => setScrolled(typeof window !== 'undefined' ? window.scrollY > 100 : false)
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [])

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 w-full">
        {/* Desktop: centered pill (same style as home/learn) */}
        <div className="hidden md:flex justify-center px-4 sm:px-6 lg:px-8">
          <nav
            className="relative z-[60] mx-auto flex w-full max-w-7xl flex-row items-center justify-between self-start rounded-full border border-border/40 bg-background/95 px-4 sm:px-6 lg:px-8 py-2 h-14 transition-[transform,backdrop-filter,width,min-width] duration-300 ease-out"
            style={{
              width: scrolled ? '70%' : '100%',
              minWidth: '800px',
              transform: `translateY(${scrolled ? 20 : 0}px)`,
              backdropFilter: scrolled ? 'blur(10px)' : 'blur(0px)',
            }}
            aria-label="Main"
          >
            <Link href="/" className="relative z-10 flex items-center gap-2 px-2 py-1 shrink-0">
              <ScanSearch className="w-5 h-5 text-cyan-500" />
              <span className="font-bold text-lg tracking-tight text-foreground">LeakLens</span>
            </Link>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
              <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                Home
              </Link>
              <span className="px-3 py-2 rounded-md text-sm font-medium text-foreground cursor-default" aria-current="page">
                Analysis
              </span>
              <Link href="/learn" className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                Learn
              </Link>
            </div>
            <div className="relative z-10 flex items-center gap-3">
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                {exportMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setExportMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50 py-1">
                      <ExportMenuItem icon={<FileText className="w-4 h-4" />} label="PDF Report" status={canExport ? 'available' : 'coming-soon'} onClick={handleExportPDF} />
                      <ExportMenuItem icon={<FileJson className="w-4 h-4" />} label="JSON Data" status={canExport ? 'available' : 'coming-soon'} onClick={handleExportJSON} />
                      <ExportMenuItem icon={<Table className="w-4 h-4" />} label="CSV Export" status={canExport ? 'available' : 'coming-soon'} onClick={handleExportCSV} />
                    </div>
                  </>
                )}
              </div>
              <Button size="sm" className="gap-2 bg-primary text-primary-foreground" onClick={handleAnalyzeDifferent}>
                <Search className="w-4 h-4" />
                Analyze Different Wallet
              </Button>
            </div>
          </nav>
        </div>

        {/* Mobile: full-width bar */}
        <div className="flex md:hidden items-center justify-between h-14 border-b border-border/40 bg-background/95 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <ScanSearch className="w-5 h-5 text-cyan-500" />
            <span className="font-bold text-lg tracking-tight text-foreground">LeakLens</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-card border border-border/60">
              <span className="font-mono text-xs">{formatAddress(wallet)}</span>
              <button onClick={onCopy} className="text-muted-foreground">
                {copied ? <CheckCircle className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <Badge className={cn("text-[10px] px-1.5", riskColors.bg, riskColors.text)}>
              {riskLevel}
            </Badge>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Sheet */}
      <MobileBottomSheet 
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        wallet={wallet}
        onAnalyzeDifferent={handleAnalyzeDifferent}
        onExportPDF={handleExportPDF}
        onExportJSON={handleExportJSON}
        onExportCSV={handleExportCSV}
      />
    </>
  )
})
