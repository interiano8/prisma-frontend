import type {
  CartItem,
  CreateInvoicePayload,
  Customer,
  Dispenser,
  InvoiceCreateResult,
  LoginResponse,
  MediaFile,
  PaymentMethod,
  Product
} from './types'

const STORAGE_KEY = 'prisma:backend-url'
const LEAL_TOKEN_KEY = 'prisma:leal-token'

export function getBackendUrl(): string {
  return localStorage.getItem(STORAGE_KEY) || 'http://localhost:5009'
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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${getBackendUrl()}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) }
  })
  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`
    try {
      const data = await res.json()
      if (data?.message) message = Array.isArray(data.message) ? data.message.join(', ') : data.message
    } catch {
      // ignore
    }
    throw new Error(message)
  }
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

export const api = {
  // Auth
  login: (body: { username: string; password: string; posNo: string; storeId: string }) =>
    request<LoginResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  loginRfid: (body: { rfidCode: string; posNo: string; storeId: string }) =>
    request<LoginResponse>('/api/auth/login-rfid', { method: 'POST', body: JSON.stringify(body) }),

  savePreferences: (username: string, preferences: { theme?: string; accent?: string }) =>
    request<{ success: boolean }>('/api/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify({ username, ...preferences })
    }),

  // Products
  products: (category?: string) =>
    request<Product[]>(`/api/products${category ? `?category=${encodeURIComponent(category)}` : ''}`),

  productByBarcode: (code: string) =>
    request<Product | null>(`/api/products/barcode/${encodeURIComponent(code)}`),

  productByCode: (code: string) =>
    request<Product | null>(`/api/products/${encodeURIComponent(code)}`),

  // Media
  mediaList: () => request<MediaFile[]>('/api/media/list'),

  mediaUrl: (url: string) => `${getBackendUrl()}${url}`,

  productDiscount: (code: string, customerCode: string) =>
    request<any>(`/api/products/${encodeURIComponent(code)}/discount?customerCode=${encodeURIComponent(customerCode)}`),

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

  creditNote: (body: { storeId: string; posNo: string; username: string; invoiceNo: string; transactionId: string; reason: string }) =>
    request<any>('/api/invoices/credit-note', { method: 'POST', body: JSON.stringify(body) }),

  searchInvoices: (params: Record<string, string>) =>
    request<any[]>(`/api/invoices/search?${new URLSearchParams(params)}`),

  searchInvoicesPaginated: (params: Record<string, string>) =>
    request<{ total: number; page: number; pageSize: number; data: any[] }>(`/api/invoices/search?${new URLSearchParams(params)}`),

  invoiceLines: (transactionId: string) => request<any[]>(`/api/invoices/${transactionId}/lines`),

  invoicePayments: (transactionId: string) => request<any[]>(`/api/invoices/${transactionId}/payments`),

  invoiceLealMessage: (transactionId: string) =>
    request<{ lealReprintMessage: string }>(`/api/invoices/${transactionId}/leal-message`),

  invoiceSorteos: (transactionId: string) =>
    request<any[]>(`/api/invoices/${transactionId}/sorteos`),

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
    }>(`/api/pos-config/${encodeURIComponent(posNo)}`),

  updatePosConfig: (
    posNo: string,
    body: {
      mostrarBombas?: boolean
      numTransaccionesBombas?: number
      minutosAtrasada?: number
      mostrarTeclado?: boolean
      declararMontosIniciales?: boolean
    }
  ) =>
    request<{
      mostrarBombas: boolean
      numTransaccionesBombas: number
      minutosAtrasada: number
      mostrarTeclado: boolean
      declararMontosIniciales: boolean
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
    })
}
