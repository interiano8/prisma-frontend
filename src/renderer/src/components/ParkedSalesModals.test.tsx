import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ParkSaleModal from './ParkSaleModal'
import ParkedSalesListModal from './ParkedSalesListModal'
import type { ParkedSale } from '../api/types'

describe('ParkSaleModal', () => {
  it('envía la nota ingresada al confirmar', () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()

    render(
      <ParkSaleModal
        open={true}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    )

    const input = screen.getByPlaceholderText(/Hilux blanca/i)
    fireEvent.change(input, { target: { value: 'Hilux Azul - Bomba 4' } })

    const submitBtn = screen.getByRole('button', { name: /Aparcar/i })
    fireEvent.click(submitBtn)

    expect(onConfirm).toHaveBeenCalledWith('Hilux Azul - Bomba 4')
  })
})

describe('ParkedSalesListModal', () => {
  const mockSales: ParkedSale[] = [
    {
      id: 'uuid-1',
      codigo: 'A-1',
      storeId: '001',
      posNo: '01',
      usuario: 'cajero1',
      turnoId: '101',
      cliente: { code: '01', name: 'Empresa ABC' } as any,
      items: [
        { code: '01', description: 'DIESEL', qty: 10, price: 30, total: 300, tax: 0, discount: 0, saleId: 999, pumpNumber: 2 }
      ],
      nota: 'Toyota Hilux',
      total: 300,
      estado: 'PARKED',
      fechaCreacion: '2026-10-08T14:00:00Z',
      fechaActualizado: '2026-10-08T14:00:00Z'
    }
  ]

  it('muestra la lista de ventas aparcadas y permite reanudar', () => {
    const onResume = vi.fn()
    const onDiscard = vi.fn()
    const onClose = vi.fn()

    render(
      <ParkedSalesListModal
        open={true}
        onClose={onClose}
        sales={mockSales}
        loading={false}
        moneda="HNL"
        onResume={onResume}
        onDiscard={onDiscard}
      />
    )

    expect(screen.getByText('A-1')).toBeDefined()
    expect(screen.getByText('Empresa ABC')).toBeDefined()
    expect(screen.getByText(/Toyota Hilux/i)).toBeDefined()
    expect(screen.getByText(/Bomba 2/i)).toBeDefined()

    const resumeBtn = screen.getByText('Reanudar')
    fireEvent.click(resumeBtn)

    expect(onResume).toHaveBeenCalledWith(mockSales[0])
  })
})
