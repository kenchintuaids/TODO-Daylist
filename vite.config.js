import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base so the build works when hosted from a subpath
  // (GitHub Pages project sites, S3/behind a reverse-proxy prefix, etc.)
  // Static-root hosts like Vercel/Netlify/Cloudflare Pages work fine with this too.
  base: './',
  build: {
    // The app bundles recharts + lucide-react into one chunk; this just
    // silences Vite's default 500kb warning for that single-chunk size.
    chunkSizeWarningLimit: 900,
  },
})
