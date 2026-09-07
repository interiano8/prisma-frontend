// @ts-nocheck
import { useEffect, useRef, useState } from 'react'
import type { Product } from '../api/types'
import { api } from '../api/client'
import { errMsg } from '../lib/pos-logic'

export interface UseBarcodeScanOptions {
  addProduct: (p: Product) => void
  setMessage: (m: string) => void
  disabled: boolean
}

export function useBarcodeScan(opts: UseBarcodeScanOptions) {
  const [codeInput, setCodeInput] = useState('')
  const codeInputRef = useRef<HTMLInputElement>(null)
  const scanBufferRef = useRef('')
  const optsRef = useRef(opts)
  optsRef.current = opts

  async function lookupAndAdd(code: string) {
    const clean = code.trim()
    if (clean.length < 3) return
    try {
      let product: Product | null = await api.productByBarcode(clean)
      if (!product) product = await api.productByCode(clean)
      if (product) {
        optsRef.current.addProduct(product)
        optsRef.current.setMessage(`${product.description || product.code} agregado.`)
      } else {
        optsRef.current.setMessage(`Código ${clean} no encontrado.`)
      }
    } catch (e: any) {
      optsRef.current.setMessage(errMsg(e))
    }
  }

  async function submitCode() {
    const clean = codeInput.trim()
    if (!clean) return
    await lookupAndAdd(clean)
    setCodeInput('')
    codeInputRef.current?.focus()
  }

  useEffect(() => {
    function isEditable(el: EventTarget | null): boolean {
      if (!(el instanceof HTMLElement)) return false
      return (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement ||
        el.isContentEditable
      )
    }
    function onBarcode(e: KeyboardEvent) {
      if (optsRef.current.disabled) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (isEditable(e.target)) {
        scanBufferRef.current = ''
        return
      }
      if (e.key === 'Enter') {
        const code = scanBufferRef.current
        scanBufferRef.current = ''
        if (code) lookupAndAdd(code)
        return
      }
      if (e.key.length === 1) {
        scanBufferRef.current += e.key
        if (scanBufferRef.current.length > 40) {
          scanBufferRef.current = scanBufferRef.current.slice(-40)
        }
      }
    }
    window.addEventListener('keydown', onBarcode)
    return () => window.removeEventListener('keydown', onBarcode)
  }, [])

  return { codeInput, setCodeInput, codeInputRef, lookupAndAdd, submitCode }
}

export type UseBarcodeScanReturn = ReturnType<typeof useBarcodeScan>
