// ============================================================================
// UTILITY FUNCTIONS FOR ANALYSIS COMPONENTS
// ============================================================================

export function formatNumber(num: number, decimals = 2): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(decimals)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(decimals)}k`
  return num.toFixed(decimals)
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  })
}

export function getSeverityColor(level: string): { bg: string; text: string; border: string } {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    LOW: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    MEDIUM: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    HIGH: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
    CRITICAL: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  }
  return colors[level.toUpperCase()] || colors.MEDIUM
}

export function getRiskLevelFromScore(score: number): string {
  if (score < 25) return 'LOW'
  if (score < 50) return 'MEDIUM'
  if (score < 75) return 'HIGH'
  return 'CRITICAL'
}

export const STROKE_COLORS: Record<string, string> = {
  LOW: '#22d3ee',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444'
}

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
