import { describe, expect, it } from 'vitest'
import { lineTaxAmount, lineTaxPct, taxTypeLabel } from './document-taxes'

describe('document-taxes', () => {
  describe('taxTypeLabel', () => {
    it('detecta productos exentos', () => {
      expect(taxTypeLabel('ISV_EXENTO')).toBe('Exento')
      expect(taxTypeLabel('EXENTO')).toBe('Exento')
    })

    it('detecta tasa 18%', () => {
      expect(taxTypeLabel('ISV_18')).toBe('ISV 18%')
      expect(taxTypeLabel(undefined, 18)).toBe('ISV 18%')
    })

    it('detecta tasa 15%', () => {
      expect(taxTypeLabel('ISV_15')).toBe('ISV 15%')
      expect(taxTypeLabel(undefined, 15)).toBe('ISV 15%')
    })

    it('maneja grupo vacío o sin definir', () => {
      expect(taxTypeLabel()).toBe('—')
    })
  })

  describe('lineTaxPct', () => {
    it('devuelve el valor explícito de VAT _ si existe', () => {
      expect(lineTaxPct({ 'VAT _': 15 })).toBe(15)
      expect(lineTaxPct({ 'VAT _': '18' })).toBe(18)
    })

    it('infiere porcentaje del grupo si VAT _ es 0 o no viene', () => {
      expect(lineTaxPct({ 'VAT Prod_ Posting Group': 'ISV_15' })).toBe(15)
      expect(lineTaxPct({ 'VAT Prod_ Posting Group': 'ISV_18' })).toBe(18)
      expect(lineTaxPct({ 'VAT Prod_ Posting Group': 'EXENTO' })).toBe(0)
    })
  })

  describe('lineTaxAmount', () => {
    it('devuelve VAT_Amount almacenado si es mayor a cero', () => {
      expect(lineTaxAmount({ VAT_Amount: 45.5 })).toBe(45.5)
    })

    it('calcula el impuesto desgolsado a partir del monto total con ISV 15%', () => {
      // 115 con 15% de ISV -> base 100, impuesto 15.00
      expect(
        lineTaxAmount({
          'Amount Including VAT': 115,
          'VAT Prod_ Posting Group': 'ISV_15',
        }),
      ).toBe(15)
    })

    it('devuelve 0 si la línea es exenta o total es 0', () => {
      expect(
        lineTaxAmount({
          'Amount Including VAT': 100,
          'VAT Prod_ Posting Group': 'EXENTO',
        }),
      ).toBe(0)
      expect(lineTaxAmount({ 'Amount Including VAT': 0 })).toBe(0)
    })
  })
})
