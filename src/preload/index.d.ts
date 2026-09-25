import type { TicketData } from '../main/printer'

export interface PosApi {
  printTicket(backendUrl: string, printerPath: string, ticket: TicketData): Promise<{ ok: boolean; previewPath?: string }>
  quitApp(): void
  setLicenseContext(ctx: {
    storeId?: string | null
    storeName?: string | null
    posNo?: string | null
    clientCode?: string | null
  }): void
}

declare global {
  interface Window {
    api: PosApi
  }
}

export {}
