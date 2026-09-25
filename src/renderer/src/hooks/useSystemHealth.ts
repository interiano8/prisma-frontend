import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '../api/client'
import type { HealthCheckResult } from '../api/types'

export type SystemHealthStatus = 'ok' | 'degraded' | 'error' | 'unreachable' | 'checking'

export interface UseSystemHealthOptions {
  pollIntervalMs?: number
  enabled?: boolean
}

export interface UseSystemHealthReturn {
  health: HealthCheckResult | null
  status: SystemHealthStatus
  lastChecked: Date | null
  summary: string
  refresh: () => Promise<void>
}

export function formatHealthSummary(health: HealthCheckResult | null, status: SystemHealthStatus): string {
  if (status === 'checking' && !health) {
    return 'Comprobando estado del sistema…'
  }
  if (status === 'unreachable' || !health) {
    return 'Servidor backend no disponible'
  }

  const db = health.database.status === 'up' ? 'DB: OK' : 'DB: Caída'
  const controller =
    health.controller.status === 'up'
      ? 'Bombas: OK'
      : health.controller.status === 'not_configured'
        ? 'Bombas: N/C'
        : 'Bombas: Desconectadas'
  const license =
    health.licensing.status === 'active' || health.licensing.status === 'bypassed'
      ? 'Licencia: Activa'
      : 'Licencia: Inválida'

  return `${db} · ${controller} · ${license}`
}

export function useSystemHealth(options?: UseSystemHealthOptions): UseSystemHealthReturn {
  const pollIntervalMs = options?.pollIntervalMs ?? 20000
  const enabled = options?.enabled ?? true

  const [health, setHealth] = useState<HealthCheckResult | null>(null)
  const [status, setStatus] = useState<SystemHealthStatus>('checking')
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const isMounted = useRef(true)

  const refresh = useCallback(async () => {
    try {
      const res = await api.health()
      if (!isMounted.current) return
      setHealth(res)
      setStatus(res.status)
      setLastChecked(new Date())
    } catch {
      if (!isMounted.current) return
      setHealth(null)
      setStatus('unreachable')
      setLastChecked(new Date())
    }
  }, [])

  useEffect(() => {
    isMounted.current = true
    if (!enabled) return

    void refresh()

    if (pollIntervalMs > 0) {
      const timer = setInterval(() => {
        void refresh()
      }, pollIntervalMs)
      return () => {
        isMounted.current = false
        clearInterval(timer)
      }
    }

    return () => {
      isMounted.current = false
    }
  }, [enabled, pollIntervalMs, refresh])

  const summary = formatHealthSummary(health, status)

  return {
    health,
    status,
    lastChecked,
    summary,
    refresh
  }
}
