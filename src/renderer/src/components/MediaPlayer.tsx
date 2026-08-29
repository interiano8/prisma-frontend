import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import type { MediaFile } from '../api/types'
import { Image, Play, SkipBack, SkipForward } from 'lucide-react'

const IMAGE_SECONDS = 8

export default function MediaPlayer() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [error, setError] = useState('')
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
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

  const prev = useCallback(() => {
    if (files.length === 0) return
    setIndex((i) => (i - 1 + files.length) % files.length)
  }, [files.length])

  useEffect(() => {
    clearTimer()
    if (!playing || !current) return
    if (current.type === 'image') {
      timerRef.current = setTimeout(next, IMAGE_SECONDS * 1000)
    }
    return clearTimer
  }, [current, playing, next, clearTimer])

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
            ref={videoRef}
            src={api.mediaUrl(current.url)}
            className="h-full w-full object-cover"
            controls
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

      <div className="flex items-center gap-2">
        <button
          className="btn-press rounded-lg border border-border p-2 text-muted hover:bg-card hover:text-primary"
          onClick={prev}
          title="Anterior"
        >
          <SkipBack size={16} />
        </button>
        <button
          className="btn-press rounded-lg border border-border p-2 text-muted hover:bg-card hover:text-primary"
          onClick={() => {
            setPlaying((v) => !v)
            if (!playing && videoRef.current) videoRef.current.play()
          }}
          title={playing ? 'Pausar' : 'Reproducir'}
        >
          {playing ? <Image size={16} /> : <Play size={16} />}
        </button>
        <button
          className="btn-press rounded-lg border border-border p-2 text-muted hover:bg-card hover:text-primary"
          onClick={next}
          title="Siguiente"
        >
          <SkipForward size={16} />
        </button>
        <div className="ml-auto flex min-h-0 gap-1 overflow-x-auto">
          {files.map((f, i) => (
            <button
              key={f.name}
              className={`btn-press shrink-0 overflow-hidden rounded border transition-colors ${
                i === index ? 'border-accent' : 'border-border opacity-60 hover:opacity-100'
              }`}
              onClick={() => setIndex(i)}
              title={f.name}
            >
              {f.type === 'image' ? (
                <img src={api.mediaUrl(f.url)} alt={f.name} className="h-12 w-16 object-cover" loading="lazy" />
              ) : (
                <div className="flex h-12 w-16 items-center justify-center bg-card">
                  <Play size={16} className="text-muted" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}