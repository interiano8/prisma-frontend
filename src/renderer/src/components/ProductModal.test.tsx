import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Product } from '../api/types'
import ProductModal from './ProductModal'

vi.mock('../api/client', () => ({
  api: {
    products: vi.fn(),
    productByBarcode: vi.fn(),
    productByCode: vi.fn()
  },
  getBackendUrl: () => 'http://localhost:5009'
}))

import { api } from '../api/client'

const products: Product[] = [
  {
    code: '0001',
    description: 'SF23',
    unitPrice: 50,
    category: 'CAT',
    vatGroup: 'ISV_15',
    priceIncludesVat: true,
    unidadMedida: 'UND',
    codigosBarras: ['7891234567890']
  },
  {
    code: '500310',
    description: 'PUMA BRAKE FLUID DOT-4',
    unitPrice: 103,
    category: 'LUBRICANTES',
    vatGroup: 'ISV_15',
    priceIncludesVat: true,
    unidadMedida: 'UND'
  }
]

function setup(overrides: Partial<Parameters<typeof ProductModal>[0]> = {}) {
  const onAdd = vi.fn()
  const onClose = vi.fn()
  const utils = render(
    <ProductModal
      open={true}
      onClose={onClose}
      onAdd={onAdd}
      moneda="L."
      {...overrides}
    />
  )
  return { onAdd, onClose, ...utils }
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(api.products as any).mockResolvedValue(products)
})

describe('ProductModal', () => {
  it('carga y muestra las tarjetas de productos con impuesto, UM y precio con moneda', async () => {
    setup()
    expect(await screen.findByText('SF23')).toBeInTheDocument()
    expect(await screen.findByText('PUMA BRAKE FLUID DOT-4')).toBeInTheDocument()
    // UM y precio con moneda
    expect(screen.getAllByText('ISV 15%').length).toBeGreaterThan(0)
    expect(screen.getAllByText('L. 50.00').length).toBeGreaterThan(0)
  })

  it('agrega un producto al hacer clic en su tarjeta', async () => {
    const user = userEvent.setup()
    const { onAdd } = setup()
    const card = await screen.findByText('SF23')
    await user.click(card)
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ code: '0001' }))
  })

  it('busca por código de barras y agrega; muestra error si no existe', async () => {
    const user = userEvent.setup()
    const { onAdd } = setup()
    ;(api.productByBarcode as any).mockResolvedValue(products[1])
    const input = screen.getByPlaceholderText(/Escanee o escriba/)
    await user.type(input, '9876543210987{Enter}')
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ code: '500310' })))

    // Código inexistente
    ;(api.productByBarcode as any).mockResolvedValue(null)
    ;(api.productByCode as any).mockResolvedValue(null)
    await user.clear(input)
    await user.type(input, 'NOEXISTE{Enter}')
    expect(await screen.findByText(/No hay producto con código/)).toBeInTheDocument()
  })
})