import { app, shell, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { printTicket, TicketData } from './printer'

function iconPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'resources', 'icon.png')
  }
  return join(__dirname, '../../resources/icon.png')
}

function createWindow(): void {
  // Abrir en el monitor principal
  const primary = screen.getPrimaryDisplay()
  const { x, y, width, height } = primary.bounds

  const mainWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    fullscreen: true,
    icon: iconPath(),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // F11 alterna pantalla completa
  mainWindow.webContents.on('before-input-event', (_event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen())
      _event.preventDefault()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  ipcMain.handle('print:ticket', async (_event, payload: { backendUrl: string; printerPath: string; ticket: TicketData }) => {
    await printTicket(payload.backendUrl, payload.printerPath, payload.ticket)
    return { ok: true }
  })

  ipcMain.on('app:quit', () => {
    app.quit()
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
