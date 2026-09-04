import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@puzzle-verse/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'colyseus': ['colyseus.js'],
          'icons': ['lucide-react'],
          'capacitor': ['@capacitor/core', '@capacitor/network', '@capacitor/status-bar'],
        }
      }
    }
  }
})

