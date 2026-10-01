import { defineConfig } from 'vitest/config'

// Pruebas de permisos contra Supabase local (requiere `npm run db:start`)
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rls/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
})
