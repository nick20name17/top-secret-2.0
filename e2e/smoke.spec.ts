import { expect, test } from '@playwright/test'

test('unknown URL shows the not found page', async ({ page }) => {
  await page.goto('/does-not-exist')

  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  await expect(page).toHaveTitle('Page not found')
})

test.describe('theme', () => {
  test.use({ colorScheme: 'dark' })

  test('follows the system color scheme', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  })

  test('stored theme overrides the system one', async ({ page }) => {
    await page.addInitScript("localStorage.setItem('theme', 'light')")
    await page.goto('/')

    await expect(page.locator('html')).toHaveClass(/\blight\b/)
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#ffffff')
  })
})
