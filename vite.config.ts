import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static build — the whole app is client-side. Deploys anywhere that serves files.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    target: 'es2022',
    assetsInlineLimit: 0, // keep the woff2 files as real files so @font-face works
  },
})
