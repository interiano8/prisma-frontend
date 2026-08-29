import { test, expect } from '@playwright/test'
import {
  BACKEND_URL,
  addProductByCode,
  ensureOpenShift,
  login,
  payWithCash,
  selectConsumidorFinal,
  waitSaleComplete
} from './helpers'

test('flujo de venta: login → turno → producto → pago → factura', async ({ page }) => {
  await login(page)
  await ensureOpenShift(page)

  // Código de un producto conocido con precio (ej. 500310 PUMA BRAKE FLUID).
  await addProductByCode(page, '500310')
  await expect(page.locator('text=PUMA BRAKE FLUID DOT-4').first()).toBeVisible()

  await selectConsumidorFinal(page)
  await payWithCash(page)

  const invoiceNo = await waitSaleComplete(page)
  expect(invoiceNo).toBeTruthy()

  // Verifica en la API que la factura quedó registrada.
  const res = await page.request.get(
    `${BACKEND_URL}/api/invoices/search?storeId=001&avanzado=false`
  )
  expect(res.ok()).toBeTruthy()
  const docs = await res.json()
  expect(Array.isArray(docs)).toBe(true)
  expect(docs.some((d: any) => d['POS Sales Doc_ No_'] === invoiceNo)).toBe(true)
})