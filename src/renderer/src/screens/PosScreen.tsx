import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api/client'
import type { CartItem, Customer, Dispenser, PumpTransaction } from '../api/types'
import { useApp } from '../store'
import { printSaleTicket } from '../printing'
import { X, CheckCircle2 } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import ProductModal from '../components/ProductModal'
import MediaPlayer from '../components/MediaPlayer'
import CategoryShortcuts from '../components/CategoryShortcuts'
import CodeInputRow from '../components/CodeInputRow'
import PumpsBlock from '../components/PumpsBlock'
import CartPanel from '../components/CartPanel'
import CheckoutModal from '../components/CheckoutModal'
import CustomerModal from '../components/CustomerModal'
import CreateCustomerModal from '../components/CreateCustomerModal'
import PumpModal from '../components/PumpModal'
import { useCart } from '../hooks/useCart'
import { useCheckout } from '../hooks/useCheckout'
import { useBarcodeScan } from '../hooks/useBarcodeScan'
import { usePumpSocket, type PumpSocketStatus, type PumpStatusMessage } from '../hooks/usePumpSocket'
import { fmtValue, applyWsState, mergeWsStates, filterMyPumps } from '../lib/pos-logic'

export default function PosScreen() {
  const { session, setView, paymentMethods, backendUrl, setLastPrintedTicket } = useApp()
  const store = session!.storeConfig
  const fidelizacionLabel = store.nombreBotonFidelizacion || 'Fidelización'
  const fmt = (n: number | string) => fmtValue(n, store.moneda)

  const [productModalOpen, setProductModalOpen] = useState(false)
  const [categoryOpen, setCategoryOpen] = useState<{ codigo: string; descripcion: string | null } | null>(null)
  const [visualizacion, setVisualizacion] = useState<'multimedia' | 'categorias'>('multimedia')
  const [message, setMessage] = useState('')
  const [saleDone, setSaleDone] = useState<{ invoiceNo: string; change: number } | null>(null)

  const [dispensers, setDispensers] = useState<Dispenser[]>([])
  const [showAllPumps, setShowAllPumps] = useState(false)
  const [selectedPump, setSelectedPump] = useState<Dispenser | null>(null)
  const [pumpTransactions, setPumpTransactions] = useState<PumpTransaction[]>([])
  const [pumpTxLoading, setPumpTxLoading] = useState(false)
  // Último estado WS por bomba (para no perder el snapshot si llega antes de la carga).
  const wsStates = useRef(new Map<number, PumpStatusMessage>())

  const hasShift = !!session?.shiftInfo?.Shift

  const [customer, setCustomer] = useState<Customer | null>(null)

  const cartApi = useCart({
    customerCode: customer?.code ?? null,
    isConsumidorFinal: customer?.code === store.noConsumidorFinal,
    fetchDiscounts: api.calculateDiscounts
  })

  const checkoutApi = useCheckout({
    store,
    session: session!,
    effectiveCart: cartApi.effectiveCart,
    totals: cartApi.totals,
    hasShift,
    customer,
    onCustomerChange: setCustomer,
    onSaleComplete: (invoiceNo, change) => {
      cartApi.clear()
      setSaleDone({ invoiceNo, change })
    },
    onTicketPrinted: setLastPrintedTicket,
    setMessage,
    printTicket: printSaleTicket
  })

  const scanApi = useBarcodeScan({
    addProduct: cartApi.addProduct,
    setMessage,
    disabled: checkoutApi.checkoutOpen || checkoutApi.busy || productModalOpen
  })

  const { codeInput, setCodeInput, codeInputRef, submitCode } = scanApi
  const { effectiveCart, totals, cartSaleIds, addProduct, changeQty, removeItem } = cartApi
  const {
    customerQuery,
    customerResults,
    payments,
    checkoutOpen,
    busy,
    billingType,
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
    setCheckoutOpen,
    setIsFidelizacion,
    setCreateCustomerOpen,
    setFormRtn,
    setFormName,
    setPendingDuplicate,
    setOrden,
    setKmValue,
    setKmUnit,
    setChofer,
    setComment,
    setCustomerMode,
    setCustomerQuery,
    setCustomerResults,
    setCustomerModalOpen,
    esTicket,
    setEsTicket,
    checkout
  } = checkoutApi

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(''), 3000)
    return () => clearTimeout(t)
  }, [message])

  useEffect(() => {
    let mounted = true
    api
      .getPosConfig(store.posNumber)
      .then((c) => {
        if (mounted) setVisualizacion(c.visualizacion === 'categorias' ? 'categorias' : 'multimedia')
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [store.posNumber])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'F3') {
        e.preventDefault()
        checkoutApi.setConsumidorFinal()
      } else if (e.key === 'F4') {
        e.preventDefault()
        checkoutApi.openCustomerMode('rtn')
      } else if (e.key === 'F5') {
        e.preventDefault()
        checkoutApi.openCustomerMode('credito')
      } else if (e.key === 'F6') {
        e.preventDefault()
        checkoutApi.openCustomerMode('fidelizacion')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutApi])

  useEffect(() => {
    if (!store.mostrarBombas) return
    let mounted = true
    // Carga única del mapeo bomba→POS/productos (sin timer). El estado en vivo
    // llega por el WebSocket de wayne. Se mergea con los estados WS acumulados
    // (por si el snapshot llegó antes de esta carga).
    api
      .dispensers()
      .then((d) => {
        if (!mounted) return
        setDispensers(mergeWsStates(d, wsStates.current))
      })
      .catch(() => {
        // ignore
      })
    return () => {
      mounted = false
    }
  }, [store.mostrarBombas])

  const [conexionBombas, setConexionBombas] = useState<PumpSocketStatus>('desconectado')
  const socketStatus = usePumpSocket(
    store.urlControlador ?? '',
    store.claveControlador ?? '',
    (msg) => {
      // Acumular siempre el último estado por bomba (aunque el dispenser aún no exista).
      wsStates.current.set(msg.PumpID, msg)
      setDispensers((prev) => {
        const idx = prev.findIndex((d) => d.pumpId === msg.PumpID)
        if (idx < 0) return prev
        const next = [...prev]
        next[idx] = applyWsState(next[idx], msg)
        return next
      })
    },
  )
  useEffect(() => {
    setConexionBombas(socketStatus)
  }, [socketStatus])

  const caras = Array.isArray(store.caras) ? store.caras : []
  const myPumps = filterMyPumps(dispensers, caras)
  const visiblePumps = showAllPumps ? dispensers : myPumps

  const availableMethods = useMemo(
    () =>
      paymentMethods.filter((m) =>
        checkoutApi.billingType === 'credito' ? m.facturaCredito : m.facturaContado
      ),
    [paymentMethods, checkoutApi.billingType]
  )

  async function addFuelSale(tx: PumpTransaction) {
    let vatGroup = 'EXENTO'
    try {
      if (tx.codigo) {
        const p = await api.productByCode(tx.codigo)
        if (p?.vatGroup) vatGroup = p.vatGroup
      }
    } catch {
      // sin conexión: asumir EXENTO para el combustible
    }
    const productName = tx.combustible || selectedPump?.productName || ''
    cartApi.addFuel(tx, vatGroup, productName)
  }

  async function openPumpModal(d: Dispenser) {
    setSelectedPump(d)
    setPumpTransactions([])
    setPumpTxLoading(true)
    try {
      const txs = await api.pumpTransactions(d.pumpId, store.numTransaccionesBombas)
      setPumpTransactions(txs)
    } catch {
      setPumpTransactions([])
    } finally {
      setPumpTxLoading(false)
    }
  }

  function toggleDiscount(item: CartItem) {
    const res = cartApi.toggleDiscount(item)
    if (!res.ok && res.reason) setMessage(res.reason)
  }

  return (
    <div className="grid h-full grid-cols-[1fr_520px] gap-4">
      {/* Columna izquierda */}
      <div className="flex min-h-0 flex-col gap-3">
        <CodeInputRow
          codeInput={codeInput}
          onCodeChange={setCodeInput}
          onSubmit={submitCode}
          inputRef={codeInputRef}
          onOpenProducts={() => setProductModalOpen(true)}
        />

        {visualizacion === 'multimedia' && <MediaPlayer />}
        {visualizacion === 'categorias' && (
          <CategoryShortcuts onOpenCategory={setCategoryOpen} />
        )}

        <PumpsBlock
          pumps={visiblePumps}
          allPumpIds={dispensers.map((d) => d.pumpId)}
          myPumpIds={myPumps.map((d) => d.pumpId)}
          mostrarBombas={store.mostrarBombas}
          ocultarBotonOtrasBombas={store.ocultarBotonOtrasBombas}
          showAll={showAllPumps}
          onToggleAll={() => setShowAllPumps((v) => !v)}
          onOpenPump={openPumpModal}
          conexionEstado={conexionBombas}
        />
      </div>

      <CartPanel
        customer={customer}
        hasShift={hasShift}
        shiftNumber={session!.shiftInfo.Shift}
        billingType={billingType}
        isFidelizacion={isFidelizacion}
        fidelizacionLabel={fidelizacionLabel}
        effectiveCart={effectiveCart}
        totals={totals}
        moneda={store.moneda}
        noConsumidorFinal={store.noConsumidorFinal}
        busy={busy}
        onSetConsumidorFinal={() => setConsumidorFinal()}
        onOpenCustomerMode={(m) => openCustomerMode(m)}
        onChangeCustomer={() => {
          setCustomer(null)
          setIsFidelizacion(false)
        }}
        onOpenCheckout={() => setCheckoutOpen(true)}
        onOpenShift={() => setView('shift')}
        onToggleDiscount={toggleDiscount}
        onChangeQty={changeQty}
        onRemoveItem={removeItem}
      />

      <CustomerModal
        open={customerModalOpen}
        title={
          customerMode === 'credito'
            ? 'Clientes de crédito'
            : customerMode === 'fidelizacion'
              ? fidelizacionLabel
              : 'Clientes'
        }
        query={customerQuery}
        results={customerResults}
        canCreate={customerMode !== 'credito'}
        onQueryChange={searchCustomers}
        onClose={closeCustomerModal}
        onCreate={() => setCreateCustomerOpen(true)}
        onSelect={selectCustomer}
      />

      <CreateCustomerModal
        open={createCustomerOpen}
        name={formName}
        rtn={formRtn}
        creating={creating}
        onNameChange={setFormName}
        onRtnChange={setFormRtn}
        onClose={() => setCreateCustomerOpen(false)}
        onCreate={() => createCustomer(false)}
      />

      {pendingDuplicate && (
        <ConfirmDialog
          title="RTN ya registrado"
          message={`El RTN ya existe con el cliente "${pendingDuplicate.existingName}". ¿Desea crear el cliente de todos modos?`}
          confirmLabel="Sí, crear"
          cancelLabel="No"
          onConfirm={() => {
            setPendingDuplicate(null)
            createCustomer(true)
          }}
          onCancel={() => setPendingDuplicate(null)}
        />
      )}

      {checkoutApi.alertModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="card-surface w-[400px] p-6 animate-in fade-in-0 zoom-in-95">
            <h3 className="text-lg font-semibold">{checkoutApi.alertModal.title}</h3>
            <p className="mt-2 whitespace-pre-line text-sm text-muted">{checkoutApi.alertModal.message}</p>
            <div className="mt-5 flex gap-2">
              <button
                className="btn-press flex-1 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
                onClick={checkoutApi.closeAlertModal}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      <CheckoutModal
        open={checkoutOpen}
        billingType={billingType}
        esTicket={esTicket}
        onToggleTicket={() => setEsTicket((v) => !v)}
        totals={totals}
        availableMethods={availableMethods}
        payments={payments}
        paid={paid}
        change={change}
        amountInputsRef={amountInputsRef}
        message={message}
        orden={orden}
        kmValue={kmValue}
        kmUnit={kmUnit}
        chofer={chofer}
        comment={comment}
        busy={busy}
        moneda={store.moneda}
        backendUrl={backendUrl}
        onClose={() => setCheckoutOpen(false)}
        onAddPayment={addPayment}
        onSetPaymentAmount={setPaymentAmount}
        onRemovePayment={removePayment}
        onSetPaymentReference={setPaymentReference}
        onOrdenChange={setOrden}
        onKmValueChange={setKmValue}
        onKmUnitChange={setKmUnit}
        onChoferChange={setChofer}
        onCommentChange={setComment}
        onConfirm={checkout}
      />

      <PumpModal
        pump={selectedPump}
        loading={pumpTxLoading}
        transactions={pumpTransactions}
        cartSaleIds={cartSaleIds}
        minutosAtrasada={store.minutosAtrasada ?? 10}
        moneda={store.moneda}
        onClose={() => setSelectedPump(null)}
        onAdd={(t) => addFuelSale(t)}
        onAddAndClose={(t) => {
          addFuelSale(t)
          setSelectedPump(null)
        }}
      />

<ProductModal
        open={productModalOpen || !!categoryOpen}
        onClose={() => {
          setProductModalOpen(false)
          setCategoryOpen(null)
        }}
        onAdd={addProduct}
        moneda={store.moneda}
        category={categoryOpen?.codigo}
        categoryLabel={categoryOpen?.descripcion}
      />

      {message && !checkoutOpen && !saleDone && (
        <div className="fixed bottom-5 right-5 max-w-md rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-xl animate-in fade-in-0 zoom-in-95">
          <div className="flex items-start justify-between gap-3">
            <span className="flex-1">{message}</span>
            <button className="btn-press shrink-0 text-muted hover:text-primary" onClick={() => setMessage('')}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {saleDone && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative flex flex-col items-center gap-4 rounded-2xl bg-card px-14 py-10 text-center shadow-2xl animate-in fade-in-0 zoom-in-95">
            <button
              className="btn-press absolute right-3 top-3 rounded-lg p-1.5 text-muted hover:bg-card hover:text-primary"
              onClick={() => setSaleDone(null)}
              title="Cerrar"
            >
              <X size={20} />
            </button>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 size={48} className="animate-in zoom-in-50" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">¡Venta completada!</div>
              <div className="mt-1 font-mono text-sm text-muted">Factura {saleDone.invoiceNo}</div>
            </div>
            {saleDone.change > 0 && (
              <div className="mt-2 w-full rounded-xl border border-success/30 bg-success/10 px-6 py-4">
                <div className="text-sm font-medium text-success">Cambio a entregar</div>
                <div className="mt-1 font-mono text-3xl font-bold tabular-nums text-primary">
                  {fmt(saleDone.change)}
                </div>
              </div>
            )}
            <button
              className="btn-press mt-1 w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover"
              onClick={() => setSaleDone(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
