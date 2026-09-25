import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCheckout } from './useCheckout'
import { api } from '../api/client'
import type { LoginResponse } from '../api/types'

const mockSession: LoginResponse = {
  token: 'mock-token',
  user: { id: 1, name: 'Cajero Prueba', username: 'cajero1', profile: 'cajero', isActive: true },
  storeConfig: {
    storeId: 'EST01',
    posNumber: 'POS01',
    name: 'Estación Central',
    storeName: 'Estación Central',
    address: 'Tegucigalpa',
    address1: 'Blvd Suyapa',
    rtn: '08011999123456',
    phone: '2234-5678',
    email: 'pos@estacion.com',
    casaMatriz: 'Estación Central',
    moneda: 'HNL',
    noConsumidorFinal: 'CF',
    mostrarBombas: true,
    columns: 48,
    printerConfig: { columns: 48, printerPath: 'COM1' },
    shiftConfig: { canOpenManual: true }
  },
  shiftInfo: {
    Shift: '101',
    'Shift Starting': '2026-09-25T08:00:00Z'
  }
}

const mockCart = [
  {
    code: '01',
    description: 'SUPER',
    qty: 10,
    price: 30,
    total: 300,
    tax: 45,
    discount: 0,
    vatGroup: '15'
  }
]

describe('useCheckout - Manejo de error en acumulación Leal', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(api, 'validateCorrelative').mockResolvedValue({ isValid: true } as any)
  })

  it('muestra diálogo interactivo con opciones Reintentar y Facturar sin acumular ante error en Leal', async () => {
    const createInvoiceMock = vi.spyOn(api, 'createInvoice')
      .mockRejectedValueOnce(new Error('Error al acumular puntos en Leal: Timeout en API Leal'))
      .mockResolvedValueOnce({
        invoiceNo: '001-001-01-00000101',
        cai: 'TEST-CAI',
        startingNo: '001-001-01-00000001',
        endingNo: '001-001-01-00000200',
        fechaVence: '2026-12-31'
      } as any)

    const setMessage = vi.fn()
    const onSaleComplete = vi.fn()
    const printTicket = vi.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() =>
      useCheckout({
        store: mockSession.storeConfig,
        session: mockSession,
        effectiveCart: mockCart,
        totals: { total: 300, discount: 0, tax: 45, subtotal: 255 },
        hasShift: true,
        customer: { code: 'CF', name: 'Consumidor Final', rtf: '08011999123456' } as any,
        onCustomerChange: vi.fn(),
        onSaleComplete,
        setMessage,
        printTicket
      })
    )

    act(() => {
      result.current.addPayment({
        code: '1002',
        description: 'EFECTIVO',
        categoria: 'EFECTIVO',
        moneda: 'HNL',
        generaCambio: true,
        facturaContado: true,
        facturaCredito: false,
        salidaCombustible: false,
        fidelizacion: false,
        requiereReferencia: false,
        imagen: null,
        activo: true
      })
    })

    // Primer intento: falla acumulación
    await act(async () => {
      await result.current.checkout()
    })

    expect(createInvoiceMock).toHaveBeenCalledTimes(1)
    expect(createInvoiceMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        permitirFacturarSinAcumular: undefined
      })
    )

    // Modal de alerta con opciones debe estar visible
    expect(result.current.alertModal).not.toBeNull()
    expect(result.current.alertModal?.title).toBe('Error al acumular puntos en Leal')
    expect(result.current.alertModal?.confirmText).toBe('Reintentar')
    expect(result.current.alertModal?.secondaryText).toBe('Facturar sin acumular')
    expect(result.current.alertModal?.cancelText).toBe('Cancelar')

    // Acción Reintentar
    await act(async () => {
      result.current.alertModal?.onConfirm?.()
    })

    expect(createInvoiceMock).toHaveBeenCalledTimes(2)
    expect(onSaleComplete).toHaveBeenCalledWith('001-001-01-00000101', 0)
    expect(result.current.alertModal).toBeNull()
  })

  it('permite facturar sin acumular cuando el usuario presiona la opción secundaria', async () => {
    const createInvoiceMock = vi.spyOn(api, 'createInvoice')
      .mockRejectedValueOnce(new Error('No se pudo confirmar la acumulación en Leal: Sin respuesta'))
      .mockResolvedValueOnce({
        invoiceNo: '001-001-01-00000102',
        cai: 'TEST-CAI',
        startingNo: '001-001-01-00000001',
        endingNo: '001-001-01-00000200',
        fechaVence: '2026-12-31'
      } as any)

    const onSaleComplete = vi.fn()
    const printTicket = vi.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() =>
      useCheckout({
        store: mockSession.storeConfig,
        session: mockSession,
        effectiveCart: mockCart,
        totals: { total: 300, discount: 0, tax: 45, subtotal: 255 },
        hasShift: true,
        customer: { code: 'CF', name: 'Consumidor Final', rtf: '08011999123456' } as any,
        onCustomerChange: vi.fn(),
        onSaleComplete,
        setMessage: vi.fn(),
        printTicket
      })
    )

    act(() => {
      result.current.addPayment({
        code: '1002',
        description: 'EFECTIVO',
        categoria: 'EFECTIVO',
        moneda: 'HNL',
        generaCambio: true,
        facturaContado: true,
        facturaCredito: false,
        salidaCombustible: false,
        fidelizacion: false,
        requiereReferencia: false,
        imagen: null,
        activo: true
      })
    })

    await act(async () => {
      await result.current.checkout()
    })

    expect(result.current.alertModal).not.toBeNull()

    // Usuario elige "Facturar sin acumular"
    await act(async () => {
      result.current.alertModal?.onSecondary?.()
    })

    expect(createInvoiceMock).toHaveBeenCalledTimes(2)
    expect(createInvoiceMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        permitirFacturarSinAcumular: true
      })
    )
    expect(onSaleComplete).toHaveBeenCalledWith('001-001-01-00000102', 0)
    expect(result.current.alertModal).toBeNull()
  })

  it('permite cancelar el diálogo sin emitir factura', async () => {
    vi.spyOn(api, 'createInvoice')
      .mockRejectedValueOnce(new Error('Error al acumular puntos en Leal: Red caída'))

    const onSaleComplete = vi.fn()
    const printTicket = vi.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() =>
      useCheckout({
        store: mockSession.storeConfig,
        session: mockSession,
        effectiveCart: mockCart,
        totals: { total: 300, discount: 0, tax: 45, subtotal: 255 },
        hasShift: true,
        customer: { code: 'CF', name: 'Consumidor Final', rtf: '08011999123456' } as any,
        onCustomerChange: vi.fn(),
        onSaleComplete,
        setMessage: vi.fn(),
        printTicket
      })
    )

    act(() => {
      result.current.addPayment({
        code: '1002',
        description: 'EFECTIVO',
        categoria: 'EFECTIVO',
        moneda: 'HNL',
        generaCambio: true,
        facturaContado: true,
        facturaCredito: false,
        salidaCombustible: false,
        fidelizacion: false,
        requiereReferencia: false,
        imagen: null,
        activo: true
      })
    })

    await act(async () => {
      await result.current.checkout()
    })

    expect(result.current.alertModal).not.toBeNull()

    // Usuario presiona "Cancelar"
    act(() => {
      result.current.alertModal?.onCancel?.()
    })

    expect(result.current.alertModal).toBeNull()
    expect(onSaleComplete).not.toHaveBeenCalled()
  })
})
