export interface User {
  id: number
  username: string
  name: string
  profile: string
  isActive: boolean
  pinLeal?: string
  isPinLealEnabled?: boolean
  preferencias?: { theme?: string; accent?: string } | null
  roles?: string[]
  permissions?: string[]
}

export interface StoreConfig {
  storeId: string
  storeName: string
  posNumber: string
  rtn: string
  phone: string
  email: string
address: string
  address1?: string
  address2?: string
  address3?: string
  rtf?: string
  noConsumidorFinal?: string
  casaMatriz?: string
  nombreBotonFidelizacion?: string
  moneda?: string
  printerConfig?: any
  mostrarBombas?: boolean
  ocultarBotonOtrasBombas?: boolean
  numTransaccionesBombas?: number
  minutosAtrasada?: number
  urlControlador?: string
  claveControlador?: string
  mostrarTeclado?: boolean
  declararMontosIniciales?: boolean
  carpetaMultimedia?: string
  caras?: number[]
  [key: string]: any
}

export interface ShiftInfo {
  Shift: string | null
  'POS Transaction ID'?: string
  'Shift Starting'?: string
  EmployeeName?: string
  Message?: string
}

export interface LoginResponse {
  user: User
  token: string
  storeConfig: StoreConfig
  shiftInfo: ShiftInfo
}

export interface Product {
  code: string
  description: string
  unitPrice: number
  category: string
  vatGroup: string
  priceIncludesVat: boolean
  blocked?: boolean
  codigosBarras?: string[]
  unidadMedida?: string
  codigoMoneda?: string
  simboloMoneda?: string
}

export interface MediaFile {
  name: string
  type: 'image' | 'video'
  url: string
}

export interface Customer {
  code: string
  name: string
  rtf: string
  phone: string
  email: string
  address: string
  blocked?: boolean
  billingType?: number
}

export interface PaymentMethod {
  code: string
  description: string
  categoria: string
  moneda: string
  generaCambio: boolean
  facturaContado: boolean
  facturaCredito: boolean
  salidaCombustible: boolean
  fidelizacion: boolean
  requiereReferencia: boolean
  imagen: string | null
  activo: boolean
}

export type DispenserState =
  | 'idle'
  | 'colgada'
  | 'fuelling'
  | 'starting'
  | 'espera'
  | 'pausa'
  | 'error'

export interface Dispenser {
  pumpId: number
  state: DispenserState
  productName: string
  gallons: number
  amount: number
  unitPrice: number
  limitAmount: number | null
  saleId?: number | null
  pos?: string | null
}

export interface PumpTransaction {
  saleId: number
  posNumber: number
  pumpNumber: number
  hoseNumber: string
  grade: string
  combustible: string
  codigo: string
  unidad: string
  precio: number
  cantidad: number
  estado: string
  amount: number
  ciclo: string
  date: string
  fecha: string
  hora: string
  despachador: string
  shiftId?: number | null
}

export interface CartItem {
  code: string
  description: string
  qty: number
  price: number
  tax: number
  discount: number
  total: number
  vatGroup: string
  saleId?: number
  pumpNumber?: number
  discountPercentage?: number
  uid?: string
  hoseNumber?: string
  unidad?: string
  fechaHora?: string
  combustible?: string
}

export interface CartPayment {
  method: string
  code: string
  amount: number | string
  reference?: string
  requiereReferencia?: boolean
  moneda?: string
  tasaCambio?: number
  montoIngresado?: number
  generaCambio?: boolean
  lealData?: any
}

export interface CreateInvoicePayload {
  storeId: string
  posNo: string
  shiftNumber: string
  customerNo: string
  customerName: string
  customerRtn?: string
  employeeName?: string
  items: CartItem[]
  payments: CartPayment[]
  total: number
  tax: number
  discount: number
  isTicket?: boolean
  isCredit?: boolean
  comment?: string
  km?: string
  orden?: string
  placa?: string
  chofer?: string
  lealCustomerUid?: string
  lealCustomerName?: string
  lealCustomerDni?: string
  lealIdAleatorioAcum?: string
  lealIdAleatorioRed?: string
  lealPin?: string
  permitirFacturarSinAcumular?: boolean
  omitirAcumulacion?: boolean
}

export interface InvoiceCreateResult {
  success: boolean
  invoiceNo: string
  posTransactionId?: string | null
  cai?: string | null
  startingNo?: string | null
  endingNo?: string | null
  fechaVence?: string | null
  createdAt: string
  campanaTickets?: any[]
  lealReprintMessage?: string
  seriesRemaining?: number
  seriesRemainingDays?: number
}

export interface ComponentHealth {
  status: 'up' | 'down' | 'degraded' | 'not_configured' | 'bypassed' | 'active' | 'unlicensed'
  latencyMs?: number
  url?: string
  error?: string
  details?: Record<string, unknown>
}

export interface SystemMetrics {
  uptimeSeconds: number
  memoryRssMb: number
  memoryHeapUsedMb: number
  timestamp: string
}

export interface HealthCloudSync {
  status: 'online' | 'offline' | 'syncing' | 'not_configured'
  pendingCount: number
  lastSyncAt: string | null
  latencyMs?: number | null
  error?: string | null
}

export interface HealthCheckResult {
  status: 'ok' | 'degraded' | 'error'
  database: ComponentHealth
  controller: ComponentHealth
  licensing: ComponentHealth
  system: SystemMetrics
  cloudSync?: HealthCloudSync
}

