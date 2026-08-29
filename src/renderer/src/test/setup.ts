import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// El puente de Electron (preload) no existe en jsdom; se mockea para que los
// tests de componentes no dependan de Electron real.
;(window as any).api = {
  printTicket: vi.fn().mockResolvedValue({ ok: true }),
  quitApp: vi.fn()
}