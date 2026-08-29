import type { TicketData } from '../main/printer'

export interface PosApi {
  printTicket(backendUrl: string, printerPath: string, ticket: TicketData): Promise<{ ok: boolean }>
  quitApp(): void
}

declare global {
  interface Window {
    api: PosApi
  }
}

export {}
