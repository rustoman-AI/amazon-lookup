import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Keep the web bundle separate from the backend build (server compiles to
    // ./dist). Without this, `vite build` would wipe the server's dist output.
    outDir: 'dist-web',
    emptyOutDir: true,
  },
})
