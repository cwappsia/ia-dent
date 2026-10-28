import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Envs do Supabase SEM o prefixo VITE_ (padrão escolhido) — libera pro bundle.
  envPrefix: ['SUPABASE_', 'VITE_'],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
