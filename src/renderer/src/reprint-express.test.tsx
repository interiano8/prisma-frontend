import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { AppProvider, useApp } from './store'
import type { PrintTicketInput } from './printing'
import type { LoginResponse } from './api/types'

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

const mockTicket: PrintTicketInput = {
  session: mockSession,
  items: [
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
  ],
  payments: [
    {
      code: '1002',
      method: 'EFECTIVO',
      amount: '300.00',
      moneda: 'HNL'
    }
  ],
  total: 300,
  tax: 45,
  discount: 0,
  result: {
    success: true,
    createdAt: '2026-09-25T08:30:00Z',
    invoiceNo: '001-001-01-00000001',
    cai: 'ABC-123',
    startingNo: '001-001-01-00000001',
    endingNo: '001-001-01-00000100',
    fechaVence: '2026-12-31'
  },
  customerName: 'Consumidor Final',
  cambio: 0
}

function TestConsumer() {
  const { lastPrintedTicket, setLastPrintedTicket, reprintLastTicket, toast } = useApp()
  return (
    <div>
      <div data-testid="toast">{toast}</div>
      <div data-testid="has-ticket">{lastPrintedTicket ? 'YES' : 'NO'}</div>
      <button onClick={() => setLastPrintedTicket(mockTicket)}>Guardar Ticket</button>
      <button onClick={() => void reprintLastTicket()}>Reimprimir</button>
    </div>
  )
}

describe('Reimpresión Exprés', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('informa cuando no hay ticket previo disponible para reimprimir', async () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )

    expect(screen.getByTestId('has-ticket').textContent).toBe('NO')
    const btn = screen.getByText('Reimprimir')
    await act(async () => {
      fireEvent.click(btn)
    })

    expect(screen.getByTestId('toast').textContent).toContain('No hay comprobante previo disponible')
    expect(window.api.printTicket).not.toHaveBeenCalled()
  })

  it('reimprime exitosamente el último comprobante guardado con isReprint', async () => {
    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>
    )

    // Guardar comprobante
    await act(async () => {
      fireEvent.click(screen.getByText('Guardar Ticket'))
    })
    expect(screen.getByTestId('has-ticket').textContent).toBe('YES')

    // Reimprimir
    await act(async () => {
      fireEvent.click(screen.getByText('Reimprimir'))
    })

    expect(window.api.printTicket).toHaveBeenCalledTimes(1)
    const callArgs = (window.api.printTicket as any).mock.calls[0]
    expect(callArgs[1]).toBe('COM1')
    const payload = callArgs[2]
    expect(payload.lines.some((l: any) => l.text.includes('*** REIMPRESIÓN ***'))).toBe(true)
    expect(payload.lines.some((l: any) => l.text.includes('001-001-01-00000001'))).toBe(true)
    expect(screen.getByTestId('toast').textContent).toContain('reimpreso con éxito')
  })

  it('useCheckout invoca onTicketPrinted al completar la venta', async () => {
    const { useCheckout } = await import('./hooks/useCheckout')
    const { api } = await import('./api/client')

    vi.spyOn(api, 'validateCorrelative').mockResolvedValue({ isValid: true } as any)
    vi.spyOn(api, 'createInvoice').mockResolvedValue({
      invoiceNo: '001-001-01-00000099',
      cai: 'TEST-CAI',
      startingNo: '001-001-01-00000001',
      endingNo: '001-001-01-00000100',
      fechaVence: '2026-12-31'
    } as any)

    const onTicketPrinted = vi.fn()
    const onSaleComplete = vi.fn()
    const printTicket = vi.fn().mockResolvedValue(undefined)

    const { renderHook } = await import('@testing-library/react')
    const { result } = renderHook(() =>
      useCheckout({
        store: mockSession.storeConfig,
        session: mockSession,
        effectiveCart: mockTicket.items,
        totals: { total: 300, discount: 0, tax: 45, subtotal: 255 },
        hasShift: true,
        customer: { code: 'CF', name: 'Consumidor Final', rtf: '08011999123456' } as any,
        onCustomerChange: vi.fn(),
        onSaleComplete,
        onTicketPrinted,
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

    expect(onTicketPrinted).toHaveBeenCalledTimes(1)
    const printedTicket = onTicketPrinted.mock.calls[0][0]
    expect(printedTicket.result.invoiceNo).toBe('001-001-01-00000099')
    expect(printedTicket.total).toBe(300)
    expect(onSaleComplete).toHaveBeenCalledWith('001-001-01-00000099', 0)
  })
})
