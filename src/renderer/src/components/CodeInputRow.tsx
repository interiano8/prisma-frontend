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
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Barcode
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          ref={inputRef}
          className="input-base w-full py-2.5 pl-10 font-mono text-base"
          placeholder="Código de barras o de producto…"
          value={codeInput}
          onChange={(e) => onCodeChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit()
          }}
          autoComplete="off"
        />
      </div>
      <button
        className="btn-press shrink-0 rounded-lg bg-accent px-5 py-2.5 text-base font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
        onClick={onSubmit}
        disabled={!codeInput.trim()}
      >
        Agregar
      </button>
      <button
        className="btn-press inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border-strong bg-card px-4 py-2.5 text-base font-medium text-primary shadow-sm hover:border-accent/50 hover:text-accent"
        onClick={onOpenProducts}
        title="Abrir modal de productos"
      >
        <Package size={16} />
        Productos
      </button>
    </div>
  )
}