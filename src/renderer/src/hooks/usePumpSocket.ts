import { useEffect, useRef, useState } from 'react'

export type PumpSocketStatus = 'conectado' | 'reconectando' | 'desconectado'

export interface PumpStatusMessage {
  PumpID: number
  Status: string
  SubStatus: string
  SaleId?: number | null
  Amount?: number | null
  Volume?: number | null
  Timestamp?: string
}

/** Normaliza la URL del controlador (ip:puerto o dominio) a ws://…/ws/pump-status. */
export function buildPumpSocketUrl(host: string): string {
  let h = host.trim()
  if (!h) return ''
  if (h.startsWith('http://')) h = h.slice('http://'.length)
  if (h.startsWith('https://')) h = h.slice('https://'.length)
  return `ws://${h}/ws/pump-status`
}

/**
 * WebSocket de estado de bombas con reconexión automática (backoff 1s→2s→4s…,
 * tope 30s, indefinido). Expone el estado de conexión.
 */
export function usePumpSocket(
  host: string,
  apiKey: string,
  onMessage: (msg: PumpStatusMessage) => void,
): PumpSocketStatus {
  const [status, setStatus] = useState<PumpSocketStatus>('desconectado')
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    if (!host || !apiKey) return

    let ws: WebSocket | null = null
    let closed = false
    let retry = 0
    let timer: ReturnType<typeof setTimeout> | null = null

    const scheduleReconnect = () => {
      if (closed) return
      const delay = Math.min(1000 * 2 ** retry, 30_000)
      retry += 1
      timer = setTimeout(connect, delay)
    }

    const connect = () => {
      if (closed) return
      setStatus('reconectando')
      try {
        ws = new WebSocket(`${buildPumpSocketUrl(host)}?apiKey=${encodeURIComponent(apiKey)}`)
      } catch {
        scheduleReconnect()
        return
      }
      ws.onopen = () => {
        retry = 0
        setStatus('conectado')
      }
      ws.onmessage = (ev) => {
        try {
          onMessageRef.current(JSON.parse(ev.data as string) as PumpStatusMessage)
        } catch {
          // mensaje inválido: ignorar
        }
      }
      ws.onclose = () => {
        setStatus('desconectado')
        scheduleReconnect()
      }
      ws.onerror = () => {
        try {
          ws?.close()
        } catch {
          // ignorar
        }
      }
    }

    connect()
    return () => {
      closed = true
      if (timer) clearTimeout(timer)
      try {
        ws?.close()
      } catch {
        // ignorar
      }
    }
  }, [host, apiKey])

  return status
}