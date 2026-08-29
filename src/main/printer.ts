import * as net from 'net'

export interface TicketLine {
  text: string
  align?: 'left' | 'center' | 'right'
  bold?: boolean
  size?: 'normal' | 'large'
}

export interface TicketData {
  lines: TicketLine[]
  cut?: boolean
  columns?: number // 32 (80mm) o 48 (58mm)
}

const ESC = 0x1b
const GS = 0x1d

function looksLikeIp(path: string): boolean {
  return /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(:[0-9]{1,5})?$/.test(path)
}

function splitText(text: string, columns: number): string[] {
  if (!text) return ['']
  const out: string[] = []
  for (const raw of text.split('\n')) {
    if (raw.length <= columns) {
      out.push(raw)
      continue
    }
    let rest = raw
    while (rest.length > columns) {
      out.push(rest.substring(0, columns))
      rest = rest.substring(columns)
    }
    if (rest.length > 0 || raw.length === 0) out.push(rest)
  }
  return out
}

function pad(text: string, columns: number, align: 'left' | 'center' | 'right'): string {
  const s = text ?? ''
  if (s.length >= columns) return s.substring(0, columns)
  if (align === 'right') return s.padStart(columns, ' ')
  if (align === 'center') {
    const left = Math.floor((columns - s.length) / 2)
    return ' '.repeat(left) + s
  }
  return s.padEnd(columns, ' ')
}

export function buildEscPos(ticket: TicketData): Buffer {
  const columns = ticket.columns || 48
  const chunks: Buffer[] = []

  // init
  chunks.push(Buffer.from([ESC, 0x40]))

  for (const line of ticket.lines) {
    if (line.size === 'large') {
      chunks.push(Buffer.from([GS, 0x21, 0x11])) // doble alto y ancho
    } else if (line.bold) {
      chunks.push(Buffer.from([ESC, 0x45, 0x01]))
    }

    if (line.align === 'center') chunks.push(Buffer.from([ESC, 0x61, 0x01]))
    else if (line.align === 'right') chunks.push(Buffer.from([ESC, 0x61, 0x02]))
    else chunks.push(Buffer.from([ESC, 0x61, 0x00]))

    for (const part of splitText(line.text, columns)) {
      chunks.push(Buffer.from(pad(part, columns, line.align || 'left'), 'latin1'))
      chunks.push(Buffer.from([0x0a]))
    }

    // reset format
    if (line.size === 'large') chunks.push(Buffer.from([GS, 0x21, 0x00]))
    if (line.bold) chunks.push(Buffer.from([ESC, 0x45, 0x00]))
  }

  chunks.push(Buffer.from([0x0a, 0x0a, 0x0a]))

  if (ticket.cut !== false) {
    chunks.push(Buffer.from([GS, 0x56, 0x42, 0x01])) // corte parcial
  }

  return Buffer.concat(chunks)
}

export function printToTcp(host: string, port: number, data: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = new net.Socket()
    client.on('error', reject)
    client.connect(port, host, () => {
      client.write(data, (err) => {
        client.end()
        if (err) reject(err)
        else resolve()
      })
    })
  })
}

export async function printViaBackend(
  backendUrl: string,
  printerPath: string,
  data: Buffer
): Promise<void> {
  const res = await fetch(`${backendUrl}/api/printer/print`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ printerPath, bytesBase64: data.toString('base64') })
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Backend print error (${res.status}): ${text}`)
  }
}

export async function printTicket(
  backendUrl: string,
  printerPath: string,
  ticket: TicketData
): Promise<void> {
  const buffer = buildEscPos(ticket)
  if (looksLikeIp(printerPath)) {
    const parts = printerPath.split(':')
    const host = parts[0]
    const port = parts.length > 1 ? parseInt(parts[1], 10) : 9100
    await printToTcp(host, port, buffer)
  } else if (printerPath) {
    await printViaBackend(backendUrl, printerPath, buffer)
  } else {
    throw new Error('No hay impresora configurada.')
  }
}
