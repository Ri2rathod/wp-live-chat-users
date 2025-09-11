import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { v4wp } from '@kucrut/vite-for-wp';
import tailwindcss from '@tailwindcss/vite'

import path from "path"
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    v4wp({
      input: {
        main: 'app/resources/main.tsx',
      },
      outDir: 'static',
    }),
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./app/resources"),
    },
  },
})
