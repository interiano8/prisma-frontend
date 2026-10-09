import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PumpModal from './PumpModal'
import type { Dispenser, PumpTransaction } from '../api/types'

const pump: Dispenser = {
  pumpId: 7,
  state: 'colgada',
  productName: 'SUPER',
  gallons: 16.39,
  amount: 500.25,
  unitPrice: 30.5,
  limitAmount: null,
  saleId: 12345,
  pos: '1',
}

const txs: PumpTransaction[] = [
  {
    saleId: 1001,
    posNumber: 1,
    pumpNumber: 7,
    hoseNumber: '1',
    grade: '1',
    combustible: 'SUPER',
    codigo: '',
    unidad: 'galones',
    precio: 30.5,
    cantidad: 16.39,
    estado: 'Sin Facturar',
    amount: 500.25,
    ciclo: '',
    date: '2026-08-15 08:00:00',
    fecha: '2026-08-15',
    hora: '08:00:00',
    despachador: '',
  },
]

function renderModal(overrides: Partial<Parameters<typeof PumpModal>[0]> = {}) {
  const base = {
    pump,
    loading: false,
    transactions: [],
    cartSaleIds: new Set<number>(),
    minutosAtrasada: 10,
    moneda: 'HNL',
    onClose: () => {},
    onAdd: vi.fn(),
    onAddAndClose: vi.fn(),
  }
  return render(<PumpModal {...base} {...overrides} />)
}

describe('PumpModal', () => {
  it('muestra skeleton mientras carga', () => {
    renderModal({ loading: true })
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText(/Sin transacciones/)).not.toBeInTheDocument()
  })

  it('muestra "Sin transacciones" cuando no hay datos', () => {
    renderModal({ loading: false, transactions: [] })
    expect(screen.getByText(/Sin transacciones/)).toBeInTheDocument()
  })

  it('muestra las transacciones cuando cargó', () => {
    renderModal({ transactions: txs })
    expect(screen.getByText(/#1001/)).toBeInTheDocument()
    expect(screen.getByText(/SUPER/)).toBeInTheDocument()
  })

  it('muestra el turno del controlador de la transacción', () => {
    renderModal({
      transactions: [{ ...txs[0], shiftId: 20260101 }],
    })
    expect(screen.getByText(/Turno Controlador 20260101/)).toBeInTheDocument()
  })

  it('no muestra el turno del controlador cuando no existe', () => {
    renderModal({ transactions: txs })
    expect(screen.queryByText(/Turno Controlador/)).not.toBeInTheDocument()
  })

  it('separa transacciones en Pendientes de Cobro e Historial Facturado', () => {
    const mixedTxs: PumpTransaction[] = [
      { ...txs[0], saleId: 2001, estado: 'Sin Facturar' },
      { ...txs[0], saleId: 2002, estado: 'Facturado' },
    ]
    renderModal({ transactions: mixedTxs })
    expect(screen.getByText(/Pendientes de Cobro \(1\)/)).toBeInTheDocument()
    expect(screen.getByText(/Historial Facturado \(1\)/)).toBeInTheDocument()
    expect(screen.getByText(/#2001/)).toBeInTheDocument()
    expect(screen.getByText(/#2002/)).toBeInTheDocument()
  })

  it('muestra badge "Último despacho" en la primera venta pendiente', () => {
    const twoPending: PumpTransaction[] = [
      { ...txs[0], saleId: 3001, estado: 'Sin Facturar', amount: 300 },
      { ...txs[0], saleId: 3002, estado: 'Sin Facturar', amount: 200 },
    ]
    renderModal({ transactions: twoPending, minutosAtrasada: 0 })
    expect(screen.getByText('Último despacho')).toBeInTheDocument()
    expect(screen.getAllByText('Sin Facturar')).toHaveLength(2)
  })

  it('filtra transacciones por monto al escribir en el buscador', () => {
    const searchTxs: PumpTransaction[] = [
      { ...txs[0], saleId: 4001, amount: 500.25 },
      { ...txs[0], saleId: 4002, amount: 150.0 },
    ]
    renderModal({ transactions: searchTxs })
    expect(screen.getByText(/#4001/)).toBeInTheDocument()
    expect(screen.getByText(/#4002/)).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText(/Buscar por monto/)
    fireEvent.change(searchInput, { target: { value: '150' } })

    expect(screen.queryByText(/#4001/)).not.toBeInTheDocument()
    expect(screen.getByText(/#4002/)).toBeInTheDocument()
  })

  it('agrega la venta con clic simple y con doble clic agrega y cierra el modal', async () => {
    const onAdd = vi.fn()
    const onAddAndClose = vi.fn()
    const multiTxs: PumpTransaction[] = [
      { ...txs[0], saleId: 5001, amount: 400 },
    ]
    renderModal({ transactions: multiTxs, onAdd, onAddAndClose })

    // No debe existir checkbox
    expect(screen.queryByTestId('checkbox-sale-5001')).not.toBeInTheDocument()

    // Tarjeta limpia interactiva
    const card = screen.getByText(/#5001/).closest('div[class*="rounded-xl"]')!
    expect(card).toBeInTheDocument()

    // Clic simple
    fireEvent.click(card)
    await new Promise((r) => setTimeout(r, 320))
    expect(onAdd).toHaveBeenCalledWith(multiTxs[0])

    // Doble clic
    fireEvent.click(card)
    fireEvent.click(card)
    expect(onAddAndClose).toHaveBeenCalledWith(multiTxs[0])
  })
})