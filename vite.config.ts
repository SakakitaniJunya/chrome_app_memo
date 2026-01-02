import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs'

function copyExtensionFiles() {
  return {
    name: 'copy-extension-files',
    writeBundle() {
      const distDir = resolve(__dirname, 'dist')

      // Copy manifest.json
      copyFileSync(
        resolve(__dirname, 'manifest.json'),
        resolve(distDir, 'manifest.json')
      )

      // Copy images
      const imagesDir = resolve(__dirname, 'images')
      const distImagesDir = resolve(distDir, 'images')

      if (!existsSync(distImagesDir)) {
        mkdirSync(distImagesDir, { recursive: true })
      }

      if (existsSync(imagesDir)) {
        const files = readdirSync(imagesDir)
        for (const file of files) {
          copyFileSync(
            resolve(imagesDir, file),
            resolve(distImagesDir, file)
          )
        }
      }
    }
  }
}

export default defineConfig({
  plugins: [react(), copyExtensionFiles()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        options: resolve(__dirname, 'options.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
})
