import { describe, it, expect } from 'vitest'
import { setServerTimezone, getServerTimezone, fmtServerDate, localDateServer, fmtServerDateFull } from './server-tz'

describe('server-tz', () => {
  it('setServerTimezone y getServerTimezone', () => {
    setServerTimezone('America/Tegucigalpa')
    expect(getServerTimezone()).toBe('America/Tegucigalpa')
    setServerTimezone()
    expect(getServerTimezone()).toBeTruthy()
  })

  it('fmtServerDate formatea en la zona del servidor', () => {
    setServerTimezone('UTC')
    expect(fmtServerDate('2026-08-15T12:30:00Z')).toMatch(/^15\/08\/2026 \d{2}:30$/)
    expect(fmtServerDate(undefined)).toBe('')
  })

  it('localDateServer devuelve aaaa-mm-dd', () => {
    setServerTimezone('UTC')
    expect(localDateServer('2026-08-15T10:00:00Z')).toBe('2026-08-15')
    expect(localDateServer('')).toBe('')
  })

  it('fmtServerDateFull usa nombre corto de mes', () => {
    setServerTimezone('UTC')
    const out = fmtServerDateFull('2026-08-15T10:00:00Z')
    expect(out).toContain('ago')
    expect(out).toContain('2026')
  })
})