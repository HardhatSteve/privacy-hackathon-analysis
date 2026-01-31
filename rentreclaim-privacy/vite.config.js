import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'solana-core': ['@solana/web3.js', '@solana/spl-token'],
          'wallet-adapters': [
            '@solana/wallet-adapter-react',
            '@solana/wallet-adapter-phantom',
            '@solana/wallet-adapter-solflare',
            '@solana/wallet-adapter-base'
          ],
          'wallet-ui': ['@solana/wallet-adapter-react-ui']
        }
      }
    }
  }
})
