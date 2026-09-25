import { describe, expect, it } from 'vitest'
import { formatCaiMask, formatRangoMask } from './sar-masks'

describe('sar-masks', () => {
  describe('formatRangoMask', () => {
    it('formatea un número de 16 dígitos en formato SAR', () => {
      const input = '0010010100000001'
      expect(formatRangoMask(input)).toBe('001-001-01-00000001')
    })

    it('ignora caracteres no numéricos y limita a 16 dígitos', () => {
      const input = '001-abc-001.01/000000019999'
      expect(formatRangoMask(input)).toBe('001-001-01-00000001')
    })

    it('maneja strings vacías o parciales', () => {
      expect(formatRangoMask('')).toBe('')
      expect(formatRangoMask('001')).toBe('001')
      expect(formatRangoMask('001001')).toBe('001-001')
      expect(formatRangoMask('00100101')).toBe('001-001-01')
    })
  })

  describe('formatCaiMask', () => {
    it('formatea un CAI válido de 32 caracteres en 6 bloques', () => {
      const raw = '3E9C425890A1BC7812EF5634AB901234'
      expect(formatCaiMask(raw)).toBe('3E9C42-5890A1-BC7812-EF5634-AB9012-34')
    })

    it('convierte a mayúsculas y filtra símbolos especiales', () => {
      const raw = '3e9c42-5890a1--bc7812!ef5634??ab9012##34'
      expect(formatCaiMask(raw)).toBe('3E9C42-5890A1-BC7812-EF5634-AB9012-34')
    })

    it('maneja strings vacías o parciales', () => {
      expect(formatCaiMask('')).toBe('')
      expect(formatCaiMask('3E9C42')).toBe('3E9C42')
      expect(formatCaiMask('3E9C425890A1')).toBe('3E9C42-5890A1')
    })
  })
})
