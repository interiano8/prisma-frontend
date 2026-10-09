import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { formatRtn } from '../format'
import {
  X,
  Search,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  UserRound,
  ShieldCheck,
  FileText
} from 'lucide-react'

interface Props {
  open: boolean
  storeId: string
  posNo: string
  shiftNumber?: string | null
  currentEmployee: string
  onClose: () => void
  onSuccess: (mensaje: string) => void
}

export default function ReclassifySaleModal(props: Props) {
  const { open, storeId, posNo, shiftNumber, currentEmployee, onClose, onSuccess } = props

  const [searchDoc, setSearchDoc] = useState('')
  const [searching, setSearching] = useState(false)
  const [salesList, setSalesList] = useState<any[]>([])
  const [selectedSale, setSelectedSale] = useState<any | null>(null)

  // Opciones de cambio
  const [changeType, setChangeType] = useState<'pago' | 'cliente' | 'ambos'>('pago')
  const [newPaymentCode, setNewPaymentCode] = useState('02') // Tarjeta por defecto
  const [newPaymentRef, setNewPaymentRef] = useState('')
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])

  // Cliente
  const [customerQuery, setCustomerQuery] = useState('')
  const [customerResults, setCustomerResults] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null)

  // Admin PIN y motivo
  const [adminPin, setAdminPin] = useState('')
  const [motivo, setMotivo] = useState('')
  const [busy, setBusy] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (open) {
      loadRecentShiftSales()
      loadPaymentMethods()
      resetForm()
    }
  }, [open, shiftNumber])

  function resetForm() {
    setSelectedSale(null)
    setSelectedCustomer(null)
    setAdminPin('')
    setMotivo('')
    setErrorMsg('')
    setNewPaymentRef('')
    setCustomerQuery('')
    setCustomerResults([])
  }

  async function loadPaymentMethods() {
    try {
      const methods = await api.paymentMethods(storeId)
      // Filtrar métodos de contado (excluyendo crédito)
      const contadoMethods = methods.filter((m: any) => m.facturaContado && m.codigo !== '04')
      setPaymentMethods(contadoMethods)
      if (contadoMethods.length > 0) {
        setNewPaymentCode(contadoMethods[0].codigo)
      }
    } catch {
      // fallback básico
      setPaymentMethods([
        { codigo: '01', descripcion: 'EFECTIVO' },
        { codigo: '02', descripcion: 'TARJETA DE CRÉDITO' },
        { codigo: '03', descripcion: 'TRANSFERENCIA' }
      ])
    }
  }

  async function loadRecentShiftSales() {
    setSearching(true)
    setErrorMsg('')
    try {
      const results = await api.searchInvoices({
        storeId,
        posNo,
        turno: shiftNumber || '',
        avanzado: 'true',
        pageSize: '20'
      })
      const list = Array.isArray(results) ? results : results.data || []
      // Solo ventas de contado (tipoFacturacion = 1 o '1' o no crédito)
      const contadoOnly = list.filter((v: any) => v.tipoFacturacion === 1 || v.tipoFacturacion === '1' || v.BillingType === 1)
      setSalesList(contadoOnly)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error cargando ventas del turno')
    } finally {
      setSearching(false)
    }
  }

  async function handleSearchCustomer(q: string) {
    setCustomerQuery(q)
    if (q.trim().length < 2) {
      setCustomerResults([])
      return
    }
    try {
      const list = await api.searchCustomers(q)
      setCustomerResults(list)
    } catch {
      setCustomerResults([])
    }
  }

  async function handleConfirmReclassification() {
    if (!selectedSale) {
      setErrorMsg('Debe seleccionar una venta para reclasificar.')
      return
    }
    if (!adminPin || adminPin.trim().length === 0) {
      setErrorMsg('El PIN de Administrador/Supervisor es obligatorio.')
      return
    }
    if (!motivo || motivo.trim().length === 0) {
      setErrorMsg('Debe ingresar el motivo de la reclasificación.')
      return
    }

    const saleTxId = selectedSale.idTransaccionPos || selectedSale.numeroDocumento || selectedSale.documento

    const payload: any = {
      storeId,
      posNo,
      adminPin: adminPin.trim(),
      requestedByUser: currentEmployee,
      motivo: motivo.trim()
    }

    if (changeType === 'pago' || changeType === 'ambos') {
      const m = paymentMethods.find((p) => p.codigo === newPaymentCode)
      payload.nuevoMetodoPago = {
        codigoMetodoPago: newPaymentCode,
        descripcion: m?.descripcion,
        referencia: newPaymentRef.trim() || undefined
      }
    }

    if (changeType === 'cliente' || changeType === 'ambos') {
      if (!selectedCustomer) {
        setErrorMsg('Debe seleccionar el nuevo cliente de contado.')
        return
      }
      payload.nuevoCliente = {
        codigo: selectedCustomer.code || selectedCustomer.codigo,
        nombre: selectedCustomer.name || selectedCustomer.nombre,
        rtn: selectedCustomer.rtn || undefined
      }
    }

    setBusy(true)
    setErrorMsg('')
    try {
      const res = await api.reclassifySale(saleTxId, payload)
      onSuccess(res.mensaje || 'Venta reclasificada exitosamente.')
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar la reclasificación')
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="card-surface relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-primary">Reclasificar Venta de Contado</h3>
              <p className="text-xs text-muted">Ajuste de medio de pago y/o cliente en turno abierto con PIN de supervisor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-press rounded-lg p-1.5 text-muted hover:bg-card hover:text-primary"
            disabled={busy}
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Selección de venta */}
          <div>
            <label className="label-base mb-1 block">1. Seleccionar Venta del Turno Activo</label>
            {!selectedSale ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="Filtrar por correlativo o cliente..."
                    className="input-base w-full pl-9"
                    value={searchDoc}
                    onChange={(e) => setSearchDoc(e.target.value)}
                  />
                </div>
                <div className="max-h-44 overflow-y-auto rounded-lg border border-border bg-card/40 divide-y divide-border">
                  {searching ? (
                    <div className="p-4 text-center text-xs text-muted">Cargando ventas del turno...</div>
                  ) : salesList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted">No se encontraron ventas de contado en este turno.</div>
                  ) : (
                    salesList
                      .filter((s) => {
                        if (!searchDoc) return true
                        const term = searchDoc.toLowerCase()
                        const doc = (s.numeroDocumento || s.documento || '').toLowerCase()
                        const cli = (s.nombreCliente || s.customerName || '').toLowerCase()
                        return doc.includes(term) || cli.includes(term)
                      })
                      .map((s, idx) => (
                        <div
                          key={s.idTransaccionPos || s.documento || idx}
                          onClick={() => setSelectedSale(s)}
                          className="flex cursor-pointer items-center justify-between p-3 hover:bg-accent/10 transition-colors"
                        >
                          <div>
                            <div className="text-sm font-semibold text-primary">
                              {s.numeroDocumento || s.documento || s.idTransaccionPos}
                            </div>
                            <div className="text-xs text-muted">
                              Cliente: {s.nombreCliente || s.customerName || 'Consumidor Final'} ·{' '}
                              {s.fechaHoraVenta ? new Date(s.fechaHoraVenta).toLocaleTimeString() : ''}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-sm font-bold text-accent">
                              L. {Number(s.monto || s.total || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-accent/40 bg-accent/5 p-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-accent" />
                    <span className="font-semibold text-primary">
                      {selectedSale.numeroDocumento || selectedSale.documento || selectedSale.idTransaccionPos}
                    </span>
                    <span className="rounded bg-accent/20 px-2 py-0.5 text-xs font-mono font-bold text-accent">
                      L. {Number(selectedSale.monto || selectedSale.total || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    Cliente actual: {selectedSale.nombreCliente || selectedSale.customerName || 'Consumidor Final'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSale(null)}
                  className="btn-press text-xs font-medium text-accent hover:underline"
                >
                  Cambiar venta
                </button>
              </div>
            )}
          </div>

          {selectedSale && (
            <>
              {/* 2. Tipo de corrección */}
              <div>
                <label className="label-base mb-1 block">2. Tipo de Modificación</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setChangeType('pago')}
                    className={`btn-press rounded-lg border py-2 text-xs font-medium transition-colors ${
                      changeType === 'pago'
                        ? 'border-accent bg-accent/10 text-accent font-semibold'
                        : 'border-border text-muted hover:text-primary'
                    }`}
                  >
                    Forma de Pago
                  </button>
                  <button
                    type="button"
                    onClick={() => setChangeType('cliente')}
                    className={`btn-press rounded-lg border py-2 text-xs font-medium transition-colors ${
                      changeType === 'cliente'
                        ? 'border-accent bg-accent/10 text-accent font-semibold'
                        : 'border-border text-muted hover:text-primary'
                    }`}
                  >
                    Cliente de Contado
                  </button>
                  <button
                    type="button"
                    onClick={() => setChangeType('ambos')}
                    className={`btn-press rounded-lg border py-2 text-xs font-medium transition-colors ${
                      changeType === 'ambos'
                        ? 'border-accent bg-accent/10 text-accent font-semibold'
                        : 'border-border text-muted hover:text-primary'
                    }`}
                  >
                    Ambos
                  </button>
                </div>
              </div>

              {/* Ajuste de Pago */}
              {(changeType === 'pago' || changeType === 'ambos') && (
                <div className="rounded-xl border border-border bg-card/40 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase">
                    <CreditCard size={14} /> Nueva Forma de Pago Real
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label-base">Método de Pago</label>
                      <select
                        className="input-base w-full"
                        value={newPaymentCode}
                        onChange={(e) => setNewPaymentCode(e.target.value)}
                      >
                        {paymentMethods.map((m) => (
                          <option key={m.codigo} value={m.codigo}>
                            {m.descripcion}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label-base">Referencia / Voucher (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ej. 458921"
                        className="input-base w-full"
                        value={newPaymentRef}
                        onChange={(e) => setNewPaymentRef(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Ajuste de Cliente */}
              {(changeType === 'cliente' || changeType === 'ambos') && (
                <div className="rounded-xl border border-border bg-card/40 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase">
                    <UserRound size={14} /> Nuevo Cliente de Contado
                  </div>
                  {!selectedCustomer ? (
                    <div>
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                          type="text"
                          placeholder="Buscar cliente por RTN o nombre..."
                          className="input-base w-full pl-9 text-xs"
                          value={customerQuery}
                          onChange={(e) => handleSearchCustomer(e.target.value)}
                        />
                      </div>
                      {customerResults.length > 0 && (
                        <div className="mt-2 max-h-32 overflow-y-auto rounded-lg border border-border bg-card divide-y divide-border">
                          {customerResults.map((c) => (
                            <div
                              key={c.code || c.codigo}
                              onClick={() => setSelectedCustomer(c)}
                              className="cursor-pointer p-2 text-xs hover:bg-accent/10 flex justify-between items-center"
                            >
                              <span className="font-medium text-primary">{c.name || c.nombre}</span>
                              <span className="font-mono text-muted">{c.rtn ? formatRtn(c.rtn) : 'Sin RTN'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-2.5">
                      <div>
                        <div className="text-xs font-semibold text-primary">{selectedCustomer.name || selectedCustomer.nombre}</div>
                        <div className="text-[11px] font-mono text-muted">{selectedCustomer.rtn ? formatRtn(selectedCustomer.rtn) : 'Sin RTN'}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(null)}
                        className="btn-press text-xs text-accent hover:underline"
                      >
                        Cambiar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Autorización y Motivo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="label-base flex items-center gap-1.5">
                    <KeyRound size={13} className="text-accent" /> PIN de Supervisor / Admin *
                  </label>
                  <input
                    type="password"
                    placeholder="••••"
                    className="input-base w-full font-mono"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-base">Motivo del Ajuste *</label>
                  <input
                    type="text"
                    placeholder="Ej. Cajero marcó efectivo por error"
                    className="input-base w-full"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 bg-card/20">
          <button
            type="button"
            className="btn-press rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted hover:text-primary"
            onClick={onClose}
            disabled={busy}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-press flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
            onClick={handleConfirmReclassification}
            disabled={busy || !selectedSale}
          >
            {busy ? 'Procesando…' : 'Confirmar Reclasificación'}
          </button>
        </div>
      </div>
    </div>
  )
}
