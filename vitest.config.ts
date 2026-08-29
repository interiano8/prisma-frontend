import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@renderer': resolve('src/renderer/src')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/renderer/src/test/setup.ts'],
    include: ['src/renderer/src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/renderer/src/lib/**/*.ts',
        'src/renderer/src/components/CodeInputRow.tsx',
        'src/renderer/src/components/CartPanel.tsx',
        'src/renderer/src/components/CheckoutModal.tsx',
        'src/renderer/src/components/ProductModal.tsx'
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      }
    }
  }
})