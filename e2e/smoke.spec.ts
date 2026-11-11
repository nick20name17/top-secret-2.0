import { expect, test } from '@playwright/test'

test.describe('theme', () => {
  test.use({ colorScheme: 'dark' })

  test('follows the system theme', async ({ page }) => {
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
