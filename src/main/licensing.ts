import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as crypto from 'crypto'
import { dialog } from 'electron'

const PRODUCT = 'PRISMA_FRONTEND'

/** URL por defecto del servicio de licencias (fallback si no hay env en producción). */
export const DEFAULT_SERVER_URL = 'https://licencias-api.prismapos.site'

const LICENSE_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAkhzVGUtB3PcIKtL5JlEI
YAtWjpi8e9rgH9wTHNamQfkIGcqNl5C3SJMnLzXQSEYVNJWj9qbH96qeUI1Df3TW
TbDaR9dOA0tWVWZngyoF+qHDD5y6z8ISZax64hgThaBKw5AjgZ08XYoWtXHRLz63
wWHtDM3J1ILq9+AbSiZNoXilkKT31u/rK46jMpRGga+idZ98214Z+HpM8ZgmVyTG
mhvfL6+unzBBZTNVQbHpcc/04EKS7I8Yv3tgt6T/jCDNMHVXX+HLzhJE+83DLVVI
5dHSruSyxefqYtnhrtkPG/QDzBC6W32JimO4N3r1rKaljXFqkncTtUmBIfd/bu0G
dQIDAQAB
-----END PUBLIC KEY-----`

// ===== Diagnóstico: log escrito junto a license.key =====

/** Escribe una línea en license.log (útil para soporte técnico). */
export function licLog(dir: string, msg: string): void {
  try {
    const p = path.join(dir, 'license.log')
    fs.appendFileSync(p, `[${new Date().toISOString()}] ${msg}\n`)
  } catch {
    // best-effort
  }
}

// ===== Identidad de máquina (resistente a clonado) =====

/** Ejecuta un comando y devuelve su salida (o null). */
function cmdOut(cmd: string): string | null {
  try {
    return require('child_process')
      .execSync(cmd, { encoding: 'utf8', windowsHide: true, timeout: 4000 })
      .trim()
  } catch {
    return null
  }
}

/** machine-id del SO (MachineGuid en Windows, /etc/machine-id en Linux). */
function soMachineId(): string | null {
  try {
    if (process.platform === 'win32') {
      const reg = cmdOut(
        'reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid'
      )
      const m = /MachineGuid\s+REG_SZ\s+([0-9a-fA-F-]+)/.exec(reg ?? '')
      if (m) return m[1]
      return null
    }
    for (const f of ['/etc/machine-id', '/var/lib/dbus/machine-id']) {
      if (fs.existsSync(f)) {
        const v = fs.readFileSync(f, 'utf8').trim()
        if (v) return v
      }
    }
    return null
  } catch {
    return null
  }
}

/** UUID de la placa/base (SMBIOS/DMI: firmware, no está en el disco). */
function boardUuid(): string | null {
  try {
    if (process.platform === 'win32') {
      const out = cmdOut('wmic csproduct get uuid /value')
      const m = /UUID=([0-9A-Fa-f-]{36})/.exec(out ?? '')
      return m ? m[1].toUpperCase() : null
    }
    for (const f of [
      '/sys/class/dmi/id/product_uuid',
      '/sys/class/dmi/id/board_serial'
    ]) {
      if (fs.existsSync(f)) {
        const v = fs.readFileSync(f, 'utf8').trim()
        if (v) return v
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Identidad cruda de la máquina: combina el machine-id del SO (MachineGuid /
 * /etc/machine-id) + el UUID de la placa (SMBIOS/DMI, del firmware). NO se usa la
 * MAC: con varios adaptadores (WiFi/ethernet/USB) cambiaría el id sin razón. Un
 * disco clonado a otro equipo lee el UUID del firmware del destino (distinto) →
 * no puede usar la licencia del original.
 */
let cachedRaw: string | null = null
function rawFingerprint(): string {
  if (cachedRaw) return cachedRaw
  const parts = [soMachineId(), boardUuid()].filter(
    (v): v is string => !!v
  )
  cachedRaw =
    parts.length > 0
      ? parts.join('|')
      : `${os.hostname()}|${os.platform()}|${os.arch()}`
  return cachedRaw
}

function formatMachineId(hex: string): string {
  const clean = hex.padStart(16, '0').slice(0, 16).toUpperCase()
  return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}`
}

