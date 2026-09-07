import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CartPayment, PaymentMethod } from '../api/types'
import type { Totals } from '../lib/pos-cart'
import CheckoutModal from './CheckoutModal'

const totals: Totals = { total: 100, discount: 0, tax: 15, subtotal: 85 }

const methods: PaymentMethod[] = [
  {
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
  },
  {
    code: '1003',
    description: 'TCBAC',
    categoria: 'TARJETA',
    moneda: 'HNL',
    generaCambio: false,
    facturaContado: true,
    facturaCredito: true,
    salidaCombustible: false,
    fidelizacion: false,
    requiereReferencia: true,
    imagen: null,
    activo: true
  }
]

function baseProps(overrides: Partial<Parameters<typeof CheckoutModal>[0]> = {}) {
  return {
    open: true,
    billingType: 'contado' as const,
    esTicket: false,
    onToggleTicket: vi.fn(),
    totals,
    availableMethods: methods,
    payments: [],
    paid: 0,
    change: 0,
    amountInputsRef: { current: [] },
    message: '',
    orden: '',
    kmValue: '',
    kmUnit: 'KM' as const,
    chofer: '',
    comment: '',
    busy: false,
    moneda: 'L.',
    backendUrl: 'http://localhost:5012',
    onClose: vi.fn(),
    onAddPayment: vi.fn(),
    onSetPaymentAmount: vi.fn(),
    onRemovePayment: vi.fn(),
    onSetPaymentReference: vi.fn(),
    onOrdenChange: vi.fn(),
    onKmValueChange: vi.fn(),
    onKmUnitChange: vi.fn(),
    onChoferChange: vi.fn(),
    onCommentChange: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides
  }
}

describe('CheckoutModal', () => {
  it('no renderiza nada cuando está cerrado', () => {
    const { container } = render(<CheckoutModal {...baseProps({ open: false })} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('muestra el total a cobrar y agrupa métodos por categoría', () => {
    render(<CheckoutModal {...baseProps()} />)
    expect(screen.getByText(/Cobrar/)).toBeInTheDocument()
    expect(screen.getByText('EFECTIVO')).toBeInTheDocument()
    expect(screen.getByText('TCBAC')).toBeInTheDocument()
    // encabezado de categoría
    expect(screen.getByText('Efectivo')).toBeInTheDocument()
    expect(screen.getByText('Tarjeta')).toBeInTheDocument()
  })

  it('agrega un método de pago', async () => {
    const user = userEvent.setup()
    const onAddPayment = vi.fn()
    render(<CheckoutModal {...baseProps({ onAddPayment })} />)
    await user.click(screen.getByRole('button', { name: /EFECTIVO/ }))
    expect(onAddPayment).toHaveBeenCalledWith(methods[0])
  })

  it('muestra pagos con monto y permite quitarlos', async () => {
    const user = userEvent.setup()
    const payments: CartPayment[] = [
      { method: 'EFECTIVO', code: '1002', amount: '60' },
      { method: 'TCBAC', code: '1003', amount: '40', reference: 'REF1', requiereReferencia: true }
    ]
    const onRemovePayment = vi.fn()
    render(<CheckoutModal {...baseProps({ payments, paid: 100, change: 0, onRemovePayment })} />)
    expect(screen.getByDisplayValue('60')).toBeInTheDocument()
    expect(screen.getByDisplayValue('40')).toBeInTheDocument()
    // pago con referencia obligatoria muestra su input
    expect(screen.getByDisplayValue('REF1')).toBeInTheDocument()
    // Pagado y cambio
    expect(screen.getByText('L. 100.00')).toBeInTheDocument()
  })

  it('muestra el mensaje de error dentro del modal', () => {
    render(<CheckoutModal {...baseProps({ message: 'El pago no cubre el total.' })} />)
    expect(screen.getByText('El pago no cubre el total.')).toBeInTheDocument()
  })

  it('confirma el pago y cancela', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(<CheckoutModal {...baseProps({ onConfirm, onClose })} />)
    await user.click(screen.getByRole('button', { name: /Confirmar pago/ }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: /Cancelar/ }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('muestra campos obligatorios en crédito y deshabilita botón en busy', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<CheckoutModal {...baseProps({ billingType: 'credito', busy: true, onConfirm })} />)
    // OC, KM/MI, Conductor presentes en modo crédito
    expect(screen.getByText(/OC/)).toBeInTheDocument()
    expect(screen.getByText(/KM\/MI/)).toBeInTheDocument()
    expect(screen.getByText(/Conductor/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Orden de compra')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Nombre del conductor')).toBeInTheDocument()
    const confirm = screen.getByRole('button', { name: /Procesando…/ })
    expect(confirm).toBeDisabled()
  })

  it('muestra equivalencia USD con tasa cuando un pago es dólar', () => {
    const usdPayment: CartPayment = {
      code: '1004',
      method: 'DOLAR',
      description: 'DOLAR',
      amount: 20,
      moneda: 'USD',
      tasaCambio: 25,
      montoIngresado: 20
    }
    render(<CheckoutModal {...baseProps({ payments: [usdPayment as any] })} />)
    expect(screen.getByText(/a tasa 25/)).toBeInTheDocument()
  })

  it('muestra el cambio en dólares cuando hay pago USD y cambio', () => {
    const usdPayment: CartPayment = {
      code: '1004',
      method: 'DOLAR',
      description: 'DOLAR',
      amount: 20,
      moneda: 'USD',
      tasaCambio: 25,
      montoIngresado: 20
    }
    render(<CheckoutModal {...baseProps({ payments: [usdPayment as any], change: 50 })} />)
    expect(screen.getByText(/\$2.00/)).toBeInTheDocument()
  })
})