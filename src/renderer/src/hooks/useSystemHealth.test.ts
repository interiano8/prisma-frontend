import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useSystemHealth, formatHealthSummary } from './useSystemHealth'
import { api } from '../api/client'
import type { HealthCheckResult } from '../api/types'

describe('useSystemHealth & formatHealthSummary', () => {
  const mockHealthy: HealthCheckResult = {
    status: 'ok',
    database: { status: 'up', latencyMs: 3 },
    controller: { status: 'up', latencyMs: 10, url: 'http://localhost:5008' },
    licensing: { status: 'active', details: { issuedTo: 'Estación Prisma' } },
    system: {
      uptimeSeconds: 3600,
      memoryRssMb: 120,
      memoryHeapUsedMb: 60,
      timestamp: '2026-09-25T12:00:00Z'
    }
  }

  const mockDegraded: HealthCheckResult = {
    status: 'degraded',
    database: { status: 'up', latencyMs: 4 },
    controller: { status: 'down', error: 'Timeout' },
    licensing: { status: 'active' },
    system: {
      uptimeSeconds: 3600,
      memoryRssMb: 120,
      memoryHeapUsedMb: 60,
      timestamp: '2026-09-25T12:00:00Z'
    }
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('formatHealthSummary', () => {
    it('muestra mensaje de backend no disponible si status es unreachable', () => {
      expect(formatHealthSummary(null, 'unreachable')).toBe('Servidor backend no disponible')
    })

    it('formatea correctamente cuando todos los subsistemas están UP', () => {
      const summary = formatHealthSummary(mockHealthy, 'ok')
      expect(summary).toContain('DB: OK')
      expect(summary).toContain('Bombas: OK')
      expect(summary).toContain('Licencia: Activa')
    })

    it('formatea adecuadamente cuando las bombas no están configuradas', () => {
      const result: HealthCheckResult = {
        ...mockHealthy,
        controller: { status: 'not_configured' }
      }
      const summary = formatHealthSummary(result, 'ok')
      expect(summary).toContain('Bombas: N/C')
    })

    it('formatea adecuadamente cuando las bombas están desconectadas', () => {
      const summary = formatHealthSummary(mockDegraded, 'degraded')
      expect(summary).toContain('Bombas: Desconectadas')
    })

    it('formatea adecuadamente cuando cloudSync está presente y online', () => {
      const result: HealthCheckResult = {
        ...mockHealthy,
        cloudSync: {
          status: 'online',
          pendingCount: 0,
          lastSyncAt: '2026-09-25T12:00:00Z'
        }
      }
      const summary = formatHealthSummary(result, 'ok')
      expect(summary).toContain('Nube: OK')
    })

    it('formatea adecuadamente cuando cloudSync está offline con ventas pendientes', () => {
      const result: HealthCheckResult = {
        ...mockHealthy,
        cloudSync: {
          status: 'offline',
          pendingCount: 4,
          lastSyncAt: '2026-09-25T11:00:00Z'
        }
      }
      const summary = formatHealthSummary(result, 'ok')
      expect(summary).toContain('Nube: Offline (4)')
    })
  })

  describe('useSystemHealth Hook', () => {
    it('consulta api.health al montar y actualiza el estado', async () => {
      vi.spyOn(api, 'health').mockResolvedValueOnce(mockHealthy)

      const { result } = renderHook(() => useSystemHealth({ pollIntervalMs: 0 }))

      await waitFor(() => {
        expect(result.current.health).not.toBeNull()
      })

      expect(result.current.status).toBe('ok')
      expect(result.current.health).toEqual(mockHealthy)
      expect(result.current.lastChecked).toBeInstanceOf(Date)
      expect(result.current.summary).toContain('DB: OK')
    })

    it('maneja errores de conexión asignando estado unreachable sin lanzar excepción', async () => {
      vi.spyOn(api, 'health').mockRejectedValueOnce(new Error('Failed to fetch'))

      const { result } = renderHook(() => useSystemHealth({ pollIntervalMs: 0 }))

      await waitFor(() => {
        expect(result.current.status).toBe('unreachable')
      })

      expect(result.current.health).toBeNull()
      expect(result.current.summary).toBe('Servidor backend no disponible')
    })

    it('permite refrescar manualmente el estado', async () => {
      vi.spyOn(api, 'health')
        .mockResolvedValueOnce(mockDegraded)
        .mockResolvedValueOnce(mockHealthy)

      const { result } = renderHook(() => useSystemHealth({ pollIntervalMs: 0 }))

      await waitFor(() => {
        expect(result.current.status).toBe('degraded')
      })

      await act(async () => {
        await result.current.refresh()
      })

      expect(result.current.status).toBe('ok')
      expect(result.current.summary).toContain('Bombas: OK')
    })
  })
})
