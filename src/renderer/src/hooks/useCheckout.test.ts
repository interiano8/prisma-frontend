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
    vi.spyOn(api, 'searchCustomers').mockResolvedValue([])
    vi.spyOn(api, 'tasaCambioLatest').mockResolvedValue({ tasa: 1 } as any)
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

  describe('Validación estricta de crédito en checkout', () => {
    const mockCreditoCustomer = {
      code: 'CL001',
      name: 'Empresa Credito S.A.',
      rtf: '08011999888888',
      billingType: 0,
      creditLimit: 1000,
      balance: 800,
      blockOnOverdue: true,
      hasOverdueInvoices: false
    }

    const creditoMethod = {
      code: 'CREDITO',
      description: 'Crédito',
      categoria: 'CREDITO',
      moneda: 'HNL',
      generaCambio: false,
      facturaContado: false,
      facturaCredito: true,
      salidaCombustible: false,
      fidelizacion: false,
      requiereReferencia: false,
      imagen: null,
      activo: true
    }

    it('rechaza la factura al crédito si el monto excede el disponible', async () => {
      const setMessage = vi.fn()
      const createInvoiceMock = vi.spyOn(api, 'createInvoice')

      const { result } = renderHook(() =>
        useCheckout({
          store: mockSession.storeConfig,
          session: mockSession,
          effectiveCart: mockCart,
          totals: { total: 300, discount: 0, tax: 45, subtotal: 255 },
          hasShift: true,
          customer: mockCreditoCustomer as any,
          onCustomerChange: vi.fn(),
          onSaleComplete: vi.fn(),
          setMessage,
          printTicket: vi.fn().mockResolvedValue(undefined)
        })
      )

      act(() => {
        result.current.openCustomerMode('credito')
        result.current.selectCustomer(mockCreditoCustomer as any)
        result.current.setOrden('OC-123')
        result.current.setKmValue('5000')
        result.current.setChofer('Juan Perez')
      })

      act(() => {
        result.current.addPayment(creditoMethod)
      })

      await act(async () => {
        await result.current.checkout()
      })

      expect(setMessage).toHaveBeenCalledWith(
        expect.stringContaining('Crédito insuficiente')
      )
      expect(createInvoiceMock).not.toHaveBeenCalled()
    })

    it('rechaza la factura al crédito si el cliente está en mora', async () => {
      const setMessage = vi.fn()
      const createInvoiceMock = vi.spyOn(api, 'createInvoice')

      const clienteEnMora = { ...mockCreditoCustomer, creditLimit: 5000, hasOverdueInvoices: true }

      const { result } = renderHook(() =>
        useCheckout({
          store: mockSession.storeConfig,
          session: mockSession,
          effectiveCart: mockCart,
          totals: { total: 300, discount: 0, tax: 45, subtotal: 255 },
          hasShift: true,
          customer: clienteEnMora as any,
          onCustomerChange: vi.fn(),
          onSaleComplete: vi.fn(),
          setMessage,
          printTicket: vi.fn().mockResolvedValue(undefined)
        })
      )

      act(() => {
        result.current.openCustomerMode('credito')
        result.current.selectCustomer(clienteEnMora as any)
        result.current.setOrden('OC-123')
        result.current.setKmValue('5000')
        result.current.setChofer('Juan Perez')
      })

      act(() => {
        result.current.addPayment(creditoMethod)
      })

      await act(async () => {
        await result.current.checkout()
      })

      expect(setMessage).toHaveBeenCalledWith(
        expect.stringContaining('Cliente en mora')
      )
      expect(createInvoiceMock).not.toHaveBeenCalled()
    })

    it('impide agregar pagos no crédito cuando se factura al crédito', async () => {
      const setMessage = vi.fn()

      const { result } = renderHook(() =>
        useCheckout({
          store: mockSession.storeConfig,
          session: mockSession,
          effectiveCart: mockCart,
          totals: { total: 300, discount: 0, tax: 45, subtotal: 255 },
          hasShift: true,
          customer: mockCreditoCustomer as any,
          onCustomerChange: vi.fn(),
          onSaleComplete: vi.fn(),
          setMessage,
          printTicket: vi.fn().mockResolvedValue(undefined)
        })
      )

      act(() => {
        result.current.openCustomerMode('credito')
        result.current.selectCustomer(mockCreditoCustomer as any)
      })

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

      expect(setMessage).toHaveBeenCalledWith(
        'En ventas al crédito solo se permite la forma de pago Crédito.'
      )
      expect(result.current.payments).toHaveLength(0)
    })

    it('requiere PIN de supervisor y lo valida contra api.validateAdmin en contingencia offline', async () => {
      const setMessage = vi.fn()
      const createInvoiceMock = vi.spyOn(api, 'createInvoice').mockResolvedValue({
        invoiceNo: '001-001-01-00000102',
        cai: 'TEST-CAI',
        startingNo: '001-001-01-00000001',
        endingNo: '001-001-01-00000200',
        fechaVence: '2026-12-31'
      } as any)
      const validateAdminMock = vi.spyOn(api, 'validateAdmin').mockResolvedValue({ valid: true })
      // Forzamos fallback offline simulando error en checkCustomerCredit
      vi.spyOn(api, 'checkCustomerCredit').mockRejectedValue(new Error('Network error'))

      const clienteConCredito = { ...mockCreditoCustomer, creditLimit: 5000, balance: 100 }

      const { result } = renderHook(() =>
        useCheckout({
          store: mockSession.storeConfig,
          session: mockSession,
          effectiveCart: mockCart,
          totals: { total: 300, discount: 0, tax: 45, subtotal: 255 },
          hasShift: true,
          customer: clienteConCredito as any,
          onCustomerChange: vi.fn(),
          onSaleComplete: vi.fn(),
          setMessage,
          printTicket: vi.fn().mockResolvedValue(undefined)
        })
      )

      act(() => {
        result.current.openCustomerMode('credito')
        result.current.selectCustomer(clienteConCredito as any)
        result.current.setOrden('OC-123')
        result.current.setKmValue('5000')
        result.current.setChofer('Juan Perez')
      })

      act(() => {
        result.current.addPayment(creditoMethod)
      })

      // Intento sin PIN
      await act(async () => {
        await result.current.checkout()
      })

      expect(setMessage).toHaveBeenCalledWith(
        'Ingrese el PIN de supervisor para autorizar crédito offline.'
      )
      expect(createInvoiceMock).not.toHaveBeenCalled()

      // Intento con PIN inválido
      validateAdminMock.mockResolvedValueOnce({ valid: false })
      act(() => {
        result.current.setSupervisorPin('0000')
      })

      await act(async () => {
        await result.current.checkout()
      })

      expect(setMessage).toHaveBeenCalledWith(
        'PIN o contraseña de supervisor inválida.'
      )
      expect(createInvoiceMock).not.toHaveBeenCalled()

      // Intento con PIN válido
      validateAdminMock.mockResolvedValueOnce({ valid: true })
      act(() => {
        result.current.setSupervisorPin('1234')
      })

      await act(async () => {
        await result.current.checkout()
      })

      expect(validateAdminMock).toHaveBeenCalledWith(mockSession.storeConfig.storeId, '1234')
      expect(createInvoiceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          isCredit: true,
          creditValidationSource: 'OFFLINE_FALLBACK'
        })
      )
    })
  })
})
