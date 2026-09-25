import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import type { LoginResponse, StoreConfig, PaymentMethod } from './api/types'
import { getBackendUrl, setBackendUrl as persistBackendUrl, clearSessionToken } from './api/client'
import { getStoredTheme, applyTheme, getStoredAccent, applyAccent, Theme } from './theme'
import { setServerTimezone } from './lib/server-tz'
import type { PrintTicketInput } from './printing'
import { printSaleTicket } from './printing'
import { errMsg } from './lib/pos-logic'

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
  lastPrintedTicket: PrintTicketInput | null
  toast: string | null
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
  setLastPrintedTicket: (ticket: PrintTicketInput | null) => void
  showToast: (msg: string) => void
  hideToast: () => void
  reprintLastTicket: () => Promise<boolean>
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({
  children,
  initialSession
}: {
  children: ReactNode
  initialSession?: LoginResponse | null
}) {
  const [session, setSession] = useState<LoginResponse | null>(initialSession ?? null)
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

  // Envía el contexto de la sesión (tienda/POS) al proceso main para el
  // licenciamiento (se persiste y se usa en el próximo arranque).
  useEffect(() => {
    const sc = session?.storeConfig
    if (sc && window.api?.setLicenseContext) {
      window.api.setLicenseContext({
        storeId: sc.storeId ?? null,
        storeName: sc.storeName ?? sc.name ?? null,
        posNo: sc.posNumber ?? null,
        clientCode: sc.casaMatriz ?? null
      })
    }
  }, [session])

  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(msg)
    toastTimerRef.current = setTimeout(() => {
      setToast(null)
    }, 4000)
  }, [])

  const hideToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(null)
  }, [])

  const [lastPrintedTicket, setLastPrintedTicketState] = useState<PrintTicketInput | null>(() => {
    try {
      const saved = sessionStorage.getItem('last_printed_ticket')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const setLastPrintedTicket = useCallback((ticket: PrintTicketInput | null) => {
    setLastPrintedTicketState(ticket)
    try {
      if (ticket) {
        sessionStorage.setItem('last_printed_ticket', JSON.stringify(ticket))
      } else {
        sessionStorage.removeItem('last_printed_ticket')
      }
    } catch {
      // ignore storage serialization/quota issues
    }
  }, [])

  const reprintLastTicket = useCallback(async (): Promise<boolean> => {
    if (!lastPrintedTicket) {
      showToast('No hay comprobante previo disponible para reimprimir.')
      return false
    }
    try {
      await printSaleTicket({
        ...lastPrintedTicket,
        isReprint: true
      })
      showToast(`Comprobante ${lastPrintedTicket.result.invoiceNo} reimpreso con éxito.`)
      return true
    } catch (e: any) {
      showToast(`Error al reimprimir: ${errMsg(e)}`)
      return false
    }
  }, [lastPrintedTicket, showToast])

  const login = useCallback((s: LoginResponse) => {
    setServerTimezone(s.storeConfig?.serverTimezone)
    setSession(s)
  }, [])
  const logout = useCallback(() => {
    clearSessionToken()
    try {
      sessionStorage.removeItem('last_printed_ticket')
    } catch {}
    setLastPrintedTicketState(null)
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
        setPaymentMethods,
        lastPrintedTicket,
        toast,
        setLastPrintedTicket,
        showToast,
        hideToast,
        reprintLastTicket
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
