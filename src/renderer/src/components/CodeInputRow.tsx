import type { Ref } from 'react'
import { Barcode, Package } from 'lucide-react'

interface Props {
  codeInput: string
  onCodeChange: (v: string) => void
  onSubmit: () => void
  inputRef: Ref<HTMLInputElement>
  onOpenProducts: () => void
}

export default function CodeInputRow({
  codeInput,
  onCodeChange,
  onSubmit,
  inputRef,
  onOpenProducts
}: Props) {
  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Barcode
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            ref={inputRef}
            className="input-base w-full pl-9 font-mono"
            placeholder="Código de barras o de producto (escanee o pegue)…"
            value={codeInput}
            onChange={(e) => onCodeChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSubmit()
            }}
            autoComplete="off"
          />
        </div>
        <button
          className="btn-press shrink-0 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
          onClick={onSubmit}
          disabled={!codeInput.trim()}
        >
          Agregar
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="btn-press ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
          onClick={onOpenProducts}
          title="Abrir modal de productos"
        >
          <Package size={15} />
          Productos
        </button>
      </div>
    </>
  )
}
