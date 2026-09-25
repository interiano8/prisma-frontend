import React from 'react'
import { Cloud, CloudOff, RefreshCw, CloudCheck } from 'lucide-react'
import { useSystemHealth } from '../hooks/useSystemHealth'
import type { HealthCloudSync } from '../api/types'

export interface CloudSyncBadgeProps {
  syncInfo?: HealthCloudSync | null
  onRefresh?: () => void
}

export function CloudSyncBadge({ syncInfo: propSyncInfo, onRefresh: propOnRefresh }: CloudSyncBadgeProps = {}) {
  const { cloudSync: hookSyncInfo, refresh: hookRefresh } = useSystemHealth({
    enabled: propSyncInfo === undefined
  })

  const sync = propSyncInfo !== undefined ? propSyncInfo : hookSyncInfo
  const handleRefresh = propOnRefresh ?? hookRefresh

  if (!sync || sync.status === 'not_configured') {
    return (
      <div
        className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs text-muted"
        title="Sincronización en la nube no configurada"
        data-testid="cloud-sync-badge"
      >
        <Cloud size={14} className="text-muted" />
        <span>Nube N/C</span>
      </div>
    )
  }

  const { status, pendingCount, lastSyncAt, latencyMs } = sync

  let badgeColor = 'border-success/40 bg-success/10 text-success'
  let label = 'Nube al día'
  let icon = <CloudCheck size={14} className="text-success" />

  if (status === 'syncing') {
    badgeColor = 'border-warning/40 bg-warning/10 text-warning'
    label = 'Sincronizando...'
    icon = <RefreshCw size={14} className="animate-spin text-warning" />
  } else if (status === 'offline') {
    badgeColor = 'border-danger/40 bg-danger/10 text-danger'
    label = pendingCount > 0 ? `Offline (${pendingCount} pendientes)` : 'Offline'
    icon = <CloudOff size={14} className="text-danger" />
  } else if (status === 'online' && pendingCount > 0) {
    badgeColor = 'border-warning/40 bg-warning/10 text-warning'
    label = `${pendingCount} pendientes`
    icon = <Cloud size={14} className="text-warning" />
  }

  const formattedTime = lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString() : 'Nunca'
  const tooltip = `Estado: ${status}\nÚltima sinc: ${formattedTime}${latencyMs ? ` (${latencyMs}ms)` : ''}${pendingCount > 0 ? `\nVentas pendientes: ${pendingCount}` : ''}`

  return (
    <div
      onClick={() => {
        if (handleRefresh) void handleRefresh()
      }}
      className={`btn-press flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${badgeColor}`}
      title={tooltip}
      data-testid="cloud-sync-badge"
    >
      {icon}
      <span>{label}</span>
    </div>
  )
}

export default CloudSyncBadge
