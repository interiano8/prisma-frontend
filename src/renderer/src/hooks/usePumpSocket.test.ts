import { describe, expect, it } from 'vitest'
import { buildPumpSocketUrl } from './usePumpSocket'

describe('buildPumpSocketUrl', () => {
  it('convierte ip:puerto a ws://', () => {
    expect(buildPumpSocketUrl('192.168.0.10:5008')).toBe(
      'ws://192.168.0.10:5008/ws/pump-status',
    )
  })

  it('convierte un dominio sin protocolo', () => {
    expect(buildPumpSocketUrl('gasolinera.midominio.com')).toBe(
      'ws://gasolinera.midominio.com/ws/pump-status',
    )
  })

  it('quita http:// si el operador lo escribió', () => {
    expect(buildPumpSocketUrl('http://192.168.0.10:5008')).toBe(
      'ws://192.168.0.10:5008/ws/pump-status',
    )
  })

  it('devuelve vacío si no hay host', () => {
    expect(buildPumpSocketUrl('')).toBe('')
    expect(buildPumpSocketUrl('   ')).toBe('')
  })
})