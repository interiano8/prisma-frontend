import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import ShiftScreen from './ShiftScreen'
import { AppProvider } from '../store'
import { api } from '../api/client'
import type { LoginResponse } from '../api/types'

const mockShiftSession: LoginResponse = {
  token: 'mock-token',
  user: { id: 1, name: 'Cajero Prueba', username: 'cajero1', profile: 'cajero', isActive: true },
  storeConfig: {
    storeId: 'EST01',
    posNumber: 'POS01',
    name: 'Estación Central',
    storeName: 'Estación Central',
    address: 'Tegucigalpa',
    rtn: '08011999123456',
    phone: '2234-5678',
    email: 'pos@estacion.com',
    moneda: 'HNL',
    noConsumidorFinal: 'CF',
    mostrarBombas: true,
    columns: 48,
    turnos: 3,
    printerConfig: { columns: 48, printerPath: 'COM1' },
    shiftConfig: { canOpenManual: true }
  },
  shiftInfo: {
    Shift: '101',
    'Shift Starting': '2026-09-25T08:00:00Z'
  }
}

const mockReport = {
  totales: {
    totalVentas: 2500,
    totalCobros: 2500,
    totalEfectivo: 1500,
    totalCombustible: 2000,
    totalOtrosProductos: 500,
    totalDescuentos: 0,
    cantidadFacturas: 12,
    cantidadTicket: 4,
    cantidadDevoluciones: 0,
    volumenGalones: 80,
    volumenLitros: 302.83
  },
  cobros: [
    { name: 'EFECTIVO', total: 1500, cantidad: 10 },
    { name: 'TCBAC', total: 700, cantidad: 4 },
    { name: 'CREDITO', total: 300, cantidad: 2 }
  ],
  dispensadores: [{ PumpNo: 1 }, { PumpNo: 2 }],
  combustibles: [{ name: 'SUPER', total: 2000, volumenGalones: 80, volumenLitros: 302.83 }],
  otrosProductos: [],
  impuestos: []
}

describe('ShiftScreen Pre-cierre y Arqueo Interactivo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(api, 'availableShifts').mockResolvedValue([])
    vi.spyOn(api, 'salesReport').mockResolvedValue(mockReport as any)
    vi.spyOn(api, 'closeShift').mockResolvedValue({ ok: true } as any)
  })

  function renderShiftScreen() {
    return render(
      <AppProvider initialSession={mockShiftSession}>
        <ShiftScreen />
      </AppProvider>
    )
  }

  it('muestra el resumen pre-cierre por método de pago con el desglose del turno', async () => {
    renderShiftScreen()

    await waitFor(() => {
      expect(screen.getByText('Resumen Pre-Cierre por Método de Pago')).toBeInTheDocument()
    })

    // Efectivo
    expect(screen.getAllByText('Efectivo').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/1,500\.00/).length).toBeGreaterThan(0)

    // Tarjeta TCBAC
    expect(screen.getAllByText('TCBAC').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/700\.00/).length).toBeGreaterThanOrEqual(1)

    // Crédito
    expect(screen.getAllByText('CREDITO').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/300\.00/).length).toBeGreaterThanOrEqual(1)
  })

  it('calcula la diferencia en tiempo real con badges (Cuadrado, Sobrante, Faltante)', async () => {
    renderShiftScreen()

    await waitFor(() => {
      expect(screen.getByText('Arqueo de Caja')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('0.00')

    // Sin ingresar monto
    expect(screen.getByText('Ingrese monto')).toBeInTheDocument()

    // Caja cuadrada (ingresa 1500)
    fireEvent.change(input, { target: { value: '1500' } })
    expect(screen.getByText(/Cuadrado/)).toBeInTheDocument()

    // Sobrante (ingresa 1600)
    fireEvent.change(input, { target: { value: '1600' } })
    expect(screen.getByText(/Sobrante/)).toBeInTheDocument()
    expect(screen.getByText(/100\.00/)).toBeInTheDocument()

    // Faltante (ingresa 1400)
    fireEvent.change(input, { target: { value: '1400' } })
    expect(screen.getByText(/Faltante/)).toBeInTheDocument()
  })

  it('envía el monto de efectivo ingresado al ejecutar el cierre de turno', async () => {
    renderShiftScreen()

    await waitFor(() => {
      expect(screen.getByText('Arqueo de Caja')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('0.00')
    fireEvent.change(input, { target: { value: '1480.50' } })

    const btnClose = screen.getByText('Cerrar turno')
    await act(async () => {
      fireEvent.click(btnClose)
    })

    expect(api.closeShift).toHaveBeenCalledTimes(1)
    expect(api.closeShift).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: 'EST01',
        posNo: 'POS01',
        actualAmount: 1480.5
      })
    )
  })

  it('muestra el indicador de crédito contingencia offline cuando existen ventas offline en el turno', async () => {
    vi.spyOn(api, 'salesReport').mockResolvedValueOnce({
      ...mockReport,
      totales: {
        ...mockReport.totales,
        totalCreditoOffline: 450.50,
        cantidadCreditoOffline: 3
      }
    } as any)

    renderShiftScreen()

    await waitFor(() => {
      expect(screen.getByText(/Crédito Contingencia \(3\)/)).toBeInTheDocument()
    })
    expect(screen.getByText(/450\.50/)).toBeInTheDocument()
  })
})
