import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PumpsBlock from './PumpsBlock'
import type { Dispenser } from '../api/types'

const pump = (overrides: Partial<Dispenser>): Dispenser => ({
  pumpId: 7,
  state: 'idle',
  productName: 'SUPER',
  gallons: 0,
  amount: 0,
  unitPrice: 30,
  limitAmount: null,
  saleId: null,
  ...overrides,
})

function renderBlock(pumps: Dispenser[], allPumpIds?: number[], opts: { showAll?: boolean; myPumpIds?: number[] } = {}) {
  return render(
    <PumpsBlock
      pumps={pumps}
      allPumpIds={allPumpIds}
      myPumpIds={opts.myPumpIds}
      mostrarBombas
      showAll={opts.showAll ?? false}
      onToggleAll={() => {}}
      onOpenPump={() => {}}
      conexionEstado="conectado"
    />,
  )
}

describe('PumpsBlock', () => {
  it('una bomba que despacha con venta no muestra el punto naranja', () => {
    const { container } = renderBlock([pump({ pumpId: 7, state: 'fuelling', saleId: 456, amount: 500 })])
    const btn = container.querySelector('button')
    expect(btn?.className).not.toContain('bg-warning/10')
    expect(container.querySelectorAll('.bg-warning').length).toBe(0)
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('en colgada el botón se ve neutral y sin punto naranja', () => {
    const { container } = renderBlock([pump({ pumpId: 7, state: 'colgada', saleId: 456 })])
    const btn = container.querySelector('button')
    expect(btn?.className).not.toContain('bg-warning/10')
    expect(container.querySelectorAll('.bg-warning').length).toBe(0)
  })

  it('muestra la onda de líquido solo cuando la bomba despacha', () => {
    const { container: fuelling } = renderBlock([pump({ pumpId: 7, state: 'fuelling' })])
    expect(fuelling.querySelectorAll('.pump-wave').length).toBe(1)

    const { container: idle } = renderBlock([pump({ pumpId: 8, state: 'idle' })])
    expect(idle.querySelectorAll('.pump-wave').length).toBe(0)
  })

  it('en Starting muestra el arco giratorio y no la onda', () => {
    const { container } = renderBlock([pump({ pumpId: 7, state: 'starting' })])
    expect(container.querySelectorAll('.pump-wave').length).toBe(0)
    expect(container.querySelectorAll('.pump-spinner').length).toBe(1)
  })

  it('mantiene la posición real de las bombas con allPumpIds', () => {
    const { container } = renderBlock(
      [pump({ pumpId: 4, state: 'idle' }), pump({ pumpId: 5, state: 'idle' })],
      [1, 2, 3, 4, 5],
    )
    const buttons = Array.from(container.querySelectorAll('button'))
    const labels = buttons.map((b) => b.textContent ?? '').filter((t) => t.trim() !== '')
    // Los slots 1,2,3 son placeholders vacíos; 4 y 5 quedan en su posición.
    const slots = container.querySelectorAll('[data-pump-slot]').length
    expect(slots).toBe(3)
    expect(labels).toEqual(['4', '5'])
  })

  it('al ver todas distingue las del POS de las ajenas (atenuadas)', () => {
    const { container } = renderBlock(
      [pump({ pumpId: 1 }), pump({ pumpId: 3 })],
      [1, 3],
      { showAll: true, myPumpIds: [3] },
    )
    const btns = Array.from(container.querySelectorAll('button'))
    const mine = btns.find((b) => b.textContent === '3')
    const other = btns.find((b) => b.textContent === '1')
    expect(mine?.className).toContain('border-border-strong')
    expect(other?.className).toContain('opacity-40')
  })

  it('sin ver todas no aplica distinción de propiedad', () => {
    const { container } = renderBlock(
      [pump({ pumpId: 3 })],
      [3],
      { showAll: false, myPumpIds: [3] },
    )
    const btn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === '3')
    expect(btn?.className).not.toContain('opacity-40')
  })
})