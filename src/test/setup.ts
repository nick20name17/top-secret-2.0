import { afterEach, expect, vi } from 'vitest'

const consoleError = vi.spyOn(console, 'error').mockName('console.error')

afterEach(() => {
  expect(
    consoleError,
    'If the test expects the error (React logs every error a boundary catches), assert it, then call vi.mocked(console.error).mockClear()',
  ).not.toHaveBeenCalled()
  localStorage.clear()
})
