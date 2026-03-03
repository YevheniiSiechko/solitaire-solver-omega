import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/solitaire-solver-omega/',
  plugins: [react()],
  server: {
    port: 8080,
    host: true
  }
})
