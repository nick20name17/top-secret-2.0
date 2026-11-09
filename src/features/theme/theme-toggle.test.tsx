import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'

import { ThemeProvider } from '@/features/theme/theme-provider'
import { ThemeToggle } from '@/features/theme/theme-toggle'

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  )
}

test('the toggle switches between dark and light and remembers the choice', async () => {
  const toggle = await renderToggle()
  const html = document.documentElement

  await userEvent.click(page.getByRole('button', { name: 'Toggle theme' }))
  await expect.poll(() => html.className).toMatch(/\bdark\b/)

  await toggle.unmount()
  await renderToggle()
  await expect.poll(() => html.className).toMatch(/\bdark\b/)

  await userEvent.click(page.getByRole('button', { name: 'Toggle theme' }))
  await expect.poll(() => html.className).toMatch(/\blight\b/)
})
