interface Props {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel
}: Props) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card-surface w-[360px] p-6 animate-in fade-in-0 zoom-in-95">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <div className="mt-5 flex gap-2">
          <button
            className="btn-press flex-1 rounded-lg border border-border py-2.5 text-sm hover:bg-card"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className="btn-press flex-1 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