/** Fingerprint de la máquina con scope de producto. */
export function getMachineId(): string {
  const hex = crypto
    .createHash('sha256')
    .update(`${rawFingerprint()}|${PRODUCT}`)
    .digest('hex')
  return formatMachineId(hex)
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Genera (una vez) el par de llaves del dispositivo y devuelve la pública (PEM SPKI). */
function ensureDeviceKeypair(dir: string): string {
  const keyPath = path.join(dir, 'device.key')
  const pubPath = path.join(dir, 'device.pub')
  if (fs.existsSync(keyPath) && fs.existsSync(pubPath)) {
    return fs.readFileSync(pubPath, 'utf8')
  }
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  })
  fs.writeFileSync(keyPath, privateKey, { mode: 0o600 })
  fs.writeFileSync(pubPath, publicKey)
  return publicKey
}

function serverUrl(): string {
  const v = (process.env.LICENSING_SERVER_URL || '').trim().replace(/\/+$/, '')
  if (v) return v
  // Si no hay env, apunta al servicio de licencias (obligatorio). El modo
  // offline solo se fuerza explícitamente con LICENSING_OFFLINE=1.
  return process.env.LICENSING_OFFLINE === '1' ? '' : DEFAULT_SERVER_URL.replace(/\/+$/, '')
}

export interface LicenseContext {
  clientCode?: string | null
  storeName?: string | null
  storeId?: string | null
  posNo?: string | null
}

function contextPath(dir: string): string {
  return path.join(dir, 'license-context.json')
}

/** Persiste el contexto de licencia (tienda/POS/cliente) desde la sesión del renderer. */
export function setLicenseContext(dir: string, ctx: LicenseContext): void {
  try {
    fs.writeFileSync(contextPath(dir), JSON.stringify(ctx))
  } catch {
    // best-effort
  }
}

/** Contexto: del archivo persistido (sesión), o de las variables de entorno. */
function readContext(dir: string): Required<LicenseContext> {
  let file: LicenseContext = {}
  try {
    file = JSON.parse(fs.readFileSync(contextPath(dir), 'utf8')) as LicenseContext
  } catch {
    // sin archivo persistido
  }
  return {
    clientCode:
      file.clientCode ?? process.env.LICENSING_CLIENT_CODE ?? process.env.CLIENT_CODE ?? null,
    storeName: file.storeName ?? process.env.STORE_NAME ?? null,
    storeId: file.storeId ?? process.env.STORE_ID ?? null,
    posNo: file.posNo ?? process.env.POS_NO ?? null
  }
}

export interface LicenseDiagnosis {
  ok: boolean
  /** Razón corta y clara en español (para el diálogo). */
  reason: string
}

/**
 * Valida license.key y devuelve un diagnóstico claro. Escribe en license.log
 * el detalle (machineId local vs el de la licencia, causa exacta).
 */
