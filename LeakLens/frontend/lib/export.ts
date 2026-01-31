import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AnalysisResult } from '@/components/analysis/types'

const walletShort = (w: string) => w.slice(0, 8)
const dateStr = () => new Date().toISOString().slice(0, 10)
const filename = (wallet: string, ext: string) =>
  `leaklens-${walletShort(wallet)}-${dateStr()}.${ext}`

/** Sanitize strings for jsPDF: replace Unicode that causes "&" between characters. */
function sanitizeForPdf(s: string): string {
  if (!s || typeof s !== 'string') return ''
  return s
    .replace(/\u2248/g, '~=')       // ≈
    .replace(/\u2014|\u2013|\u2212/g, '-')  // — – −
    .replace(/\u2026/g, '...')      // …
    .replace(/\u2022/g, '- ')       // •
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')  // smart quotes
    .replace(/\u2010|\u2011/g, '-') // hyphen variants
}

function downloadBlob(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

export function exportJSON(data: AnalysisResult, wallet: string) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  downloadBlob(blob, filename(wallet, 'json'))
}

export function exportCSV(data: AnalysisResult, wallet: string) {
  const rows: string[][] = []
  const esc = (v: unknown) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }

  const se = data.surveillance_exposure
  const op = data.opsec_failures ?? {}

  rows.push(['metric', 'value'])
  rows.push(['wallet', wallet])
  rows.push(['chain', data.chain ?? ''])
  rows.push(['total_transactions', String(data.total_transactions ?? '')])
  rows.push(['confidence', data.confidence ?? ''])
  rows.push(['risk_level', se?.risk_level ?? ''])
  rows.push(['surveillance_score', String(se?.surveillance_score ?? '')])
  rows.push(['weakest_link', (op.weakest_link ?? '').slice(0, 200)])
  rows.push(['critical_leaks_count', String((op.critical_leaks ?? []).length)])
  rows.push(['funding_sources_count', String((op.funding_sources ?? []).length)])
  rows.push(['withdrawal_targets_count', String((op.withdrawal_targets ?? []).length)])

  rows.push([])
  rows.push(['# Funding Sources (full wallet addresses)'])
  rows.push(['wallet_address', 'count', 'total_sol'])
  for (const s of op.funding_sources ?? []) {
    rows.push([s.wallet ?? '', String(s.count ?? 0), String(s.total_sol ?? 0)])
  }

  rows.push([])
  rows.push(['# Withdrawal Targets (full wallet addresses)'])
  rows.push(['wallet_address', 'count', 'total_sol'])
  for (const s of op.withdrawal_targets ?? []) {
    rows.push([s.wallet ?? '', String(s.count ?? 0), String(s.total_sol ?? 0)])
  }

  rows.push([])
  rows.push(['# Critical Leaks'])
  rows.push(['type', 'detail'])
  for (const c of op.critical_leaks ?? []) {
    rows.push([c.type ?? '', (c.detail ?? '').slice(0, 150)])
  }

  const csv = rows.map((r) => r.map(esc).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, filename(wallet, 'csv'))
}

export function exportPDF(data: AnalysisResult, wallet: string) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' })
  const t = (s: string) => sanitizeForPdf(s)
  const se = data.surveillance_exposure
  const op = data.opsec_failures ?? {}
  let y = 14

  doc.setFontSize(18)
  doc.text('LeakLens Report', 14, y)
  y += 10
  doc.setFontSize(10)
  doc.text(`Wallet: ${t(wallet)}`, 14, y)
  y += 6
  doc.text(`Generated: ${t(new Date().toLocaleString())}`, 14, y)
  y += 6
  doc.text(`Chain: ${t(data.chain ?? 'solana')} | Transactions: ${data.total_transactions ?? 0}`, 14, y)
  y += 10

  const weak = op.weakest_link ?? '-'
  const metrics = [
    ['Risk Level', t(se?.risk_level ?? '-')],
    ['Surveillance Score', t(String(se?.surveillance_score ?? '-'))],
    ['Confidence', t(data.confidence ?? '-')],
    ['Weakest Link', t(weak)],
  ]
  const tableOpts = {
    startY: y,
    head: [['Metric', 'Value']].map((row) => [t(row[0]), t(row[1])]),
    body: metrics.map((row) => [t(row[0]), t(row[1])]),
    theme: 'plain' as const,
    margin: { left: 14 },
    tableWidth: 180,
    styles: { overflow: 'linebreak' as const },
    columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 138 } },
    bodyStyles: { valign: 'top' as const },
  }
  autoTable(doc, tableOpts)
  y = (doc as any).lastAutoTable.finalY + 8

  const leaks = (op.critical_leaks ?? []).slice(0, 5)
  if (leaks.length) {
    doc.setFontSize(12)
    doc.text('Critical Leaks', 14, y)
    y += 6
    const leakRows = leaks.map((c) => [t(c.type ?? ''), t(c.detail ?? '')])
    autoTable(doc, {
      startY: y,
      head: [['Type', 'Detail']].map((row) => [t(row[0]), t(row[1])]),
      body: leakRows,
      theme: 'plain',
      margin: { left: 14 },
      tableWidth: 180,
      styles: { overflow: 'linebreak' },
      columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 138 } },
      bodyStyles: { valign: 'top' },
    })
    y = (doc as any).lastAutoTable.finalY + 6
  }

  const vectors = (se?.top_leak_vectors ?? []).slice(0, 6)
  if (vectors.length) {
    doc.setFontSize(12)
    doc.text('Top Leak Vectors', 14, y)
    y += 6
    doc.setFontSize(10)
    vectors.forEach((v) => {
      if (y > 270) return
      doc.text('- ' + t(v || '-'), 16, y)
      y += 5
    })
    y += 4
  }

  doc.setFontSize(8)
  doc.text('LeakLens - See what your wallet leaks. Built for Solana Privacy Hackathon.', 14, 290)
  doc.text('This analysis uses heuristic inference based on publicly available on-chain data.', 14, 294)

  doc.save(filename(wallet, 'pdf'))
}
