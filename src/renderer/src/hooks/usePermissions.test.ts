import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePermissions } from './usePermissions'
import { useApp } from '../store'

vi.mock('../store', () => ({
  useApp: vi.fn()
}))

describe('usePermissions (prisma-frontend)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('retorna can=false y colecciones vacías si no hay sesión activa', () => {
    vi.mocked(useApp).mockReturnValue({ session: null } as any)

    const { result } = renderHook(() => usePermissions())

    expect(result.current.user).toBeUndefined()
    expect(result.current.roles).toEqual([])
    expect(result.current.permissions).toEqual([])
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.can('sales:create')).toBe(false)
    expect(result.current.canAll('sales:create', 'sales:cancel')).toBe(false)
    expect(result.current.canAny('sales:create', 'sales:cancel')).toBe(false)
    expect(result.current.hasRole('CAJERO')).toBe(false)
  })

  it('evalúa permisos explícitos en user.permissions para usuario estándar', () => {
    vi.mocked(useApp).mockReturnValue({
      session: {
        user: {
          id: 1,
          username: 'cajero1',
          name: 'Cajero Uno',
          profile: 'CAJERO',
          roles: ['CAJERO'],
          permissions: ['sales:create', 'sales:reprint']
        }
      }
    } as any)

    const { result } = renderHook(() => usePermissions())

    expect(result.current.roles).toEqual(['CAJERO'])
    expect(result.current.permissions).toEqual(['sales:create', 'sales:reprint'])
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.can('sales:create')).toBe(true)
    expect(result.current.can('sales:reprint')).toBe(true)
    expect(result.current.can('sales:cancel')).toBe(false) // Acción crítica oculta
    expect(result.current.can('stores:manage')).toBe(false)
    expect(result.current.canAll('sales:create', 'sales:reprint')).toBe(true)
    expect(result.current.canAll('sales:create', 'sales:cancel')).toBe(false)
    expect(result.current.canAny('sales:cancel', 'sales:reprint')).toBe(true)
    expect(result.current.hasRole('CAJERO')).toBe(true)
    expect(result.current.hasRole('ADMIN')).toBe(false)
  })

  it('otorga bypass irrestricto si el usuario tiene rol o perfil ADMIN / SUPER_ADMIN', () => {
    vi.mocked(useApp).mockReturnValue({
      session: {
        user: {
          id: 99,
          username: 'admin',
          name: 'Administrador Estación',
          profile: 'ADMIN',
          roles: ['ADMIN'],
          permissions: [] // Sin lista explícita, bypass por rol
        }
      }
    } as any)

    const { result } = renderHook(() => usePermissions())

    expect(result.current.isAdmin).toBe(true)
    expect(result.current.can('sales:cancel')).toBe(true)
    expect(result.current.can('stores:manage')).toBe(true)
    expect(result.current.can('pumps:control')).toBe(true)
    expect(result.current.canAll('sales:cancel', 'stores:manage')).toBe(true)
    expect(result.current.hasRole('ADMIN')).toBe(true)
  })

  it('combina permisos múltiples cuando el usuario posee roles combinados (CAJERO + SUPERVISOR)', () => {
    vi.mocked(useApp).mockReturnValue({
      session: {
        user: {
          id: 5,
          username: 'combo',
          name: 'Supervisor de Pista',
          profile: 'CAJERO',
          roles: ['CAJERO', 'SUPERVISOR'],
          permissions: ['sales:create', 'sales:reprint', 'sales:cancel', 'shifts:reconcile']
        }
      }
    } as any)

    const { result } = renderHook(() => usePermissions())

    expect(result.current.roles).toEqual(['CAJERO', 'SUPERVISOR'])
    expect(result.current.hasRole('CAJERO')).toBe(true)
    expect(result.current.hasRole('SUPERVISOR')).toBe(true)
    expect(result.current.can('sales:cancel')).toBe(true)
    expect(result.current.can('shifts:reconcile')).toBe(true)
    expect(result.current.can('stores:manage')).toBe(false)
  })

  it('infiere permisos predeterminados si user.permissions no está presente (retrocompatibilidad)', () => {
    vi.mocked(useApp).mockReturnValue({
      session: {
        user: {
          id: 2,
          username: 'legacy_cashier',
          name: 'Cajero Legacy',
          profile: 'cajero'
        }
      }
    } as any)

    const { result } = renderHook(() => usePermissions())

    expect(result.current.roles).toEqual(['CAJERO'])
    expect(result.current.can('sales:create')).toBe(true)
    expect(result.current.can('shifts:open')).toBe(true)
    expect(result.current.can('sales:cancel')).toBe(false)
  })
})
