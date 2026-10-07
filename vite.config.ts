/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Rutas relativas para que el mismo build sirva luego en GitHub Pages
  base: './',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    // Los formularios se prueban tecleando campo a campo; en runners lentos (CI) supera los 5 s por defecto
    testTimeout: 20_000,
  },
})
