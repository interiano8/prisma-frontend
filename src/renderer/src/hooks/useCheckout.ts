import { useRef, useState, useEffect } from 'react'
import type {
  CartItem,
  CartPayment,
  Customer,
  LoginResponse,
  PaymentMethod,
  StoreConfig
} from '../api/types'
import { calcularCreditoDisponible, errMsg, round2 } from '../lib/pos-logic'
import { computePaidChange, Totals } from '../lib/pos-cart'
import type { PrintTicketInput } from '../printing'
import { api } from '../api/client'

export type CustomerMode = 'none' | 'cf' | 'rtn' | 'credito' | 'fidelizacion'

export interface AlertModalState {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  secondaryText?: string
  onConfirm?: () => void
  onCancel?: () => void
  onSecondary?: () => void
}

export interface UseCheckoutOptions {
  store: StoreConfig
  session: LoginResponse
  effectiveCart: CartItem[]
  totals: Totals
  hasShift: boolean
  customer: Customer | null
  onCustomerChange: (c: Customer | null) => void
  onSaleComplete: (invoiceNo: string, change: number) => void
  onTicketPrinted?: (ticket: PrintTicketInput) => void
  setMessage: (m: string) => void
  printTicket: (input: PrintTicketInput) => Promise<void>
}

export function useCheckout(opts: UseCheckoutOptions) {
  const [customerQuery, setCustomerQuery] = useState('')
  const [customerResults, setCustomerResults] = useState<Customer[]>([])

  const [payments, setPayments] = useState<CartPayment[]>([])
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [tasaCambio, setTasaCambio] = useState(1)
  const [busy, setBusy] = useState(false)
  const amountInputsRef = useRef<(HTMLInputElement | null)[]>([])
  const [billingType, setBillingType] = useState<'contado' | 'credito'>(
    opts.customer?.billingType === 0 ? 'credito' : 'contado'
  )
  const [creditValidationSource, setCreditValidationSource] = useState<
    'ONLINE' | 'OFFLINE_FALLBACK' | null
  >(null)
  const [supervisorPin, setSupervisorPin] = useState('')
  const [esTicket, setEsTicket] = useState(false)

  useEffect(() => {
    api
      .tasaCambioLatest()
      .then((r) => {
        if (r && r.tasa > 0) setTasaCambio(Number(r.tasa))
      })
      .catch(() => {})
  }, [])
  const [customerMode, setCustomerMode] = useState<CustomerMode>('none')
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [isFidelizacion, setIsFidelizacion] = useState(false)

  const [orden, setOrden] = useState('')
  const [kmValue, setKmValue] = useState('')
  const [kmUnit, setKmUnit] = useState<'KM' | 'MI'>('KM')
  const [chofer, setChofer] = useState('')
  const [comment, setComment] = useState('')

  const [createCustomerOpen, setCreateCustomerOpen] = useState(false)
  const [alertModal, setAlertModal] = useState<AlertModalState | null>(null)
  const closeAlertModal = () => setAlertModal(null)
  const [formRtn, setFormRtn] = useState('')
  const [formName, setFormName] = useState('')
  const [creating, setCreating] = useState(false)
  const [pendingDuplicate, setPendingDuplicate] = useState<{
    rtn: string
    name: string
    existingName: string
  } | null>(null)

  const { paid, change } = computePaidChange(payments, opts.totals.total)

  async function searchCustomers(q: string, creditOnlyOverride?: boolean) {
    setCustomerQuery(q)
    const isCred = creditOnlyOverride !== undefined ? creditOnlyOverride : (customerMode === 'credito')
    const res = await api.searchCustomers(q, isCred)
    // query vacía → "Recientes" (el backend ordena por fechaActualizacion DESC)
    setCustomerResults(q ? (res ?? []) : (res ?? []).slice(0, 10))
  }

  function openCustomerMode(mode: 'rtn' | 'credito' | 'fidelizacion') {
    setCustomerMode(mode)
    setBillingType(mode === 'credito' ? 'credito' : 'contado')
    setCustomerQuery('')
    setCustomerResults([])
    setCustomerModalOpen(true)
    void searchCustomers('', mode === 'credito')
  }

  function selectCustomer(c: Customer) {
    if (c.blocked) {
      opts.setMessage(`❌ El cliente ${c.name || c.code} está bloqueado en Casa Matriz y no puede facturar.`)
      return
    }
    if (!c.rtf) {
      opts.setMessage(`El cliente ${c.name} no tiene RTN y no puede facturar.`)
      return
    }
    const mode = customerMode
    const isCred = mode === 'credito' || c.billingType === 0
    opts.onCustomerChange(c)
    setBillingType(isCred ? 'credito' : 'contado')
    setCreditValidationSource(null)
    setSupervisorPin('')
    if (isCred) {
      setPayments([])
    }
    setIsFidelizacion(mode === 'fidelizacion')
    setCustomerQuery('')
    setCustomerResults([])
    setCustomerModalOpen(false)
    setCustomerMode('none')
  }

  function closeCustomerModal() {
    setCustomerModalOpen(false)
    setCustomerMode('none')
    setCustomerQuery('')
    setCustomerResults([])
  }

  async function createCustomer(force = false) {
    setCreating(true)
    opts.setMessage('')
    try {
      const res = await api.createCustomer({
        rtn: formRtn.trim(),
        name: formName.trim(),
        storeId: opts.store.storeId,
        allowDuplicateRtn: force
      })
      if (!res.success && res.exists) {
        setPendingDuplicate({
          rtn: formRtn.trim(),
          name: formName.trim(),
          existingName: res.existingCustomer?.name || ''
        })
        return
      }
      opts.onCustomerChange({
        code: res.code,
        name: res.name,
        rtf: res.rtf,
        phone: '',
        email: '',
        address: ''
      })
      setBillingType('contado')
      setIsFidelizacion(false)
      setCustomerMode('none')
      setCustomerQuery('')
      setCustomerResults([])
      setCustomerModalOpen(false)
      setCreateCustomerOpen(false)
      setFormRtn('')
      setFormName('')
      opts.setMessage(`Cliente creado: ${res.name} (${res.code})`)
    } catch (e: any) {
      opts.setMessage(errMsg(e))
    } finally {
      setCreating(false)
    }
  }

  async function setConsumidorFinal() {
    try {
      const res = await api.consumidorFinal()
      opts.onCustomerChange({
        code: res.code,
        name: res.name || 'CONSUMIDOR FINAL',
        rtf: res.rtf || '',
        phone: res.phone || '',
        email: res.email || '',
        address: res.address || ''
      })
      setBillingType('contado')
      setIsFidelizacion(false)
      setCustomerMode('none')
      setCustomerModalOpen(false)
      setCustomerQuery('')
      setCustomerResults([])
    } catch (e: any) {
      opts.setMessage(errMsg(e))
    }
  }

  function addPayment(method: PaymentMethod) {
    if (billingType === 'credito') {
      const isCreditoMethod =
        method.code?.toUpperCase() === 'CREDITO' ||
        method.categoria?.toUpperCase() === 'CREDITO' ||
        method.description?.toLowerCase().includes('crédito') ||
        method.description?.toLowerCase().includes('credito')

      if (!isCreditoMethod) {
        opts.setMessage('En ventas al crédito solo se permite la forma de pago Crédito.')
        return
      }
      if (payments.length >= 1) {
        opts.setMessage('En ventas al crédito solo se permite un único pago al 100% Crédito.')
        return
      }
    }
    const remaining = Math.max(0, round2(opts.totals.total - paid))
    if (remaining <= 0) {
      opts.setMessage('El total ya está cubierto.')
      return
    }
    const esUsd = method.moneda === 'USD'
    const initial = esUsd
      ? (remaining / (tasaCambio || 1)).toFixed(2)
      : remaining.toFixed(2)
    setPayments((prev) => [
      ...prev,
      {
        method: method.description,
        code: method.code,
        amount: initial,
        reference: '',
        requiereReferencia: method.requiereReferencia,
        moneda: esUsd ? 'USD' : undefined,
        tasaCambio: esUsd ? tasaCambio : undefined,
        generaCambio: method.generaCambio
      }
    ])
    requestAnimationFrame(() => {
      const el = amountInputsRef.current[payments.length]
      if (el) {
        el.focus()
        el.select()
      }
    })
  }

  function setPaymentAmount(index: number, raw: string) {
    const cleaned = raw.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
    if (cleaned === '') {
      setPayments((prev) =>
        prev.map((x, j) => (j === index ? { ...x, amount: '' } : x))
      )
      return
    }
    const v = Number(cleaned)
    if (v === 0) return
    const payment = payments[index]
    if (!payment) return
    const others = paid - (Number(payment.amount) || 0)
    const maxAllowed = Math.max(0, round2(opts.totals.total - others))
    const amount =
      payment.generaCambio || isNaN(v) || v <= maxAllowed
        ? cleaned
        : String(maxAllowed)
    setPayments((prev) =>
      prev.map((x, j) => (j === index ? { ...x, amount } : x))
    )
  }

  function removePayment(index: number) {
    setPayments((prev) => prev.filter((_, j) => j !== index))
  }

  function setPaymentReference(index: number, reference: string) {
    setPayments((prev) =>
      prev.map((x, j) => (j === index ? { ...x, reference } : x))
    )
  }

  async function checkout(options?: {
    permitirFacturarSinAcumular?: boolean
    omitirAcumulacion?: boolean
  }) {
    if (!opts.customer) {
      opts.setMessage('Seleccione un cliente.')
      return
    }
    if (!esTicket && !opts.customer.rtf) {
      opts.setMessage('El cliente seleccionado no tiene RTN y no puede facturar.')
      return
    }
    if (!esTicket) {
      if (
        payments.some(
          (p) =>
            !String(p.amount).trim() ||
            isNaN(Number(p.amount)) ||
            Number(p.amount) <= 0
        )
      ) {
        opts.setMessage('Las formas de pago no pueden tener monto en cero.')
        return
      }
      const over = payments.find(
        (p) =>
          !p.generaCambio &&
          Number(p.amount) > opts.totals.total
      )
      if (over) {
        opts.setMessage(
          `"${over.method}" no puede exceder el total; solo Efectivo y Dólar generan cambio.`
        )
        return
      }
      if (payments.length === 0) {
        opts.setMessage('Agregue al menos un método de pago.')
        return
      }
      const faltaRef = payments.find(
        (p) => p.requiereReferencia && !(p.reference || '').trim()
      )
      if (faltaRef) {
        opts.setMessage(`Ingrese la referencia para "${faltaRef.method}".`)
        return
      }
      if (paid < opts.totals.total) {
        opts.setMessage('El pago no cubre el total.')
        return
      }
    }
    if (billingType === 'credito') {
      if (!orden.trim()) {
        opts.setMessage('Ingrese la OC para facturar al crédito.')
        return
      }
      if (!kmValue.trim()) {
        opts.setMessage('Ingrese KM/MI para facturar al crédito.')
        return
      }
      if (!chofer.trim()) {
        opts.setMessage('Ingrese el conductor para facturar al crédito.')
        return
      }

      // Validar que no haya pagos mixtos agregados
      const tieneNoCredito = payments.some(
        (p) =>
          p.code?.toUpperCase() !== 'CREDITO' &&
          !p.method?.toLowerCase().includes('crédito') &&
          !p.method?.toLowerCase().includes('credito')
      )
      if (tieneNoCredito) {
        opts.setMessage('En ventas al crédito no se permiten formas de pago mixtas (debe ser 100% Crédito).')
        return
      }

      // Validar crédito disponible y morosidad si la estación tiene activada la validación de saldo
      let creditValidationSource: 'ONLINE' | 'OFFLINE_FALLBACK' = 'OFFLINE_FALLBACK'
      const shouldValidateCredit = opts.store?.validarSaldoCredito !== false
      if (shouldValidateCredit) {
        try {
          const check = await api.checkCustomerCredit(
            opts.customer.code,
            opts.totals.total,
            opts.store?.storeId
          )
          creditValidationSource = check.source
          if (!check.isAllowed) {
            opts.setMessage(check.reason || 'Crédito insuficiente o cliente en mora.')
            return
          }
        } catch {
          // Fallback a cálculo local ante error de red o timeout
          const check = calcularCreditoDisponible({
            creditLimit: opts.customer.creditLimit || 0,
            saldoCentral: opts.customer.balance || 0,
            facturasPendientesLocales: 0,
            totalVentaActual: opts.totals.total,
            hasOverdueInvoices: opts.customer.hasOverdueInvoices,
            blockOnOverdue: opts.customer.blockOnOverdue
          })

          if (!check.isAllowed) {
            opts.setMessage(check.reason || 'Crédito insuficiente o cliente en mora.')
            return
          }
          creditValidationSource = 'OFFLINE_FALLBACK'
        }
      } else {
        opts.setMessage('⚠️ Consulta de saldo deshabilitada en esta estación. Venta emitida al crédito sin validación de saldo.')
      }
      setCreditValidationSource(creditValidationSource)

      if (creditValidationSource === 'OFFLINE_FALLBACK') {
        if (!supervisorPin.trim()) {
          opts.setMessage('Ingrese el PIN de supervisor para autorizar crédito offline.')
          return
        }
        try {
          const validAdmin = await api.validateAdmin(opts.store.storeId, supervisorPin.trim())
          if (!validAdmin.valid) {
            opts.setMessage('PIN o contraseña de supervisor inválida.')
            return
          }
        } catch (e: any) {
          opts.setMessage(e?.message || 'Error al validar PIN de supervisor.')
          return
        }
      }
    }
    setBusy(true)
    opts.setMessage('')
    try {
      const pre = await api.validateCorrelative(
        opts.store.storeId,
        opts.store.posNumber,
        esTicket
      )
      if (!pre?.isValid) {
        setAlertModal({
          title: 'No se puede facturar',
          message: pre?.message || 'No hay un rango de correlativos válido.'
        })
        opts.setMessage('')
        return
      }
      const result = await api.createInvoice({
        storeId: opts.store.storeId,
        posNo: opts.store.posNumber,
        shiftNumber: opts.session.shiftInfo.Shift!,
        employeeName: opts.session.user.name,
        customerNo: opts.customer.code,
        customerName: opts.customer.name,
        customerRtn: opts.customer.rtf,
        items: opts.effectiveCart,
        payments: esTicket
          ? []
          : payments.map((p) => ({
              ...p,
              amount: Number(p.amount),
              moneda: p.moneda,
              tasaCambio: p.tasaCambio,
              montoIngresado: p.moneda === 'USD' ? Number(p.amount) : undefined
            })),
        total: Number(opts.totals.total.toFixed(2)),
        tax: Number(opts.totals.tax.toFixed(2)),
        discount: Number(opts.totals.discount.toFixed(2)),
        isCredit: billingType === 'credito',
        creditValidationSource: billingType === 'credito' ? creditValidationSource : undefined,
        isTicket: esTicket,
        orden: orden.trim(),
        km: kmValue.trim() ? `${kmValue.trim()} ${kmUnit}` : '',
        chofer: chofer.trim(),
        comment: comment.trim(),
        permitirFacturarSinAcumular: options?.permitirFacturarSinAcumular,
        omitirAcumulacion: options?.omitirAcumulacion
      })

      const ticketInput: PrintTicketInput = {
        session: opts.session,
        items: opts.effectiveCart,
        payments: esTicket
        ? []
        : payments.map((p) => ({
            ...p,
            amount: Number(p.amount),
            moneda: p.moneda,
            tasaCambio: p.tasaCambio,
            montoIngresado: p.moneda === 'USD' ? Number(p.amount) : undefined
          })),
        total: opts.totals.total,
        tax: opts.totals.tax,
        discount: opts.totals.discount,
        result,
        isTicket: esTicket,
        isCredit: billingType === 'credito',
        cambio: change,
        customerName: opts.customer.name,
        customerRtn: opts.customer.rtf
      }

      opts.onTicketPrinted?.(ticketInput)

      try {
        await opts.printTicket(ticketInput)
      } catch (printErr: any) {
        console.warn('Error imprimiendo:', printErr?.message)
        setAlertModal({
          title: 'Venta Emitida · Error de Impresora',
          message: `La factura ${result.invoiceNo} se guardó exitosamente, pero no se pudo imprimir el ticket (${printErr?.message || 'verifique papel o conexión'}). ¿Desea reintentar la impresión?`,
          confirmText: 'Reintentar impresión',
          cancelText: 'Aceptar',
          onConfirm: async () => {
            closeAlertModal()
            try {
              await opts.printTicket(ticketInput)
              opts.setMessage('Ticket impreso exitosamente.')
            } catch (retryErr: any) {
              opts.setMessage(`Reintento falló: ${retryErr?.message || 'Error de impresora'}`)
            }
          },
          onCancel: () => closeAlertModal()
        })
      }

      const seriesMsg =
        result.seriesRemaining != null &&
        (result.seriesRemaining <= 100 || (result.seriesRemainingDays ?? 999) <= 5)
          ? ` · ⚠ quedan ${result.seriesRemaining} · vence en ${result.seriesRemainingDays} días`
          : ''
      opts.setMessage(`Venta ${result.invoiceNo} completada.${seriesMsg}`)
      setPayments([])
      opts.onCustomerChange(null)
      setOrden('')
      setKmValue('')
      setChofer('')
      setComment('')
      setIsFidelizacion(false)
      setCustomerMode('none')
      setCustomerModalOpen(false)
      setCheckoutOpen(false)
      opts.onSaleComplete(result.invoiceNo, change)
    } catch (e: any) {
      const message = errMsg(e)
      const isLealAccumulationError =
        message.toLowerCase().includes('acumul') &&
        message.toLowerCase().includes('leal')

      if (isLealAccumulationError) {
        setAlertModal({
          title: 'Error al acumular puntos en Leal',
          message: `${message}\n\n¿Desea reintentar la acumulación o emitir la factura sin acumular puntos?`,
          confirmText: 'Reintentar',
          onConfirm: () => {
            closeAlertModal()
            void checkout()
          },
          secondaryText: 'Facturar sin acumular',
          onSecondary: () => {
            closeAlertModal()
            void checkout({ permitirFacturarSinAcumular: true })
          },
          cancelText: 'Cancelar',
          onCancel: () => {
            closeAlertModal()
          }
        })
      }
      opts.setMessage(message)
    } finally {
      setBusy(false)
    }
  }

  return {
    customer: opts.customer,
    customerQuery,
    customerResults,
    payments,
    checkoutOpen,
    busy,
    billingType,
    esTicket,
    setEsTicket,
    customerMode,
    customerModalOpen,
    isFidelizacion,
    orden,
    kmValue,
    kmUnit,
    chofer,
    comment,
    createCustomerOpen,
    formRtn,
    formName,
    creating,
    pendingDuplicate,
    amountInputsRef,
    paid,
    change,
    searchCustomers,
    openCustomerMode,
    selectCustomer,
    closeCustomerModal,
    createCustomer,
    setConsumidorFinal,
    addPayment,
    setPaymentAmount,
    removePayment,
    setPaymentReference,
    openCheckout: () => setCheckoutOpen(true),
    closeCheckout: () => setCheckoutOpen(false),
    setCheckoutOpen,
    alertModal,
    closeAlertModal,
    checkout,
    setBillingType,
    setIsFidelizacion,
    setCustomerMode,
    setCustomerQuery,
    setCustomerResults,
    setCustomerModalOpen,
    setOrden,
    setKmValue,
    setKmUnit,
    setChofer,
    setComment,
    setCreateCustomerOpen,
    setFormRtn,
    setFormName,
    setPendingDuplicate,
    creditValidationSource,
    setCreditValidationSource,
    supervisorPin,
    setSupervisorPin
  }
}

export type UseCheckoutReturn = ReturnType<typeof useCheckout>
