import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CodeInputRow from './CodeInputRow'

describe('CodeInputRow', () => {
  it('renderiza input, botón Agregar y botón Productos', () => {
    render(
      <CodeInputRow
        codeInput=""
        onCodeChange={() => {}}
        onSubmit={() => {}}
        inputRef={{ current: null }}
        onOpenProducts={() => {}}
      />
    )
    expect(screen.getByPlaceholderText(/Código de barras/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Agregar/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Productos/ })).toBeInTheDocument()
  })

  it('Agregar se habilita con texto y envía al hacer clic o Enter', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onCodeChange = vi.fn()
    render(
      <CodeInputRow
        codeInput="0001"
        onCodeChange={onCodeChange}
        onSubmit={onSubmit}
        inputRef={{ current: null }}
        onOpenProducts={() => {}}
      />
    )
    const add = screen.getByRole('button', { name: /Agregar/ })
    expect(add).toBeEnabled()
    await user.click(add)
    expect(onSubmit).toHaveBeenCalledTimes(1)

    const input = screen.getByPlaceholderText(/Código de barras/)
    await user.type(input, 'X')
    expect(onCodeChange).toHaveBeenCalled()
    await user.keyboard('{Enter}')
    expect(onSubmit).toHaveBeenCalledTimes(2)
  })

  it('abre el modal de productos', async () => {
    const user = userEvent.setup()
    const onOpenProducts = vi.fn()
    render(
      <CodeInputRow
        codeInput=""
        onCodeChange={() => {}}
        onSubmit={() => {}}
        inputRef={{ current: null }}
        onOpenProducts={onOpenProducts}
      />
    )
    await user.click(screen.getByRole('button', { name: /Productos/ }))
    expect(onOpenProducts).toHaveBeenCalledTimes(1)
  })
})