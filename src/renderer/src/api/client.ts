import type {
  CartItem,
  CreateInvoicePayload,
  Customer,
  Dispenser,
  InvoiceCreateResult,
  LoginResponse,
  MediaFile,
  PaymentMethod,
  Product,
  HealthCheckResult,
  ParkedSale,
  CreateParkedSalePayload,
  ProductStockCheck,
  NetworkStockResult
} from './types'

const STORAGE_KEY = 'prisma:backend-url'
const LEAL_TOKEN_KEY = 'prisma:leal-token'
const SESSION_TOKEN_KEY = 'prisma:session-token'

export function getBackendUrl(): string {
  return localStorage.getItem(STORAGE_KEY) || 'http://localhost:5012'
}

export function setBackendUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY, url.replace(/\/$/, ''))
}

export function getLealToken(): string {
  return localStorage.getItem(LEAL_TOKEN_KEY) || ''
}

export function setLealToken(token: string): void {
  if (token) localStorage.setItem(LEAL_TOKEN_KEY, token)
  else localStorage.removeItem(LEAL_TOKEN_KEY)
}

export function getSessionToken(): string {
  return localStorage.getItem(SESSION_TOKEN_KEY) || ''
}

export function setSessionToken(token: string): void {
  if (token) localStorage.setItem(SESSION_TOKEN_KEY, token)
  else localStorage.removeItem(SESSION_TOKEN_KEY)
}

