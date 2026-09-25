import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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
})