'use client'

import { memo } from 'react'
import Link from 'next/link'
import { X, Search, ChevronRight, FileText, FileJson, Table, Home, BookOpen, ScanSearch } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface MobileBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  wallet: string
  onAnalyzeDifferent: () => void
  onExportPDF?: () => void
  onExportJSON?: () => void
  onExportCSV?: () => void
}

interface BottomSheetActionProps {
  icon: React.ReactNode
  label: string
  sublabel?: string
  onClick?: () => void
  primary?: boolean
  disabled?: boolean
}

// ============================================================================
// BOTTOM SHEET ACTION
// ============================================================================

const BottomSheetAction = memo(function BottomSheetAction({ 
  icon, 
  label, 
  sublabel,
  onClick, 
  primary,
  disabled 
}: BottomSheetActionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
        primary ? "bg-primary text-primary-foreground" : "bg-muted/30 hover:bg-muted/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {icon}
      <div className="flex-1 text-left">
        <p className="font-medium">{label}</p>
        {sublabel && <p className="text-xs opacity-70">{sublabel}</p>}
      </div>
      <ChevronRight className="w-4 h-4 opacity-50" />
    </button>
  )
})

// ============================================================================
// MOBILE BOTTOM SHEET
// ============================================================================

export const MobileBottomSheet = memo(function MobileBottomSheet({ 
  isOpen, 
  onClose, 
  wallet,
  onAnalyzeDifferent,
  onExportPDF,
  onExportJSON,
  onExportCSV,
}: MobileBottomSheetProps) {
  if (!isOpen) return null

  const runAndClose = (fn?: () => void) => {
    fn?.()
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-50 md:hidden"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl md:hidden animate-in slide-in-from-bottom duration-300">
        <div className="p-4">
          {/* Handle */}
          <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
          
          {/* Wallet Info */}
          <div className="mb-4 p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Analyzing wallet</p>
            <p className="font-mono text-sm break-all">{wallet}</p>
          </div>

          {/* Nav links — Analysis not clickable on analysis page */}
          <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-border/40">
            <Link href="/" onClick={onClose} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <Home className="w-4 h-4" /> Home
            </Link>
            <span className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground cursor-default" aria-current="page">
              <ScanSearch className="w-4 h-4" /> Analysis
            </span>
            <Link href="/learn" onClick={onClose} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <BookOpen className="w-4 h-4" /> Learn
            </Link>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <BottomSheetAction 
              icon={<Search className="w-5 h-5" />}
              label="Analyze Different Wallet"
              onClick={() => {
                onClose()
                onAnalyzeDifferent()
              }}
              primary
            />
            <BottomSheetAction 
              icon={<FileText className="w-5 h-5" />}
              label="Export PDF Report"
              onClick={() => runAndClose(onExportPDF)}
              disabled={!onExportPDF}
            />
            <BottomSheetAction 
              icon={<FileJson className="w-5 h-5" />}
              label="Export JSON Data"
              onClick={() => runAndClose(onExportJSON)}
              disabled={!onExportJSON}
            />
            <BottomSheetAction 
              icon={<Table className="w-5 h-5" />}
              label="Export CSV"
              onClick={() => runAndClose(onExportCSV)}
              disabled={!onExportCSV}
            />
            <BottomSheetAction 
              icon={<X className="w-5 h-5" />}
              label="Close"
              onClick={onClose}
            />
          </div>

          {/* Trust Signal */}
          <p className="text-[10px] text-muted-foreground text-center mt-4">
            Read-only analysis • No wallet connection required
          </p>
        </div>
      </div>
    </>
  )
})
