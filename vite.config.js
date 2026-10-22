import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    allowedHosts: 'e60b-2402-8100-24ed-6c0e-3d2a-b9e6-a7ae-6b2f.ngrok-free.app/'
  }
})
