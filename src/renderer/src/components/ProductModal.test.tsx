import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Product } from '../api/types'
import ProductModal from './ProductModal'

vi.mock('../api/client', () => ({
  api: {
    products: vi.fn(),
    productByBarcode: vi.fn(),
    productByCode: vi.fn(),
    checkStock: vi.fn(),
    networkStock: vi.fn(),
    requestTransfer: vi.fn()
  },
  getBackendUrl: () => 'http://localhost:5012'
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

  it('no permite agregar productos de la categoría Combustibles', async () => {
    const user = userEvent.setup()
    const combustibles: Product[] = [
      {
        code: 'F1',
        description: 'GASOLINA SUPER',
        unitPrice: 110,
        category: 'COMBUSTIBLES',
        vatGroup: 'EXENTO',
        priceIncludesVat: true
      }
    ]
    ;(api.products as any).mockResolvedValue(combustibles)
    const { onAdd } = setup()

    const card = await screen.findByText('GASOLINA SUPER')
    const button = card.closest('button')
    expect(button).toBeDisabled()
    await user.click(card)
    expect(onAdd).not.toHaveBeenCalled()
    expect(screen.getByText(/Desde el controlador/)).toBeInTheDocument()
    expect(screen.getByText(/Los combustibles no se envían al carrito/)).toBeInTheDocument()
  })

  it('muestra aviso si un código de barras es de combustible', async () => {
    const user = userEvent.setup()
    const { onAdd } = setup()
    ;(api.productByBarcode as any).mockResolvedValue({
      code: 'F2',
      description: 'GASOLINA DIESEL',
      unitPrice: 105,
      category: 'COMBUSTIBLES',
      vatGroup: 'EXENTO',
      priceIncludesVat: true
    })
    const input = screen.getByPlaceholderText(/Escanee o escriba/)
    await user.type(input, '123{Enter}')
    expect(await screen.findByText(/se agregan desde el controlador/)).toBeInTheDocument()
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('muestra badge de stock y permite consultar la disponibilidad en red de sucursales', async () => {
    const user = userEvent.setup()
    ;(api.checkStock as any).mockResolvedValue({
      productCode: '0001',
      stock: 15,
      minStock: 2,
      isAvailable: true,
      source: 'HQ',
      updatedAt: '2026-10-09T12:00:00Z'
    })
    ;(api.networkStock as any).mockResolvedValue({
      productCode: '0001',
      items: [
        { storeCode: '001', storeName: 'Principal', stock: 15, minStock: 2, isAvailable: true },
        { storeCode: '002', storeName: 'Norte', stock: 8, minStock: 1, isAvailable: true }
      ],
      totalNetworkStock: 23,
      source: 'HQ'
    })

    setup()
    expect(await screen.findByText('SF23')).toBeInTheDocument()

    // Badge de stock
    const stockBadges = await screen.findAllByText(/Stock: 15/)
    expect(stockBadges.length).toBeGreaterThan(0)
    expect(screen.getAllByText('(HQ)').length).toBeGreaterThan(0)

    // Clic en botón "Red" para consultar otras sucursales
    const redBtn = screen.getByTestId('network-stock-0001')
    await user.click(redBtn)

    // Diálogo de stock en red
    expect(await screen.findByText('Stock en Red de Sucursales')).toBeInTheDocument()
    expect(await screen.findByText('Principal')).toBeInTheDocument()
    expect(await screen.findByText('Norte')).toBeInTheDocument()
    expect(screen.getByText('23')).toBeInTheDocument()
    expect(screen.getByText('Matriz Central (En vivo)')).toBeInTheDocument()

    // Cerrar modal
    const closeBtn = screen.getByRole('button', { name: 'Cerrar' })
    await user.click(closeBtn)
    expect(screen.queryByText('Stock en Red de Sucursales')).not.toBeInTheDocument()
  })

  it('permite solicitar traspaso de inventario a otra sucursal', async () => {
    const user = userEvent.setup()
    ;(api.checkStock as any).mockResolvedValue({
      productCode: '0001',
      stock: 1,
      minStock: 2,
      isAvailable: true,
      source: 'HQ'
    })
    ;(api.networkStock as any).mockResolvedValue({
      productCode: '0001',
      items: [
        { storeCode: '001', storeName: 'Principal', stock: 1, minStock: 2, isAvailable: true, updatedAt: null },
        { storeCode: '002', storeName: 'Norte', stock: 15, minStock: 3, isAvailable: true, updatedAt: null }
      ],
      totalNetworkStock: 16,
      source: 'HQ'
    })
    ;(api.requestTransfer as any).mockResolvedValue({
      id: 'trf-123',
      transferNo: 'TRF-20261010-1001',
      status: 'REQUESTED'
    })

    setup()

    const netBtn = await screen.findByTestId('network-stock-0001')
    await user.click(netBtn)

    expect(await screen.findByText('Stock en Red de Sucursales')).toBeInTheDocument()

    // Botón de traspaso para sucursal Norte
    const transferBtns = screen.getAllByRole('button', { name: /Traspaso/i })
    expect(transferBtns.length).toBeGreaterThan(0)
    await user.click(transferBtns[0])

    // Debe mostrar selector de cantidad y botón Solicitar
    expect(screen.getByText('Cantidad a solicitar:')).toBeInTheDocument()
    const submitBtn = screen.getByRole('button', { name: 'Solicitar' })
    await user.click(submitBtn)

    // Debe llamar a api.requestTransfer
    await waitFor(() => {
      expect(api.requestTransfer).toHaveBeenCalledWith(
        expect.objectContaining({
          fromStoreCode: '001',
          requestedBy: 'CAJERO',
          items: expect.arrayContaining([
            expect.objectContaining({ productCode: '0001', quantity: 1 })
          ])
        })
      )
    })

    // Debe mostrar mensaje de éxito
    expect(await screen.findByText(/TRF-20261010-1001 registrada con éxito/i)).toBeInTheDocument()
  })
})