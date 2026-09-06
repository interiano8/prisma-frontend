import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'
import type { LoginResponse, StoreConfig, PaymentMethod } from './api/types'
import { getBackendUrl, setBackendUrl as persistBackendUrl, clearSessionToken } from './api/client'
import { getStoredTheme, applyTheme, getStoredAccent, applyAccent, Theme } from './theme'
import { setServerTimezone } from './lib/server-tz'

export type View =
  | 'pos'
  | 'customers'
  | 'shift'
  | 'documents'
  | 'config'
  | 'leal'
  | 'pendientes'

interface AppState {
  session: LoginResponse | null
  backendUrl: string
  view: View
  theme: Theme
  accent: string
  paymentMethods: PaymentMethod[]
  login: (s: LoginResponse) => void
  logout: () => void
  setBackendUrl: (url: string) => void
  setView: (v: View) => void
  setShiftInfo: (shiftInfo: LoginResponse['shiftInfo']) => void
  updateStoreConfig: (partial: Partial<StoreConfig>) => void
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  setAccent: (color: string) => void
  setPaymentMethods: (methods: PaymentMethod[]) => void
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<LoginResponse | null>(null)
  const [backendUrl, setBackendUrlState] = useState<string>(getBackendUrl())
  const [view, setView] = useState<View>('pos')
  const [theme, setTheme] = useState<Theme>(getStoredTheme())
  const [accent, setAccentColor] = useState<string>(getStoredAccent())
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    applyAccent(accent)
  }, [accent])

  const login = useCallback((s: LoginResponse) => {
    setServerTimezone(s.storeConfig?.serverTimezone)
    setSession(s)
  }, [])
  const logout = useCallback(() => {
    clearSessionToken()
    setSession(null)
  }, [])
  const setBackendUrl = useCallback((url: string) => {
    persistBackendUrl(url)
    setBackendUrlState(url)
  }, [])
  const setShiftInfo = useCallback((shiftInfo: LoginResponse['shiftInfo']) => {
    setSession((prev) => (prev ? { ...prev, shiftInfo } : prev))
  }, [])
  const updateStoreConfig = useCallback((partial: Partial<StoreConfig>) => {
    setSession((prev) => (prev ? { ...prev, storeConfig: { ...prev.storeConfig, ...partial } } : prev))
  }, [])
  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])
  const setThemeValue = useCallback((t: Theme) => {
    setTheme(t)
  }, [])
  const setAccent = useCallback((color: string) => {
    setAccentColor(color)
  }, [])

  return (
    <AppContext.Provider
      value={{
        session,
        backendUrl,
        view,
        theme,
        accent,
        login,
        logout,
        setBackendUrl,
        setView,
        setShiftInfo,
        updateStoreConfig,
        toggleTheme,
        setTheme: setThemeValue,
        setAccent,
        paymentMethods,
        setPaymentMethods
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
