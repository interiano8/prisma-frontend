/**
 * Máscaras y validaciones fiscales según normativa SAR (Honduras).
 */

/**
 * Formatea un correlativo SAR en grupos 000-000-00-00000000 (16 dígitos).
 */
export function formatRangoMask(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 16)
  const groups = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 16)].filter(Boolean)
  return groups.join('-')
}

/**
 * Formatea un CAI (Código de Autorización de Impresión) de 32 caracteres alfanuméricos
 * en bloques XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX-XX.
 */
export function formatCaiMask(v: string): string {
  const a = v.replace(/[^0-9A-Za-z]/g, '').toUpperCase().slice(0, 32)
  const groups = [
    a.slice(0, 6),
    a.slice(6, 12),
    a.slice(12, 18),
    a.slice(18, 24),
    a.slice(24, 30),
    a.slice(30, 32),
  ].filter(Boolean)
  return groups.join('-')
}
