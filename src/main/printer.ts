import * as net from 'net'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

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

import { Printer, InMemory, Style, Align } from 'escpos-buffer'

function looksLikeIp(path: string): boolean {
  return /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(:[0-9]{1,5})?$/.test(path)
}

export async function buildEscPos(ticket: TicketData): Promise<Buffer> {
  const connection = new InMemory()
  const printer = await Printer.CONNECT('MP-4200 TH', connection)
  if (ticket.columns) await printer.setColumns(ticket.columns)
  for (const line of ticket.lines) {
    let style = 0
    if (line.size === 'large') style = Style.DoubleWidth | Style.DoubleHeight
    else if (line.bold) style = Style.Bold
    const align =
      line.align === 'center'
        ? Align.Center
        : line.align === 'right'
          ? Align.Right
          : Align.Left
    await printer.writeln(line.text, style, align)
  }
  await printer.feed(2)
  if (ticket.cut !== false) await printer.cutter()
  return connection.buffer as unknown as Buffer
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

function wrapText(text: string, width: number): string[] {
  if (text.length <= width) return [text]
  const words = text.split(' ')
  const out: string[] = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > width) {
      if (cur) out.push(cur.trim())
      cur = w
      while (cur.length > width) {
        out.push(cur.slice(0, width))
        cur = cur.slice(width)
      }
    } else {
      cur = (cur + ' ' + w).trim()
    }
  }
  if (cur) out.push(cur.trim())
  return out.length ? out : [text]
}

function padCenter(s: string, width: number): string {
  const diff = width - s.length
  if (diff <= 0) return s
  const left = Math.floor(diff / 2)
  return ' '.repeat(left) + s + ' '.repeat(diff - left)
}

export function renderTicketText(ticket: TicketData): string {
  const columns = ticket.columns || 48
  const out: string[] = []
  for (const line of ticket.lines) {
    const text = line.text || ''
    const width = line.size === 'large' ? columns : columns
    const wrapped = wrapText(text, width)
    for (const w of wrapped) {
      if (line.align === 'center') out.push(padCenter(w, columns))
      else if (line.align === 'right') out.push(w.padStart(columns))
      else out.push(w.padEnd(columns))
    }
  }
  return out.join('\n') + '\n'
}

export async function writePreview(ticket: TicketData): Promise<string> {
  const columns = ticket.columns || 48
  const dir = path.join(os.homedir(), 'prisma-preview')
  fs.mkdirSync(dir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const file = path.join(dir, `ticket-${stamp}.txt`)
  const header = `PRISMA PREVIEW · columnas=${columns}\n${'-'.repeat(columns)}\n`
  fs.writeFileSync(file, header + renderTicketText(ticket))
  return file
}

export async function printTicket(
  backendUrl: string,
  printerPath: string,
  ticket: TicketData
): Promise<{ ok: boolean; previewPath?: string }> {
  const path = !printerPath || printerPath === 'default' ? 'default' : printerPath
  if (path === 'preview') {
    const previewPath = await writePreview(ticket)
    return { ok: true, previewPath }
  }
  const buffer = await buildEscPos(ticket)
  if (looksLikeIp(path)) {
    const parts = path.split(':')
    const host = parts[0]
    const port = parts.length > 1 ? parseInt(parts[1], 10) : 9100
    await printToTcp(host, port, buffer)
  } else {
    await printViaBackend(backendUrl, path, buffer)
  }
  return { ok: true }
}
