import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { msw } from 'msw/vite'
import { defineConfig } from 'vitest/config'

import { parseEnv } from './src/lib/env.ts'

export default defineConfig(({ mode }) => ({
  plugins: [
    tanstackRouter({ autoCodeSplitting: true }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    {
      name: 'validate-env',
      configResolved: (config) => {
        parseEnv(config.env)
      },
    },
    mode === 'test' && msw({ mode: 'worker-only' }),
  ],
  resolve: { tsconfigPaths: true },
  optimizeDeps: { force: mode === 'test' },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    browser: {
      enabled: true,
      provider: playwright({ contextOptions: { colorScheme: 'light' } }),
      headless: true,
      instances: [{ browser: 'chromium' }],
    },
  },
}))
