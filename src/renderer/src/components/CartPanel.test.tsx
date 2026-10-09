import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CartItem, Customer } from '../api/types'
import type { Totals } from '../lib/pos-cart'
import CartPanel from './CartPanel'

const totals: Totals = { total: 165, discount: 5, tax: 15, subtotal: 150 }

const items: CartItem[] = [
  {
    code: 'A1',
    description: 'Agua',
    qty: 2,
    price: 50,
    tax: 13.04,
    discount: 0,
    total: 100,
    vatGroup: 'ISV_15',
    uid: 'u1'
  },
  {
    code: 'G1',
    description: 'GASOLINA SUPER',
    qty: 1,
    price: 65,
    tax: 0,
    discount: 5,
    total: 65,
    vatGroup: 'EXENTO',
    uid: 'u2',
    saleId: 9,
    pumpNumber: 1,
    hoseNumber: 'A',
    unidad: 'gal',
    fechaHora: '2026-08-15 01:36:37'
  }
]

const customer: Customer = {
  code: '06011991006206',
  name: 'TRANSPORTES ORTIZ',
  rtf: '06011991006206',
  phone: '',
  email: '',
  address: ''
}

function baseProps(overrides: Partial<Parameters<typeof CartPanel>[0]> = {}) {
  return {
    customer: null,
    hasShift: true,
    shiftNumber: '2',
    billingType: 'contado' as const,
    isFidelizacion: false,
    fidelizacionLabel: 'Fidelización',
    effectiveCart: items,
    totals,
    moneda: 'L.',
    busy: false,
    onSetConsumidorFinal: vi.fn(),
    onOpenCustomerMode: vi.fn(),
    onChangeCustomer: vi.fn(),
    onOpenCheckout: vi.fn(),
    onOpenShift: vi.fn(),
    onToggleDiscount: vi.fn(),
    onChangeQty: vi.fn(),
    onRemoveItem: vi.fn(),
    ...overrides
  }
}

