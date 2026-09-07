// @ts-nocheck
import { test, expect } from '@playwright/test'
import {
  BACKEND_URL,
  ensureOpenShift,
  login,
  payWithCash,
  seedFuelSale,
  selectConsumidorFinal,
  waitSaleComplete
} from './helpers'

test('flujo de combustible: login → turno → bomba → carrito → pago → factura EXENTO', async ({ page }) => {
  await login(page)
  await ensureOpenShift(page)

  // Siembra una transacción de bomba de prueba para que el flujo sea determinista.
  await seedFuelSale()

  // Abre el modal de la primera bomba visible y espera que cargue.
  await page.locator('button[title^="Surtidor"]').first().click()
  await page.locator('text=Cargando transacciones…').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {})

  // Agrega la transacción de prueba (Sin Facturar, es la más reciente).
  const pendingCard = page.locator('text=Sin Facturar').first()
  await pendingCard.waitFor({ timeout: 10000 })
  await pendingCard.click()

  // Cierra el modal de la bomba (su X); el modal no maneja Escape.
  await page.locator('.card-surface:has-text("Bomba") button:has(svg)').first().click()
  await selectConsumidorFinal(page)
  await payWithCash(page)

  const invoiceNo = await waitSaleComplete(page)
  expect(invoiceNo).toBeTruthy()

  // Verifica en la API que la factura tiene al menos una línea de combustible EXENTO.
  const search = await page.request.get(
    `${BACKEND_URL}/api/invoices/search?storeId=001&avanzado=false`
  )
  const docs = await search.json()
  const doc = (docs as any[]).find((d) => d['POS Sales Doc_ No_'] === invoiceNo)
  expect(doc).toBeTruthy()
  const txId = doc['POS Transaction ID']
  const lines = await (await page.request.get(`${BACKEND_URL}/api/invoices/${txId}/lines`)).json()
  expect(Array.isArray(lines)).toBe(true)
  const hasExento = (lines as any[]).some(
    (l) => String(l['VAT Prod_ Posting Group']).toUpperCase() === 'EXENTO'
  )
  expect(hasExento).toBe(true)
})