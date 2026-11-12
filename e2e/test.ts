import { test as base, expect } from '@playwright/test'
import { loadEnv } from 'vite'

const { VITE_API_URL: apiUrl = '' } = loadEnv('production', process.cwd())

// The recorded responses the unit tests use
const fixtures: Record<string, string> = {
  'POST /auth/login': 'auth-login.json',
  'GET /auth/me': 'users-1.json',
  'GET /products': 'products.json',
  'GET /products/1': 'products-1.json',
}

export const test = base.extend<{ app: undefined }>({
  app: [
    async ({ page }, use) => {
      const errors: Error[] = []
      page.on('pageerror', (error) => errors.push(error))
      // No run reaches the network: an API request gets its recorded response, any other one fails
      await page.route(
        (url) => url.hostname !== 'localhost' || url.pathname.startsWith(apiUrl),
        (route) => {
          const request = route.request()
          const url = new URL(request.url())
          const path = (url.origin + url.pathname).split(apiUrl)[1]
          const key = `${request.method()} ${path}`
          if (fixtures[key]) {
            return route.fulfill({
              path: `src/test/fixtures/${fixtures[key]}`,
              headers: { 'access-control-allow-origin': '*' },
            })
          }
          if (request.url().includes(apiUrl))
            errors.push(new Error(`No fixture for ${key} in e2e/test.ts`))
          return route.abort()
        },
      )
      await use(undefined)
      expect(errors).toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