describe('CartPanel', () => {
  it('muestra botones de cliente cuando no hay cliente', () => {
    render(<CartPanel {...baseProps()} />)
    expect(screen.getByRole('button', { name: /Consumidor Final/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Por RTN/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Crédito/ })).toBeInTheDocument()
  })

  it('muestra el cliente seleccionado con RTN formateado', () => {
    render(<CartPanel {...baseProps({ customer })} />)
    expect(screen.getByText('TRANSPORTES ORTIZ')).toBeInTheDocument()
    expect(screen.getByText(/0601-1991-006206/)).toBeInTheDocument()
  })

  it('muestra items con impuesto, cantidad y totales con moneda', () => {
    render(<CartPanel {...baseProps()} />)
    expect(screen.getByText('Agua')).toBeInTheDocument()
    expect(screen.getByText('ISV 15%')).toBeInTheDocument()
    expect(screen.getByText('Exento')).toBeInTheDocument()
    // total de línea (Agua): 100
    expect(screen.getByText('L. 100.00')).toBeInTheDocument()
    // totales
    expect(screen.getByText('L. 150.00')).toBeInTheDocument() // subtotal
    expect(screen.getByText('L. 5.00')).toBeInTheDocument() // descuento
    expect(screen.getByText('L. 165.00')).toBeInTheDocument() // total
  })

  it('Cobrar se deshabilita sin cliente', () => {
    render(<CartPanel {...baseProps({ customer: null })} />)
    expect(screen.getByRole('button', { name: /Cobrar/ })).toBeDisabled()
  })

  it('Cobrar se deshabilita sin turno abierto', () => {
    render(<CartPanel {...baseProps({ hasShift: false })} />)
    expect(screen.getByRole('button', { name: /Cobrar/ })).toBeDisabled()
  })

  it('muestra carrito vacío sin items', () => {
    render(<CartPanel {...baseProps({ effectiveCart: [] })} />)
    expect(screen.getByText(/Carrito vacío/)).toBeInTheDocument()
  })

  it('Cobrar se habilita con cliente y carrito', async () => {
    const user = userEvent.setup()
    const onOpenCheckout = vi.fn()
    render(<CartPanel {...baseProps({ customer, onOpenCheckout })} />)
    const cobrar = screen.getByRole('button', { name: /Cobrar/ })
    expect(cobrar).toBeEnabled()
    await user.click(cobrar)
    expect(onOpenCheckout).toHaveBeenCalledTimes(1)
  })

  it('cambia cantidad y quita items vía callbacks', async () => {
    const user = userEvent.setup()
    const onChangeQty = vi.fn()
    const onRemoveItem = vi.fn()
    render(<CartPanel {...baseProps({ onChangeQty, onRemoveItem })} />)
    // Agua tiene qty con +/-
    const plus = screen.getAllByRole('button', { name: '' })[0] // botón sin aria-label
    await user.click(plus)
    expect(onChangeQty).toHaveBeenCalled()
  })

  it('ejecuta los handlers de cliente y turno', async () => {
    const user = userEvent.setup()
    const onSetConsumidorFinal = vi.fn()
    const onOpenCustomerMode = vi.fn()
    const onOpenShift = vi.fn()
    render(
      <CartPanel
        {...baseProps({ hasShift: false, onSetConsumidorFinal, onOpenCustomerMode, onOpenShift })}
      />
    )
    await user.click(screen.getByRole('button', { name: /Consumidor Final/ }))
    expect(onSetConsumidorFinal).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: /Por RTN/ }))
    expect(onOpenCustomerMode).toHaveBeenCalledWith('rtn')
    await user.click(screen.getByRole('button', { name: /Crédito/ }))
    expect(onOpenCustomerMode).toHaveBeenCalledWith('credito')
    await user.click(screen.getByRole('button', { name: /Fidelización/ }))
    expect(onOpenCustomerMode).toHaveBeenCalledWith('fidelizacion')
    // El botón abre el modal de operaciones y desde ahí se abre turno
    await user.click(screen.getByRole('button', { name: /Abrir turno/ }))
    // Ahora en el modal:
    await user.click(screen.getByRole('button', { name: /Abrir nuevo turno/ }))
    expect(onOpenShift).toHaveBeenCalledTimes(1)
  })

  it('cambia de cliente y aplica descuento vía callbacks', async () => {
    const user = userEvent.setup()
    const onChangeCustomer = vi.fn()
    const onToggleDiscount = vi.fn()
    render(<CartPanel {...baseProps({ customer, onChangeCustomer, onToggleDiscount })} />)
    await user.click(screen.getByRole('button', { name: /Cambiar/ }))
    expect(onChangeCustomer).toHaveBeenCalledTimes(1)
    await user.click(screen.getAllByTitle(/Aplicar \/ quitar descuento/)[0])
    expect(onToggleDiscount).toHaveBeenCalledTimes(1)
  })

  it('renderiza y ejecuta acciones desde el modal de operaciones', async () => {
    const user = userEvent.setup()
    const onOpenParkedSales = vi.fn()
    const onParkSale = vi.fn()
    const { rerender } = render(
      <CartPanel
        {...baseProps({
          onOpenParkedSales,
          onParkSale,
          parkedCount: 3
        })}
      />
    )

    // Botón único en cabecera
    const opsButton = screen.getByTitle(/Menú de operaciones/i)
    expect(opsButton).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()

    // Abrir modal de operaciones
    await user.click(opsButton)
    expect(screen.getByText('Operaciones de Turno y Ventas')).toBeInTheDocument()

    // Clic en ver aparcadas
    const viewButton = screen.getByRole('button', { name: /Ver ventas aparcadas/ })
    await user.click(viewButton)
    expect(onOpenParkedSales).toHaveBeenCalledTimes(1)

    // Reabrir modal y clic en aparcar
    await user.click(opsButton)
    const parkButton = screen.getByRole('button', { name: /Aparcar venta actual/ })
    expect(parkButton).toBeEnabled()
    await user.click(parkButton)
    expect(onParkSale).toHaveBeenCalledTimes(1)

    // Con carrito vacío, el botón de aparcar debe deshabilitarse en el modal
    rerender(
      <CartPanel
        {...baseProps({
          effectiveCart: [],
          onOpenParkedSales,
          onParkSale
        })}
      />
    )
    await user.click(opsButton)
    expect(screen.getByRole('button', { name: /Aparcar venta actual/ })).toBeDisabled()
  })
})