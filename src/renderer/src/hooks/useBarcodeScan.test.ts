import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBarcodeScan } from './useBarcodeScan'
import { api } from '../api/client'

vi.mock('../api/client', () => ({
  api: {
    productByBarcode: vi.fn(),
    productByCode: vi.fn()
  }
}))

describe('useBarcodeScan hook', () => {
  it('parses standard code and adds with quantity 1', async () => {
    const addProduct = vi.fn()
    const setMessage = vi.fn()
    const mockProd = { code: 'PROD1', description: 'Item 1', unitPrice: 20, vatGroup: '15' } as any

    vi.mocked(api.productByBarcode).mockResolvedValueOnce(mockProd)

    const { result } = renderHook(() =>
      useBarcodeScan({ addProduct, setMessage, disabled: false })
    )

    act(() => {
      result.current.setCodeInput('PROD1')
    })

    await act(async () => {
      await result.current.submitCode()
    })

    expect(addProduct).toHaveBeenCalledWith(mockProd, 1)
    expect(setMessage).toHaveBeenCalledWith('Item 1 agregado.')
  })

  it('parses multiplier expression N*CODE and passes quantity', async () => {
    const addProduct = vi.fn()
    const setMessage = vi.fn()
    const mockProd = { code: 'COCA', description: 'Coca Cola', unitPrice: 25, vatGroup: '15' } as any

    vi.mocked(api.productByBarcode).mockResolvedValueOnce(null)
    vi.mocked(api.productByCode).mockResolvedValueOnce(mockProd)

    const { result } = renderHook(() =>
      useBarcodeScan({ addProduct, setMessage, disabled: false })
    )

    act(() => {
      result.current.setCodeInput('6*COCA')
    })

    await act(async () => {
      await result.current.submitCode()
    })

    expect(addProduct).toHaveBeenCalledWith(mockProd, 6)
    expect(setMessage).toHaveBeenCalledWith('6x Coca Cola agregado.')
  })
})
