import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    exclude: ['@noir-lang/backend_barretenberg', '@noir-lang/noir_js'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
  server: {
    // Headers removed - they conflict with Phantom wallet popup communication
    // Noir/Barretenberg WASM works without them in modern browsers
  },
  build: {
    target: 'esnext',
  },
})
