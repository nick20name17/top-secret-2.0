import { expect, test } from './test.ts'

test('signing in from a protected page opens it, and the session survives a reload', async ({
  page,
}) => {
  await page.goto('/profile')
  await expect(page).toHaveURL('/login?redirect=%2Fprofile')

  await page.getByLabel('Username').fill('emilys')
  await page.getByLabel('Password').fill('emilyspass')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Emily Johnson' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Emily Johnson' })).toBeVisible()
  await expect(page).toHaveURL('/profile')
})

test('a direct link to a product opens it and names the tab after it', async ({ page }) => {
  await page.goto('/products/1')

  await expect(page.getByRole('heading', { name: 'Essence Mascara Lash Princess' })).toBeVisible()
  await expect(page).toHaveTitle('Essence Mascara Lash Princess')
})

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
