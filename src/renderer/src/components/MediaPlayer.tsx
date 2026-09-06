import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import type { MediaFile } from '../api/types'
import { Image } from 'lucide-react'

const IMAGE_SECONDS = 8

export default function MediaPlayer() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [error, setError] = useState('')
  const [index, setIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    setError('')
    api
      .mediaList()
      .then((list) => {
        if (cancelled) return
        setFiles(list)
        setIndex(0)
      })
      .catch((e: any) => {
        if (!cancelled) setError(e.message || 'Error al cargar la multimedia')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const current = files[index]

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const next = useCallback(() => {
    if (files.length === 0) return
    setIndex((i) => (i + 1) % files.length)
  }, [files.length])

  useEffect(() => {
    clearTimer()
    if (!current) return
    if (current.type === 'image') {
      timerRef.current = setTimeout(next, IMAGE_SECONDS * 1000)
    }
    return clearTimer
  }, [current, next, clearTimer])

  useEffect(() => {
    if (!current || files.length < 2) return
    const n = files[(index + 1) % files.length]
    if (n.type === 'image') {
      const img = new window.Image()
      img.src = api.mediaUrl(n.url)
    }
  }, [current, index, files])

  if (error) {
    return (
      <div className="card-surface flex flex-1 flex-col items-center justify-center gap-3 p-6">
        <Image size={28} className="text-muted" />
        <p className="text-sm text-muted">{error}</p>
        <p className="text-xs text-muted">Configure la carpeta multimedia en Configuración.</p>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="card-surface flex flex-1 flex-col items-center justify-center gap-3 p-6">
        <Image size={28} className="text-muted" />
        <p className="text-sm text-muted">Sin archivos multimedia.</p>
        <p className="text-xs text-muted">Configure la carpeta multimedia en Configuración.</p>
      </div>
    )
  }

  return (
    <div className="card-surface flex min-h-0 flex-1 flex-col gap-3 p-3">
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg bg-black">
        {current.type === 'image' ? (
          <img
            key={current.url}
            src={api.mediaUrl(current.url)}
            alt={current.name}
            className="max-h-full max-w-full object-contain animate-in fade-in-0"
          />
        ) : (
          <video
            key={current.url}
            src={api.mediaUrl(current.url)}
            className="h-full w-full object-cover"
            muted
            autoPlay
            playsInline
            onEnded={next}
          />
        )}
        <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[11px] text-white">
          {index + 1} / {files.length} · {current.name}
        </div>
      </div>
    </div>
  )
}