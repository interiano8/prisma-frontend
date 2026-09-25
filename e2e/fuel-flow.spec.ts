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
  page.on('console', (msg) => console.log(`[BROWSER ${msg.type()}]:`, msg.text()))
  page.on('pageerror', (err) => console.log('[BROWSER UNCAUGHT]:', err))

  await login(page)
  await ensureOpenShift(page)

  // Siembra una transacción de bomba de prueba para que el flujo sea determinista.
  const seededSaleId = await seedFuelSale()

  // Abre el modal de la primera bomba visible y espera que cargue.
  const pumpBtn = page.locator('button[title^="Surtidor"]').first()
  await pumpBtn.click()
  await page.locator('[aria-label="Cargando transacciones"]').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {})

  // Agrega la transacción de prueba por su identificador único
  const pendingCard = page.getByText(`#${seededSaleId}`).first()
  await pendingCard.waitFor({ timeout: 10000 })
  await pendingCard.click()
  await page.waitForTimeout(350)

  // Cierra el modal de la bomba si aún sigue abierto
  const closeBtn = page.locator('button[aria-label="Cerrar modal de bomba"]').first()
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click()
  }
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