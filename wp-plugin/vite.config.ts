import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { v4wp } from '@kucrut/vite-for-wp';

import path from "path"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(),
  v4wp({
    input: {
      main: 'app/resources/main.tsx',
    },
    outDir: 'static',
  }),
  react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "/app/resources"),
    },
  },
})
