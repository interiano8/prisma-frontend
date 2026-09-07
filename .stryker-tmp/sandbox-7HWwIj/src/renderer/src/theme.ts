// @ts-nocheck
export type Theme = 'dark' | 'light'

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const num = parseInt(full, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

function shade(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex)
  const s = (v: number) => Math.max(0, Math.min(255, Math.round(v * factor)))
  return `#${[s(r), s(g), s(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export function getStoredTheme(): Theme {
  return localStorage.getItem('prisma:theme') === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
  localStorage.setItem('prisma:theme', theme)
}

export function getStoredAccent(): string {
  return localStorage.getItem('prisma:accent') || '#0070f3'
}

export function applyAccent(hex: string): void {
  const { r, g, b } = hexToRgb(hex)
  const hover = hexToRgb(shade(hex, 0.88))
  const root = document.documentElement
  root.style.setProperty('--accent', `${r} ${g} ${b}`)
  root.style.setProperty('--accent-hover', `${hover.r} ${hover.g} ${hover.b}`)
  localStorage.setItem('prisma:accent', hex)
}