export function diagnoseLicense(licensePath: string, dir: string): LicenseDiagnosis {
  const local = getMachineId()
  const ref = path.basename(licensePath)
  const fail = (reason: string): LicenseDiagnosis => {
    licLog(dir, `LICENCIA INVÁLIDA (${ref}): ${reason}. Machine ID local: ${local}.`)
    return { ok: false, reason }
  }
  if (!fs.existsSync(licensePath)) {
    licLog(dir, `No existe ${ref}. Machine ID local: ${local}.`)
    return {
      ok: false,
      reason:
        'No se encontró el archivo de licencia (license.key). ' +
        'El POS debe conectarse a internet en su primera activación para pedir y ' +
        'recibir su licencia desde el panel de administración.'
    }
  }
  try {
    const payload = JSON.parse(fs.readFileSync(licensePath, 'utf8')) as {
      machineId?: string
      issuedTo?: string
      expiresUtc?: string
      signature?: string
    }
    if (!payload.machineId || !payload.signature) {
      return fail('el archivo license.key está incompleto (falta machineId o firma)')
    }
    if (payload.machineId.toUpperCase() !== local) {
      return fail(
        `el archivo es para otra máquina. Machine ID en la licencia: ${payload.machineId}; ` +
          `Machine ID de esta máquina: ${local}.`
      )
    }
    if (payload.expiresUtc && new Date(payload.expiresUtc).getTime() < Date.now()) {
      return fail(`la licencia venció el ${new Date(payload.expiresUtc).toISOString()}`)
    }
    const data = Buffer.from(
      `${payload.machineId}|${payload.issuedTo ?? ''}|${payload.expiresUtc ?? ''}`,
      'utf8'
    )
    const verified = crypto.verify(
      'RSA-SHA256',
      data,
      LICENSE_PUBLIC_KEY,
      Buffer.from(payload.signature, 'base64')
    )
    if (!verified) {
      return fail(
        'la firma es inválida. Posible causa: el POS se actualizó con una llave ' +
          'pública diferente a la del servidor de licencias. '
      )
    }
    licLog(dir, `Licencia válida. Machine ID: ${local}.`)
    return { ok: true, reason: '' }
  } catch (err) {
    return fail(`license.key no es un JSON válido: ${(err as Error).message}`)
  }
}

/** Valida y lanza un Error con mensaje claro (para el diálogo del POS). */
export function validateLicense(licensePath: string, dir: string): void {
  const d = diagnoseLicense(licensePath, dir)
  if (!d.ok) throw new Error(d.reason)
}

async function enroll(
  server: string,
  licensePath: string,
  ctx: Required<LicenseContext>
): Promise<void> {
  const machineId = getMachineId()
  const dir = path.dirname(licensePath)
  let ok = false
  let httpError = ''
  try {
    const res = await fetch(`${server}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        machineId,
        publicKey: ensureDeviceKeypair(dir),
        product: PRODUCT,
        clientCode: ctx.clientCode,
        storeName: ctx.storeName,
        storeId: ctx.storeId,
        posNo: ctx.posNo
      })
    })
    ok = res.ok
    if (!ok && res.status === 409) httpError = 'el fabricante ya tiene una solicitud pendiente'
  } catch (e) {
    ok = false
    httpError = (e as Error)?.message || 'error de red'
  }
  if (!ok) {
    const msg =
      `No se pudo contactar el servicio de licencias para activar el POS ` +
      `(${server}). ${httpError ? `Detalle: ${httpError}. ` : ''}` +
      `Revise su conexión a internet y que la URL ${server} sea accesible.`
    licLog(dir, `ERROR EN ENROLAMIENTO: ${msg}`)
    throw new Error(msg)
  }
  licLog(dir, `Solicitud de activación enviada (machine ${machineId}). Pendiente de aprobación.`)

  const pollMs = Math.max(1000, Number(process.env.LICENSING_POLL_MS ?? 10000))
  const maxAttempts = Number(process.env.LICENSING_ENROLL_MAX_ATTEMPTS ?? 0)
  let notified = false
  for (let i = 0; maxAttempts === 0 || i < maxAttempts; i++) {
    await delay(pollMs)
    try {
      const res = await fetch(`${server}/license?machineId=${encodeURIComponent(machineId)}`)
      if (res.ok) {
        const data = (await res.json()) as { license?: unknown; revoked?: boolean; suspended?: boolean }
        if (data?.revoked) throw new Error('La solicitud de activación fue rechazada.')
        if (data?.suspended) throw new Error('La solicitud de activación está suspendida.')
        if (data?.license) {
          fs.writeFileSync(licensePath, JSON.stringify(data.license))
          licLog(dir, 'Licencia recibida y guardada.')
          return
        }
        // Sigue PENDIENTE: avisar al usuario una sola vez (no molestar repetidamente).
        if (!notified) {
          notified = true
          licLog(dir, `Esperando aprobación de licencia (machine ${machineId}).`)
          try {
            await dialog.showMessageBox({
              type: 'info',
              title: 'Licencia pendiente',
              message: 'Su licencia está pendiente de aprobación.',
              detail:
                `Machine ID: ${machineId}\n\n` +
                'Este equipo ya envió su solicitud. En cuanto la licencia sea ' +
                'aprobada, la aplicación continuará automáticamente.',
              buttons: ['Entendido'],
              noLink: true,
            })
          } catch {
            // sin ventana aún: solo log
          }
        }
      }
    } catch (e) {
      if (e instanceof Error && (e.message.startsWith('La solicitud') || e.message.startsWith('La activación'))) throw e
    }
  }
  throw new Error(
    'La activación no fue aprobada a tiempo. Aprovéela en el panel de licencias ' +
      '(aparece como Pendiente) y reinicie el POS.'
  )
}

async function phoneHome(
  server: string,
  licensePath: string,
  dir: string
): Promise<{ verdict: string; next?: number }> {
  try {
    const license = JSON.parse(fs.readFileSync(licensePath, 'utf8'))
    const res = await fetch(`${server}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineId: getMachineId(), license })
    })
    if (!res.ok) {
      licLog(dir, `Validación con el servidor falló (HTTP ${res.status}); se sigue sin conexión (best-effort).`)
      return { verdict: 'unreachable' }
    }
    const data = (await res.json()) as { ok?: boolean; revoked?: boolean; suspended?: boolean; notFound?: boolean; nextRevalidateSeconds?: number }
    if (data?.revoked) return { verdict: 'revoked' }
    if (data?.suspended) return { verdict: 'suspended' }
    if (data?.notFound) return { verdict: 'notFound' }
    if (data?.ok) return { verdict: 'ok', next: data.nextRevalidateSeconds }
    return { verdict: 'unreachable' }
  } catch {
    return { verdict: 'unreachable' }
  }
}

