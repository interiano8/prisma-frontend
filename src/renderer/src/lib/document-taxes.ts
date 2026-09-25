/**
 * Utilidades de cálculo y etiquetas de impuestos (ISV / Exento) para documentos de venta.
 */

export function taxTypeLabel(group?: string, pct?: number): string {
  const g = (group || '').toUpperCase()
  if (g.includes('EXENTO')) return 'Exento'
  if (g.includes('18') || pct === 18) return 'ISV 18%'
  if (g.includes('15') || pct === 15) return 'ISV 15%'
  if (pct && pct > 0) return `ISV ${pct}%`
  if (!g) return '—'
  return g.replace(/_/g, ' ')
}

export interface TaxLineInput {
  'VAT _'?: number | string
  'VAT Prod_ Posting Group'?: string
  VAT_Amount?: number | string
  'Amount Including VAT'?: number | string
  [key: string]: unknown
}

export function lineTaxPct(l: TaxLineInput): number {
  const stored = Number(l['VAT _']) || 0
  if (stored > 0) return stored
  const g = String(l['VAT Prod_ Posting Group'] || '').toUpperCase()
  if (g.includes('18')) return 18
  if (g.includes('15')) return 15
  return 0
}

export function lineTaxAmount(l: TaxLineInput): number {
  const stored = Number(l.VAT_Amount) || 0
  if (stored > 0) return stored
  const pct = lineTaxPct(l)
  if (pct <= 0) return 0
  const total = Number(l['Amount Including VAT']) || 0
  if (total <= 0) return 0
  return Math.round((total - total / (1 + pct / 100)) * 100) / 100
}
