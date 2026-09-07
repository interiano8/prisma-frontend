import { expect, Page } from '@playwright/test'
import { Client } from 'pg'

export const BACKEND_URL = process.env.E2E_BACKEND_URL || 'http://localhost:5012'
export const E2E_USER = process.env.E2E_USER || 'prueba'
export const E2E_PASSWORD = process.env.E2E_PASSWORD || '1234'
export const STORE_ID = process.env.E2E_STORE || '001'
export const POS_NO = process.env.E2E_POS || '01'
export const DATABASE_URL =
  process.env.E2E_DATABASE_URL || 'postgresql://postgres@127.0.0.1:5432/prisma'

// Inserta una transacción de bomba de prueba (no facturada) para que el flujo
// de combustible sea determinista. Devuelve el idVenta creado.
export async function seedFuelSale(): Promise<number> {
  const client = new Client({ connectionString: DATABASE_URL })
  await client.connect()
  try {
    const idVenta = Math.floor(Date.now() / 1000)
    await client.query(
      `INSERT INTO ventas_combustible
        (id_venta, numero_pos, numero_bomba, numero_manguera, monto, precio_unitario,
         volumen, numero_grado, tipo_transaccion, facturada)
       VALUES ($1, 1, 1, '1', 385, 38.5, 10, 1, '0', false)
       ON CONFLICT (id_venta) DO NOTHING`,
      [idVenta]
    )
    return idVenta
  } finally {
    await client.end()
  }
}

// Stub del puente de Electron (no existe en navegador) + URL del backend.
export async function preparePage(page: Page): Promise<void> {
  await page.addInitScript((backendUrl) => {
    localStorage.setItem('prisma:backend-url', backendUrl)
    ;(window as any).api = {
      printTicket: async () => ({ ok: true }),
      quitApp: () => {}
    }
  }, BACKEND_URL)
}

export async function login(page: Page): Promise<void> {
  await preparePage(page)
  await page.goto('/')
  await page.locator('input:not([type])').first().fill(E2E_USER)
  await page.locator('input[type="password"]').first().fill(E2E_PASSWORD)
  // Enter dispara handleSubmit (evita el footer flotante que intercepta el clic en Entrar).
  await page.locator('input[type="password"]').first().press('Enter')
  // Espera el POS (botón Productos / código de barras)
  await expect(page.getByPlaceholder(/Código de barras/)).toBeVisible({ timeout: 15000 })
}

// Abre un turno vía API si no hay uno abierto para el usuario.
export async function ensureOpenShift(page: Page): Promise<void> {
  const res = await page.request.get(
    `${BACKEND_URL}/api/shift/open?storeId=${STORE_ID}&employeeName=${E2E_USER}&posNo=${POS_NO}`
  )
  const data = await res.json()
  if (data && data.Shift) return
  await page.request.post(`${BACKEND_URL}/api/shift/open`, {
    data: {
      storeId: STORE_ID,
      posNo: POS_NO,
      employeeName: E2E_USER,
      initialAmount: 0
    }
  })
}

export async function addProductByCode(page: Page, code: string): Promise<void> {
  const input = page.getByPlaceholder(/Código de barras/)
  await input.fill(code)
  await page.getByRole('button', { name: 'Agregar' }).click()
}

export async function selectConsumidorFinal(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Consumidor Final/ }).click()
}

// Abre el cobro, agrega un pago en efectivo por el total y confirma.
export async function payWithCash(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Cobrar/ }).click()
  await expect(page.getByRole('button', { name: 'Confirmar pago' })).toBeVisible()
  await page.getByRole('button', { name: /EFECTIVO/ }).first().click()
  await page.getByRole('button', { name: 'Confirmar pago' }).click()
}

// Espera a que el checkout se cierre y devuelve la factura más reciente vía API
// (el toast es efímero, 3s, así que no es fiable para el assertion).
export async function waitSaleComplete(page: Page): Promise<string | null> {
  await page
    .getByRole('button', { name: 'Confirmar pago' })
    .waitFor({ state: 'detached', timeout: 15000 })
    .catch(() => {})
  await page.waitForTimeout(1000)
  const res = await page.request.get(
    `${BACKEND_URL}/api/invoices/search?storeId=${STORE_ID}&avanzado=false`
  )
  const docs = await res.json()
  return docs[0]?.['POS Sales Doc_ No_'] ?? null
}