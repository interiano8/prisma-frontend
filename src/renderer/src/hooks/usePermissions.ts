import { useApp } from '../store'

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    'sales:create',
    'sales:cancel',
    'sales:reprint',
    'discounts:apply',
    'shifts:open',
    'shifts:close',
    'shifts:reconcile',
    'shifts:view',
    'pumps:control',
    'prices:schedule',
    'prices:override',
    'products:manage',
    'discounts:manage',
    'customers:manage',
    'customers:credit',
    'stores:manage',
    'sync:trigger',
    'users:manage',
    'roles:manage',
    'audit:view',
    'reports:view',
    'reports:financial'
  ],
  ADMIN: [
    'sales:create',
    'sales:cancel',
    'sales:reprint',
    'discounts:apply',
    'shifts:open',
    'shifts:close',
    'shifts:reconcile',
    'shifts:view',
    'pumps:control',
    'prices:schedule',
    'prices:override',
    'products:manage',
    'discounts:manage',
    'customers:manage',
    'customers:credit',
    'stores:manage',
    'sync:trigger',
    'users:manage',
    'roles:manage',
    'audit:view',
    'reports:view',
    'reports:financial'
  ],
  SUPERVISOR: [
    'sales:create',
    'sales:cancel',
    'sales:reprint',
    'discounts:apply',
    'shifts:open',
    'shifts:close',
    'shifts:reconcile',
    'shifts:view',
    'pumps:control',
    'prices:schedule',
    'products:manage',
    'customers:manage',
    'reports:view',
    'sync:trigger'
  ],
  CAJERO: [
    'sales:create',
    'sales:reprint',
    'discounts:apply',
    'shifts:open',
    'shifts:close',
    'customers:manage',
    'shifts:view'
  ],
  BOMBERO: [
    'sales:create',
    'sales:reprint',
    'pumps:control',
    'shifts:open',
    'shifts:close'
  ],
  AUDITOR: [
    'reports:view',
    'reports:financial',
    'shifts:view',
    'audit:view'
  ],
  GESTOR_COMERCIAL: [
    'prices:schedule',
    'products:manage',
    'discounts:manage',
    'customers:manage',
    'customers:credit',
    'reports:view'
  ]
}

export function usePermissions() {
  const { session } = useApp()
  const user = session?.user

  // Roles normalizados
  const rawRoles =
    user?.roles && user.roles.length > 0
      ? user.roles
      : user?.profile
        ? [user.profile]
        : []

  const roles = rawRoles.map((r) => r.toUpperCase().trim())

  const isAdmin =
    roles.includes('ADMIN') ||
    roles.includes('SUPER_ADMIN') ||
    Boolean(user?.profile && user.profile.toUpperCase().includes('ADMIN'))

  // Permisos efectivos: si vienen en user.permissions se usan directamente;
  // de lo contrario, se infieren de los roles para compatibilidad con tests y sesiones previas.
  let effectivePermissions: string[] = []
  if (Array.isArray(user?.permissions)) {
    effectivePermissions = user.permissions
  } else {
    const derived = new Set<string>()
    for (const r of roles) {
      const perms = ROLE_PERMISSIONS[r] || []
      for (const p of perms) derived.add(p)
    }
    effectivePermissions = Array.from(derived)
  }

  const can = (permission: string): boolean => {
    if (!user) return false
    if (isAdmin) return true
    return effectivePermissions.includes(permission)
  }

  const canAll = (...requiredPermissions: string[]): boolean => {
    if (!user) return false
    if (isAdmin) return true
    return requiredPermissions.every((p) => effectivePermissions.includes(p))
  }

  const canAny = (...requiredPermissions: string[]): boolean => {
    if (!user) return false
    if (isAdmin) return true
    return requiredPermissions.some((p) => effectivePermissions.includes(p))
  }

  const hasRole = (role: string): boolean => {
    if (!user) return false
    return roles.includes(role.toUpperCase().trim())
  }

  return {
    user,
    roles,
    permissions: effectivePermissions,
    isAdmin,
    can,
    canAll,
    canAny,
    hasRole
  }
}
