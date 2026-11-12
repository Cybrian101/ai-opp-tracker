import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In production (Vercel), /api/analyze is served automatically as a serverless
// function on the same origin, so no proxy is needed there. For local dev without a
// Vercel login, run `npm run dev:api` alongside `npm run dev` (or just
// `npm run dev:all`), and this proxy forwards /api calls to that local server.
// `vercel dev` also works locally if you're logged in, and needs no proxy either.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // The demo imports api/data/*.json as a normal module; let Vite serve those itself.
        bypass: (req) => (req.url.startsWith('/api/data/') ? req.url : undefined),
      },
    },
  },
})
