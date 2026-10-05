import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vitest/config'

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'analyze' &&
      visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true, template: 'treemap' }),
  ],
  resolve: {
    alias: {
      '@app': fromRoot('./src/app'),
      '@game': fromRoot('./src/game'),
      '@shared': fromRoot('./src/shared'),
      '@test': fromRoot('./src/test'),
    },
  },
  build: {
    // Rapier inlines ~2.2 MB of base64 WASM; keep it and three in their own long-lived cacheable chunks.
    chunkSizeWarningLimit: 2500,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'rapier', test: /node_modules[\\/]@dimforge[\\/]/ },
            { name: 'three', test: /node_modules[\\/](three|three-stdlib|@react-three)[\\/]/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
  optimizeDeps: {
    // Pre-bundling the inlined-WASM build can make RAPIER.init() hang in dev (PLAN D1).
    exclude: ['@dimforge/rapier3d-compat'],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
}))
