import { app, shell, BrowserWindow, ipcMain, screen, dialog } from 'electron'
import { join } from 'path'
import { printTicket, TicketData } from './printer'
import { ensureLicense, setLicenseContext } from './licensing'

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
    backgroundColor: '#0a0a0b',
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

app.whenReady().then(async () => {
  // En empaquetado, Electron no define NODE_ENV por sí solo; forzamos
  // 'production' para que el gate de licencia se comporte en modo real
  // (fallback de URL + sin bypass WAYNE_SKIP_LICENSE).
  if (app.isPackaged && !process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production'
  }

  ipcMain.handle('print:ticket', async (_event, payload: { backendUrl: string; printerPath: string; ticket: TicketData }) => {
    return printTicket(payload.backendUrl, payload.printerPath, payload.ticket)
  })

  ipcMain.on('app:quit', () => {
    app.quit()
  })

  // Contexto de licencia (tienda/POS) que el renderer envía desde la sesión.
  ipcMain.on('license:set-context', (_event, ctx: Record<string, unknown>) => {
    if (ctx && typeof ctx === 'object') {
      setLicenseContext(app.getPath('userData'), ctx)
    }
  })

  // Licencia: enrolamiento/validación. Bloquea el arranque si es inválida/suspendida.
  try {
    await ensureLicense(app.getPath('userData'))
  } catch (e) {
    dialog.showErrorBox('Licencia', (e as Error)?.message || 'Licencia inválida.')
    app.quit()
    return
  }

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
