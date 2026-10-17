import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // ponytail: polling porque o bind-mount vindo do Windows não propaga inotify
    watch: { usePolling: true },
    // Túnel ngrok muda de subdomínio a cada sessão - libera o domínio inteiro.
    allowedHosts: ['.ngrok-free.dev'],
    // O front nunca conhece a URL da API - só chama /api/... e o Vite repassa.
    proxy: { '/api': 'http://api:7100' },
  },
})
