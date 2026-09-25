import { useState } from 'react'
import { Lock, KeyRound, Settings } from 'lucide-react'
import { api } from '../../api/client'

interface AdminLockScreenProps {
  storeId: string
  onUnlock: () => void
}

export function AdminLockScreen({ storeId, onUnlock }: AdminLockScreenProps) {
  const [password, setPassword] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  async function handleUnlock() {
    setChecking(true)
    setError('')
    try {
      await api.validateAdmin(storeId, password.trim())
      onUnlock()
    } catch (e: any) {
      setError(e.message || 'Contraseña incorrecta')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-4 flex items-center justify-center gap-2">
        <Settings size={18} className="text-accent" />
        <h2 className="text-lg font-semibold">Configuración</h2>
      </div>
      <div className="card-surface p-6 animate-in fade-in-0 zoom-in-95">
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-accent" />
          <h3 className="text-sm font-semibold">Acceso de administrador</h3>
        </div>
        <p className="mt-1 text-xs text-muted">
          Ingrese la contraseña de administrador para acceder a la configuración.
        </p>
        <input
          type="password"
          className="input-base mt-3 w-full font-mono"
          placeholder="Contraseña de administrador"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError('')
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
          autoFocus
          autoComplete="off"
        />
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <button
          className="btn-press mt-3 w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
          disabled={checking || !password.trim()}
          onClick={handleUnlock}
        >
          {checking ? 'Verificando…' : 'Entrar'}
        </button>
      </div>
    </div>
  )
}

interface AdminChangePasswordProps {
  storeId: string
  onMessage: (msg: string) => void
}

export function AdminChangePasswordSection({ storeId, onMessage }: AdminChangePasswordProps) {
  const [pwdCurrent, setPwdCurrent] = useState('')
  const [pwdNew, setPwdNew] = useState('')
  const [pwdConfirm, setPwdConfirm] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)

  async function saveAdminPassword() {
    setPwdSaving(true)
    try {
      if (pwdNew.trim().length < 4)
        throw new Error('La nueva contraseña debe tener al menos 4 caracteres')
      if (pwdNew !== pwdConfirm) throw new Error('Las contraseñas no coinciden')
      await api.updateAdminPassword(storeId, pwdCurrent, pwdNew.trim())
      setPwdCurrent('')
      setPwdNew('')
      setPwdConfirm('')
      onMessage('Contraseña de administrador actualizada.')
    } catch (e: any) {
      onMessage(e.message)
    } finally {
      setPwdSaving(false)
    }
  }

  return (
    <div className="card-surface p-6 animate-in fade-in-0 zoom-in-95">
      <div className="flex items-center gap-2">
        <KeyRound size={16} className="text-accent" />
        <h3 className="text-sm font-semibold">Cambiar contraseña de administrador</h3>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="label-base">Contraseña actual</label>
          <input
            type="password"
            className="input-base w-full font-mono"
            value={pwdCurrent}
            onChange={(e) => setPwdCurrent(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="label-base">Nueva contraseña</label>
          <input
            type="password"
            className="input-base w-full font-mono"
            value={pwdNew}
            onChange={(e) => setPwdNew(e.target.value)}
            placeholder="Mínimo 4 caracteres"
          />
        </div>
        <div>
          <label className="label-base">Confirmar nueva contraseña</label>
          <input
            type="password"
            className="input-base w-full font-mono"
            value={pwdConfirm}
            onChange={(e) => setPwdConfirm(e.target.value)}
            placeholder="Repetir contraseña"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          className="btn-press rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
          onClick={saveAdminPassword}
          disabled={pwdSaving || !pwdCurrent || !pwdNew || !pwdConfirm}
        >
          {pwdSaving ? 'Guardando…' : 'Actualizar contraseña'}
        </button>
      </div>
    </div>
  )
}
