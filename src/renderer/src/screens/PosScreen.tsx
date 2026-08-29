import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api/client'
import type { CartItem, Customer, Dispenser, PumpTransaction } from '../api/types'
import { useApp } from '../store'
import { printSaleTicket } from '../printing'
import { X } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import ProductModal from '../components/ProductModal'
import MediaPlayer from '../components/MediaPlayer'
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
import { fmtValue } from '../lib/pos-logic'

export default function PosScreen() {
  const { session, setView, paymentMethods, backendUrl } = useApp()
  const store = session!.storeConfig
  const fidelizacionLabel = store.nombreBotonFidelizacion || 'Fidelización'
  const fmt = (n: number | string) => fmtValue(n, store.moneda)

  const [productModalOpen, setProductModalOpen] = useState(false)
  const [message, setMessage] = useState('')

  const [dispensers, setDispensers] = useState<Dispenser[]>([])
  const [showAllPumps, setShowAllPumps] = useState(false)
  const [selectedPump, setSelectedPump] = useState<Dispenser | null>(null)
  const [pumpTransactions, setPumpTransactions] = useState<PumpTransaction[]>([])
  const [pumpTxLoading, setPumpTxLoading] = useState(false)

  const hasShift = !!session?.shiftInfo?.Shift

  const [customer, setCustomer] = useState<Customer | null>(null)

  const cartApi = useCart({
    customerCode: customer?.code ?? null,
    isConsumidorFinal: customer?.name === 'CONSUMIDOR FINAL',
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
    onSaleComplete: () => cartApi.clear(),
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
    checkout
  } = checkoutApi

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(''), 3000)
    return () => clearTimeout(t)
  }, [message])

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
    async function poll() {
      try {
        const d = await api.dispensers()
        if (mounted) setDispensers(d)
      } catch {
        // ignore
      }
    }
    poll()
    const t = setInterval(poll, 5000)
    return () => {
      mounted = false
      clearInterval(t)
    }
  }, [store.mostrarBombas])

  const myPumps = dispensers.filter((d) => d.pos === store.posNumber)
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

        <MediaPlayer />

        <PumpsBlock
          pumps={visiblePumps}
          mostrarBombas={store.mostrarBombas}
          ocultarBotonOtrasBombas={store.ocultarBotonOtrasBombas}
          showAll={showAllPumps}
          onToggleAll={() => setShowAllPumps((v) => !v)}
          onOpenPump={openPumpModal}
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

      <CheckoutModal
        open={checkoutOpen}
        billingType={billingType}
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
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onAdd={(p) => addProduct(p)}
        moneda={store.moneda}
      />

      {message && !checkoutOpen && (
        <div className="fixed bottom-5 right-5 max-w-md rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-xl animate-in fade-in-0 zoom-in-95">
          <div className="flex items-start justify-between gap-3">
            <span className="flex-1">{message}</span>
            <button className="btn-press shrink-0 text-muted hover:text-primary" onClick={() => setMessage('')}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