export function clearSessionToken(): void {
  localStorage.removeItem(SESSION_TOKEN_KEY)
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const sessionToken = getSessionToken()
  const res = await fetch(`${getBackendUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      ...(options?.headers || {})
    }
  })
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`
    let details: unknown
    try {
      const data = await res.json()
      if (data?.message) message = Array.isArray(data.message) ? data.message.join(', ') : data.message
      details = data?.details
    } catch {
      // ignore
    }
    const err = new Error(message) as Error & { details?: unknown }
    if (details !== undefined) err.details = details
    throw err
  }
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

export const api = {
  // Auth
  login: (body: { username: string; password: string; posNo: string; storeId: string }) =>
    request<LoginResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }).then((res) => {
      setSessionToken(res.token)
      return res
    }),

  loginRfid: (body: { rfidCode: string; posNo: string; storeId: string }) =>
    request<LoginResponse>('/api/auth/login-rfid', { method: 'POST', body: JSON.stringify(body) }).then((res) => {
      setSessionToken(res.token)
      return res
    }),

  savePreferences: (username: string, preferences: { theme?: string; accent?: string }) =>
    request<{ success: boolean }>('/api/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify({ username, ...preferences })
    }),

  // Products
  products: (category?: string) =>
    request<Product[]>(`/api/products${category ? `?category=${encodeURIComponent(category)}` : ''}`),

  categories: () =>
    request<{ codigo: string; descripcion: string | null; count: number }[]>('/api/products/categories'),

  productByBarcode: (code: string) =>
    request<Product | null>(`/api/products/barcode/${encodeURIComponent(code)}`),

  productByCode: (code: string) =>
    request<Product | null>(`/api/products/${encodeURIComponent(code)}`),

  checkStock: (productCode: string) =>
    request<ProductStockCheck>(`/api/inventory/${encodeURIComponent(productCode)}/check`),

  networkStock: (productCode: string) =>
    request<NetworkStockResult>(`/api/inventory/${encodeURIComponent(productCode)}/network`),

  // Media
  mediaList: () => request<MediaFile[]>('/api/media/list'),

  mediaUrl: (url: string) => `${getBackendUrl()}${url}`,

  calculateDiscounts: (customerCode: string, items: { code: string; quantity: number; vatGroup: string; unitPrice: number }[]) =>
    request<any[]>('/api/products/calculate-discounts', {
      method: 'POST',
      body: JSON.stringify({ customerCode, items })
    }),

  // Customers
  searchCustomers: (q: string, creditOnly = false) =>
    request<Customer[]>(`/api/customers/search?q=${encodeURIComponent(q)}${creditOnly ? '&creditOnly=true' : ''}`),

  listCustomers: (creditOnly = false) =>
    request<Customer[]>(`/api/customers/search?creditOnly=${creditOnly}`),

  searchCustomersPaginated: (q: string, creditOnly = false, page = 1, pageSize = 30) =>
    request<{ total: number; page: number; pageSize: number; data: Customer[] }>(
      `/api/customers/search?q=${encodeURIComponent(q)}${creditOnly ? '&creditOnly=true' : ''}&page=${page}&pageSize=${pageSize}`
    ),

  listCustomersPaginated: (creditOnly = false, page = 1, pageSize = 30) =>
    request<{ total: number; page: number; pageSize: number; data: Customer[] }>(
      `/api/customers/search?creditOnly=${creditOnly}&page=${page}&pageSize=${pageSize}`
    ),

  consumidorFinal: () => request<Customer>('/api/customers/cf'),

  customerByCode: (code: string) =>
    request<Customer | null>(`/api/customers/by-code/${encodeURIComponent(code)}`),

  checkCustomerCredit: (code: string, amount?: number, storeId?: string) => {
    const params = new URLSearchParams()
    if (amount != null && amount > 0) params.set('amount', amount.toString())
    if (storeId) params.set('storeId', storeId)
    const qs = params.toString() ? `?${params.toString()}` : ''
    return request<{
      customerNo: string
      customerName: string
      creditLimit: number
      balance: number
      disponible: number
      isAllowed: boolean
      reason?: string
      source: 'ONLINE' | 'OFFLINE_FALLBACK'
      evaluatedAmount: number
    }>(`/api/customers/${encodeURIComponent(code)}/credit-check${qs}`)
  },

  createCustomer: (body: { rtn: string; name: string; code?: string; storeId?: string; allowDuplicateRtn?: boolean }) =>
    request<{ success: boolean; code: string; name: string; rtf: string; exists?: boolean; existingCustomer?: { code: string; name: string } | null }>('/api/customers/create', {
      method: 'POST',
      body: JSON.stringify(body)
    }),

  // Payments
  paymentMethods: () => request<PaymentMethod[]>('/api/payment/methods'),

  // Dispensers
  dispensers: () => request<Dispenser[]>('/api/dispensers/status'),

  hoses: () => request<any[]>('/api/dispensers/hoses'),

  pumpTransactions: (pumpId: number, limit?: number) =>
    request<any[]>(`/api/dispensers/transactions/${pumpId}${limit ? `?limit=${limit}` : ''}`),

  authorizePump: (body: { pumpId: number; limitAmount: number }) =>
    request<any>('/api/dispensers/authorize', { method: 'POST', body: JSON.stringify(body) }),

  // Shift
  getOpenShift: (storeId: string, posNo: string, employeeName: string) =>
    request<any>(`/api/shift/open?storeId=${encodeURIComponent(storeId)}&posNo=${encodeURIComponent(posNo)}&employeeName=${encodeURIComponent(employeeName)}`),

  employees: () =>
    request<{ usuario: string; nombre: string }[]>('/api/auth/employees'),

  openShift: (body: { storeId: string; posNo: string; employeeName: string; initialAmount: number; shiftNumber?: number }) =>
    request<any>('/api/shift/open', { method: 'POST', body: JSON.stringify(body) }),

  closeShift: (body: { storeId: string; posNo: string; employeeName: string; actualAmount: number }) =>
    request<any>('/api/shift/close', { method: 'POST', body: JSON.stringify(body) }),

  salesReport: (params: Record<string, string>) =>
    request<any>(`/api/shift/sales-report?${new URLSearchParams(params)}`),

  availableShifts: (storeId: string, posCode: string, fechaTurno: string) =>
    request<any[]>(`/api/shift/available?storeId=${encodeURIComponent(storeId)}&posCode=${encodeURIComponent(posCode)}&fechaTurno=${encodeURIComponent(fechaTurno)}`),

  // Invoices
  createInvoice: (body: CreateInvoicePayload) =>
    request<InvoiceCreateResult>('/api/invoices/create', { method: 'POST', body: JSON.stringify(body) }),

  creditNote: (body: { storeId: string; posNo: string; username: string; invoiceNo: string; transactionId: string; reason: string; adminPassword: string }) =>
    request<any>('/api/invoices/credit-note', { method: 'POST', body: JSON.stringify(body) }),

  reclassifySale: (
    saleId: string,
    body: {
      storeId: string;
      posNo: string;
      adminPin: string;
      supervisorUser?: string;
      requestedByUser: string;
      motivo: string;
      nuevoMetodoPago?: {
        codigoMetodoPago: string;
        descripcion?: string;
        referencia?: string;
      };
      nuevoCliente?: {
        codigo: string;
        nombre: string;
        rtn?: string;
      };
    },
  ) =>
    request<{
      success: boolean;
      ventaId: string;
      turnoId: string;
      versionTurno: number;
      mensaje: string;
      totalesTurnoActualizados: any;
    }>(`/api/invoices/${encodeURIComponent(saleId)}/reclassify`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  shiftReclassifications: (shiftId: string) =>
    request<any[]>(`/api/shift/${encodeURIComponent(shiftId)}/reclassifications`),

  searchInvoices: (params: Record<string, string>) =>
    request<any[]>(`/api/invoices/search?${new URLSearchParams(params)}`),

  searchInvoicesPaginated: (params: Record<string, string>) =>
    request<{ total: number; page: number; pageSize: number; data: any[] }>(`/api/invoices/search?${new URLSearchParams(params)}`),

  // Parked Sales (Ventas Aparcadas)
  parkSale: (body: CreateParkedSalePayload) =>
    request<ParkedSale>('/api/parked-sales', { method: 'POST', body: JSON.stringify(body) }),

  listParkedSales: (storeId: string) =>
    request<ParkedSale[]>(`/api/parked-sales?storeId=${encodeURIComponent(storeId)}`),

  resumeParkedSale: (id: string) =>
    request<ParkedSale>(`/api/parked-sales/${encodeURIComponent(id)}/resume`, { method: 'POST' }),

  discardParkedSale: (id: string) =>
    request<ParkedSale>(`/api/parked-sales/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  invoiceLines: (transactionId: string) => request<any[]>(`/api/invoices/${transactionId}/lines`),

  invoicePayments: (transactionId: string) => request<any[]>(`/api/invoices/${transactionId}/payments`),

  invoiceLealMessage: (transactionId: string) =>
    request<{ lealReprintMessage: string }>(`/api/invoices/${transactionId}/leal-message`),

  invoiceCampanas: (transactionId: string) =>
    request<any[]>(`/api/invoices/${transactionId}/campanas`),

  campanas: () => request<any[]>('/api/campanas'),

  createCampana: (body: any) =>
    request<any>('/api/campanas', { method: 'POST', body: JSON.stringify(body) }),

  updateCampana: (id: number, body: any) =>
    request<any>(`/api/campanas/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  deleteCampana: (id: number) =>
    request<any>(`/api/campanas/${id}`, { method: 'DELETE' }),

  createCondicion: (campanaId: number, body: any) =>
    request<any>(`/api/campanas/${campanaId}/condiciones`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateCondicion: (cid: number, body: any) =>
    request<any>(`/api/campanas/condiciones/${cid}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteCondicion: (cid: number) =>
    request<any>(`/api/campanas/condiciones/${cid}`, { method: 'DELETE' }),

  verificarTicket: (correlativo: string) =>
    request<{ valido: boolean; ticket: any }>(
      `/api/campanas/tickets/${encodeURIComponent(correlativo)}`
    ),

  getPendingSales: () => request<any[]>('/api/dispensers/pending'),

  tasaCambioLatest: () => request<{ tasa: number }>('/api/tasas-cambio/latest'),

  series: (storeId?: string, posNo?: string) =>
    request<any[]>(
      `/api/series?${new URLSearchParams(
        storeId ? { storeId } : {},
      )}${posNo ? `&posNo=${encodeURIComponent(posNo)}` : ''}`
    ),

  createSerie: (body: any) =>
    request<any>('/api/series', { method: 'POST', body: JSON.stringify(body) }),

  updateSerie: (nl: number, serie: string, body: any) =>
    request<any>(`/api/series/${nl}/${encodeURIComponent(serie)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  closeSerie: (nl: number, serie: string) =>
    request<any>(`/api/series/${nl}/${encodeURIComponent(serie)}`, {
      method: 'DELETE',
    }),

  setSerieEditing: (nl: number, serie: string, editing: boolean) =>
    request<any>(`/api/series/editing/${nl}/${encodeURIComponent(serie)}`, {
      method: 'PUT',
      body: JSON.stringify({ editing }),
    }),

  createPendingTicket: (body: any) =>
    request<any>('/api/invoices/pending-sale-ticket', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  validateCorrelative: (storeId: string, posNo: string, isTicket: boolean) =>
    request<{ isValid: boolean; message: string }>(
      `/api/invoices/validate-correlative?storeId=${encodeURIComponent(storeId)}&posNo=${encodeURIComponent(posNo)}&isTicket=${isTicket}`
    ),

  reasons: () => request<any[]>('/api/invoices/reasons'),

  // Printer config
  savePrinterConfig: (posNo: string, printerConfig: any) =>
    request<any>('/api/printer/config', { method: 'POST', body: JSON.stringify({ posNo, printerConfig }) }),

  // POS config
  getPosConfig: (posNo: string) =>
    request<{
      mostrarBombas: boolean
      numTransaccionesBombas: number
      minutosAtrasada: number
      mostrarTeclado: boolean
      declararMontosIniciales: boolean
      visualizacion: string
      caras?: number[]
    }>(`/api/pos-config/${encodeURIComponent(posNo)}`),

  updatePosConfig: (
    posNo: string,
    body: {
      mostrarBombas?: boolean
      numTransaccionesBombas?: number
      minutosAtrasada?: number
      mostrarTeclado?: boolean
      declararMontosIniciales?: boolean
      visualizacion?: string
      caras?: number[]
    }
  ) =>
    request<{
      mostrarBombas: boolean
      numTransaccionesBombas: number
      minutosAtrasada: number
      mostrarTeclado: boolean
      declararMontosIniciales: boolean
      visualizacion: string
    }>(`/api/pos-config/${encodeURIComponent(posNo)}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    }),

  // Store config
  updateStoreConfig: (storeId: string, body: { moneda?: string; carpetaMultimedia?: string }) =>
    request<{ storeId: string; moneda: string }>(`/api/store-config/${encodeURIComponent(storeId)}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    }),

  // Leal
  lealStatus: () => request<any>('/api/leal/status'),

  lealCredentials: () => request<any>('/api/leal/credentials'),

  lealUpdateCredentials: (user: string, pass: string) =>
    request<{ success: boolean }>('/api/leal/credentials', {
      method: 'PUT',
      body: JSON.stringify({ user, pass })
    }),

  lealLogin: (body: { username?: string; password?: string; storeId?: string }) =>
    request<any>('/api/leal/login', { method: 'POST', body: JSON.stringify(body) }),

  lealSearchCustomer: (q: string, soloCedula = 's') =>
    request<{ data: any[] }>(
      `/api/leal/customers/search?q=${encodeURIComponent(q)}&soloCedula=${soloCedula}`,
      { headers: { Authorization: `Bearer ${getLealToken()}` } }
    ),

  lealCustomer: (uid: string) =>
    request<{ data: any }>(`/api/leal/customers/${encodeURIComponent(uid)}`, {
      headers: { Authorization: `Bearer ${getLealToken()}` }
    }),

  lealPremios: (uid: string) =>
    request<{ data: any[] }>(`/api/leal/customers/${encodeURIComponent(uid)}/premios`, {
      headers: { Authorization: `Bearer ${getLealToken()}` }
    }),

  lealAccumulate: (body: { uid: string; factura: string; total: number }) =>
    request<any>('/api/leal/accumulate', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${getLealToken()}` }
    }),

  lealRedeem: (body: {
    uid: string
    puntos: number
    factura: string
    idPremio?: number
    otp?: string
    pin?: string
    nota?: string
  }) =>
    request<any>('/api/leal/redeem', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${getLealToken()}` }
    }),

  lealGenerateOtp: (body: { uid: string; idPremio: number }) =>
    request<any>('/api/leal/otp/generate', { method: 'POST', body: JSON.stringify(body) }),

  lealRegisterCustomer: (body: { documentId: string; name: string; email?: string; phone?: string }) =>
    request<any>('/api/leal/customers/register', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${getLealToken()}` }
    }),

  // Admin
  validateAdmin: (storeId: string, password: string) =>
    request<{ valid: boolean }>('/api/auth/validate-admin', {
      method: 'POST',
      body: JSON.stringify({ storeId, password })
    }),

  updateAdminPassword: (storeId: string, currentPassword: string, newPassword: string) =>
    request<{ ok: boolean }>('/api/auth/admin-password', {
      method: 'PUT',
      body: JSON.stringify({ storeId, currentPassword, newPassword })
    }),

  // Health & Cloud Sync
  health: () => request<HealthCheckResult>('/api/health'),
  syncNow: () =>
    request<{ success: boolean; salesSynced: number; mastersUpdated: boolean; error?: string }>('/api/health/sync-now', {
      method: 'POST'
    })
}
