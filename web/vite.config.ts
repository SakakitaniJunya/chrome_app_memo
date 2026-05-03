import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

const root = resolve(__dirname)
const repoRoot = resolve(__dirname, "..")

export default defineConfig({
  root,
  publicDir: resolve(root, "public"),
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^@\/hooks\/use-chrome-storage$/,
        replacement: resolve(root, "src/hooks/use-chrome-storage.ts"),
      },
      {
        find: "@",
        replacement: resolve(repoRoot, "src"),
      },
    ],
  },
  server: {
    port: 5174,
    strictPort: false,
  },
  preview: {
    port: 4174,
    strictPort: false,
  },
  build: {
    outDir: resolve(repoRoot, "web-dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(root, "index.html"),
      },
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
})
