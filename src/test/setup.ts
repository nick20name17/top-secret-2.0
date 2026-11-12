// Real styles: without them shadcn controls have no size and cannot be clicked
import '@/index.css'
import { afterEach, beforeAll, beforeEach, expect, onTestFinished, vi } from 'vitest'

import { startWorker, worker } from '@/test/msw'

const consoleError = vi.spyOn(console, 'error').mockName('console.error')

beforeAll(startWorker)

beforeEach(() => {
  onTestFinished(() => {
    expect(
      vi.isFakeTimers(),
      'Restore real timers: onTestFinished(() => void vi.useRealTimers())',
    ).toBe(false)
  })
})

afterEach(() => {
  worker.resetHandlers()
  expect(
    consoleError,
    'If the test expects the error (React logs every error a boundary catches), assert it, then call vi.mocked(console.error).mockClear()',
  ).not.toHaveBeenCalled()
  localStorage.clear()
})
