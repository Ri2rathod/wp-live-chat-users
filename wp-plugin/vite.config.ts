import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { v4wp } from '@kucrut/vite-for-wp';
import tailwindcss from '@tailwindcss/vite'

import path from "path"
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    v4wp({
      input: {
        main: 'app/resources/main.tsx',
        'main-admin': 'app/resources/main-admin.tsx',
      },
      outDir: 'static',
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./app/resources"),
    },
  },
  server: {
    host: '192.168.193.212',
    cors: true
  }
})
