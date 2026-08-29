// Seed de datos para los E2E (Playwright) contra un backend real.
// Crea un usuario con contraseña conocida y una transacción de bomba de prueba.
// Uso: node scripts/seed-e2e.mjs [DATABASE_URL]
import crypto from 'node:crypto'
import pg from 'pg'

const DATABASE_URL = process.env.E2E_DATABASE_URL || 'postgresql://postgres@127.0.0.1:5432/prisma'
const USER = process.env.E2E_USER || 'prueba'
const PASSWORD = process.env.E2E_PASSWORD || '1234'

function hashPassword(password) {
  const prf = 1
  const iterations = 100000
  const saltLength = 16
  const subkeyLength = 32
  const salt = crypto.randomBytes(saltLength)
  const subkey = crypto.pbkdf2Sync(password, salt, iterations, subkeyLength, 'sha256')
  const buf = Buffer.alloc(17 + saltLength + subkeyLength)
  buf[0] = 0x01
  buf.writeInt32BE(prf, 1)
  buf.writeInt32BE(iterations, 5)
  buf.writeInt32BE(saltLength, 9)
  buf.writeInt32BE(subkeyLength, 13)
  salt.copy(buf, 17)
  subkey.copy(buf, 17 + saltLength)
  return buf.toString('base64')
}

async function main() {
  const client = new pg.Client({ connectionString: DATABASE_URL })
  await client.connect()
  try {
    const hash = hashPassword(PASSWORD)
    await client.query(
      `INSERT INTO empleados (usuario, nombre, perfil, esta_activo, hash_contrasena)
       VALUES ($1, $2, 'Admin', true, $3)
       ON CONFLICT (usuario) DO UPDATE SET hash_contrasena = EXCLUDED.hash_contrasena, esta_activo = true`,
      [USER, USER, hash]
    )
    // POS 01 sin teclado virtual (interfiere con los clicks de Playwright).
    await client.query(
      `INSERT INTO configuracion_pos (codigo_pos, mostrar_teclado, mostrar_bombas, ocultar_boton_otras_bombas, num_transacciones_bombas, minutos_atrasada)
       VALUES ('01', false, true, false, 20, 10)
       ON CONFLICT (codigo_pos) DO UPDATE SET mostrar_teclado = false`,
    )
    // Transacción de bomba de prueba (no facturada) para el flujo de combustible.
    const idVenta = Math.floor(Date.now() / 1000)
    await client.query(
      `INSERT INTO ventas_combustible
        (id_venta, numero_pos, numero_bomba, numero_manguera, monto, precio_unitario,
         volumen, numero_grado, tipo_transaccion, facturada)
       VALUES ($1, 1, 1, '1', 385, 38.5, 10, 1, '0', false)
       ON CONFLICT (id_venta) DO NOTHING`,
      [idVenta]
    )
    console.log(`Seed E2E listo: usuario ${USER}/${PASSWORD}, ventaCombustible #${idVenta}`)
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('Seed E2E falló:', err.message)
  process.exit(1)
})