import path from 'node:path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    passWithNoTests: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      app: path.resolve(__dirname, './app'),
    },
  },
})