/** Re-enrola como la primera vez si la licencia fue eliminada en la nube. */
async function reEnroll(server: string, licensePath: string, dir: string): Promise<void> {
  licLog(dir, 'La licencia ya no existe en la nube; re-enrolamiento como la primera vez.')
  try {
    fs.unlinkSync(licensePath)
  } catch {
    // sin archivo
  }
  await enroll(server, licensePath, readContext(dir))
}

/**
 * Gate del frontend: enrola si no hay licencia (con servidor), valida offline y
 * revalida con heartbeat. Lanza si debe bloquearse (suspendido/revocado/inválido).
 */
export async function ensureLicense(dir: string): Promise<void> {
  if (process.env.NODE_ENV !== 'production' && process.env.WAYNE_SKIP_LICENSE === '1') return

  const licensePath = path.join(dir, 'license.key')
  const server = serverUrl()
  licLog(dir, '--- Inicio de validación de licencia ---')

  if (!fs.existsSync(licensePath)) {
    if (server) {
      await enroll(server, licensePath, readContext(dir))
    } else {
      throw new Error('No se encontró el archivo de licencia (license.key). Configure el servidor de licencias.')
    }
  }

  validateLicense(licensePath, dir)

  if (server) {
    const r = await phoneHome(server, licensePath, dir)
    if (r.verdict === 'revoked') throw new Error('Licencia revocada por el servidor. Contacte a soporte.')
    if (r.verdict === 'suspended') throw new Error('Licencia suspendida por el servidor. Contacte a soporte.')
    if (r.verdict === 'notFound') await reEnroll(server, licensePath, dir)

    let seconds = r.next && r.next > 0 ? r.next : 18000
    const tick = async (): Promise<void> => {
      setTimeout(async () => {
        const v = await phoneHome(server, licensePath, dir)
        if (v.verdict === 'revoked' || v.verdict === 'suspended') {
          licLog(dir, `LICENCIA ${v.verdict}; deteniendo el POS.`)
          console.error(`[LICENSE] ${v.verdict}; deteniendo el POS.`)
          process.exit(1)
        }
        if (v.verdict === 'notFound') await reEnroll(server, licensePath, dir)
        if (v.next && v.next > 0) seconds = v.next
        void tick()
      }, Math.max(5, seconds) * 1000).unref?.()
    }
    void tick()
  }
}