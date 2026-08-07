import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'


export default defineConfig({
  // Path-based deployment: set VITE_BASE_PATH=/makhana-admin at build time
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), tailwindcss()],

})
