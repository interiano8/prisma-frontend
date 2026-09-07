// @ts-nocheck
import { contextBridge, ipcRenderer } from 'electron'
import type { TicketData } from '../main/printer'

const api = {
  printTicket: (backendUrl: string, printerPath: string, ticket: TicketData): Promise<{ ok: boolean; previewPath?: string }> =>
    ipcRenderer.invoke('print:ticket', { backendUrl, printerPath, ticket }),
  quitApp: (): void => ipcRenderer.send('app:quit')
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
