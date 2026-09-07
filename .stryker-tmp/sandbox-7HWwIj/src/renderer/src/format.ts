// @ts-nocheck
export function formatRtn(rtn: string): string {
  const digits = rtn.replace(/\D/g, '')
  if (!digits) return rtn
  let out = digits.slice(0, 4)
  if (digits.length > 4) out += '-' + digits.slice(4, 8)
  if (digits.length > 8) out += '-' + digits.slice(8)
  return out
}