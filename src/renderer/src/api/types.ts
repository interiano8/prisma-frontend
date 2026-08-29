export interface User {
  id: number
  username: string
  name: string
  profile: string
  isActive: boolean
  pinLeal?: string
  isPinLealEnabled?: boolean
  preferencias?: { theme?: string; accent?: string } | null
}

export interface StoreConfig {
  storeId: string
  storeName: string
  posNumber: string
  rtn: string
  phone: string
  email: string
  address: string
  urlLeal: string
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
  mostrarTeclado?: boolean
  declararMontosIniciales?: boolean
  carpetaMultimedia?: string
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
  facturaContado: boolean
  facturaCredito: boolean
  salidaCombustible: boolean
  fidelizacion: boolean
  requiereReferencia: boolean
  imagen: string | null
  activo: boolean
}

export interface Dispenser {
  pumpId: number
  state: string
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
  sorteoTickets?: any[]
  lealReprintMessage?: string
}
