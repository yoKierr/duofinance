import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    // Bind mounts on macOS/Windows Docker often miss fs events; polling fixes HMR in containers.
    watch: {
      usePolling: process.env.VITE_USE_POLLING === '1',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})