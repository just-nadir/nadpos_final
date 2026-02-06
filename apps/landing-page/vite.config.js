import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Avoid React #525: ensure single copy of React (no duplicate from framer-motion etc.)
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
})
