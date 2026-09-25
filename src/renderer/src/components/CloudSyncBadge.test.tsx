import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { CloudSyncBadge } from './CloudSyncBadge'

describe('CloudSyncBadge Component', () => {
  it('muestra "Nube al día" con estilo verde cuando está online y sin pendientes', () => {
    render(
      <CloudSyncBadge
        syncInfo={{
          status: 'online',
          pendingCount: 0,
          lastSyncAt: '2026-09-25T12:00:00Z',
          latencyMs: 35
        }}
      />
    )

    const badge = screen.getByTestId('cloud-sync-badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Nube al día')
    expect(badge.className).toContain('text-success')
  })

  it('muestra "Sincronizando..." cuando el estado es syncing', () => {
    render(
      <CloudSyncBadge
        syncInfo={{
          status: 'syncing',
          pendingCount: 3,
          lastSyncAt: '2026-09-25T12:00:00Z',
          latencyMs: 40
        }}
      />
    )

    const badge = screen.getByTestId('cloud-sync-badge')
    expect(badge).toHaveTextContent('Sincronizando...')
    expect(badge.className).toContain('text-warning')
  })

  it('muestra "Offline (5 pendientes)" con estilo rojo cuando está desconectado', () => {
    render(
      <CloudSyncBadge
        syncInfo={{
          status: 'offline',
          pendingCount: 5,
          lastSyncAt: '2026-09-25T11:45:00Z',
          error: 'Connection timeout'
        }}
      />
    )

    const badge = screen.getByTestId('cloud-sync-badge')
    expect(badge).toHaveTextContent('Offline (5 pendientes)')
    expect(badge.className).toContain('text-danger')
  })

  it('muestra "Nube N/C" cuando no está configurado', () => {
    render(
      <CloudSyncBadge
        syncInfo={{
          status: 'not_configured',
          pendingCount: 0,
          lastSyncAt: null
        }}
      />
    )

    const badge = screen.getByTestId('cloud-sync-badge')
    expect(badge).toHaveTextContent('Nube N/C')
    expect(badge.className).toContain('text-muted')
  })

  it('invoca onRefresh al hacer clic en el badge', () => {
    const handleRefresh = vi.fn()
    render(
      <CloudSyncBadge
        syncInfo={{
          status: 'online',
          pendingCount: 0,
          lastSyncAt: '2026-09-25T12:00:00Z'
        }}
        onRefresh={handleRefresh}
      />
    )

    const badge = screen.getByTestId('cloud-sync-badge')
    fireEvent.click(badge)
    expect(handleRefresh).toHaveBeenCalledTimes(1)
  })
})
