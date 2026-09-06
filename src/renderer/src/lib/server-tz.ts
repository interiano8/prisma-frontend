// Zona horaria del servidor (provista por el backend en el login).
// Se usa para formatear las fechas de cierre de turno y transacción
// siempre en la zona del servidor, sin importar la zona del cliente.
let serverTz: string = Intl.DateTimeFormat().resolvedOptions().timeZone

export function setServerTimezone(tz?: string | null): void {
  if (tz) serverTz = tz
}

export function getServerTimezone(): string {
  return serverTz
}

function parts(iso?: string): Intl.DateTimeFormatPart[] | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: serverTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(d)
}

function get(ps: Intl.DateTimeFormatPart[], t: string): string {
  return ps.find((p) => p.type === t)?.value ?? ''
}

/** dd/mm/aaaa hh:mm en la zona del servidor */
export function fmtServerDate(iso?: string): string {
  const ps = parts(iso)
  if (!ps) return iso || ''
  return `${get(ps, 'day')}/${get(ps, 'month')}/${get(ps, 'year')} ${get(ps, 'hour')}:${get(ps, 'minute')}`
}

/** aaaa-mm-dd en la zona del servidor */
export function localDateServer(iso?: string): string {
  const ps = parts(iso)
  if (!ps) return ''
  return `${get(ps, 'year')}-${get(ps, 'month')}-${get(ps, 'day')}`
}

/** fecha y hora larga en la zona del servidor */
export function fmtServerDateFull(iso?: string): string {
  const ps = parts(iso)
  if (!ps) return ''
  const mon = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][Number(get(ps, 'month')) - 1] || get(ps, 'month')
  return `${get(ps, 'day')} ${mon} ${get(ps, 'year')} ${get(ps, 'hour')}:${get(ps, 'minute')}`
}