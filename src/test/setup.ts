// Real styles: without them shadcn controls have no size and cannot be clicked
import '@/index.css'
import { afterEach, beforeAll, beforeEach, expect, onTestFinished, vi } from 'vitest'

import { startWorker, worker } from '@/test/msw'
import { expectSoundPage } from '@/test/page-checks'

const consoleError = vi.spyOn(console, 'error').mockName('console.error')

// A font that arrives after the first render changes the width of text; the app preloads it in index.html
beforeAll(() => Promise.all([startWorker(), ...Array.from(document.fonts, (font) => font.load())]))

beforeEach(() => {
  onTestFinished(async () => {
    expect(
      vi.isFakeTimers(),
      'Restore real timers: onTestFinished(() => void vi.useRealTimers())',
    ).toBe(false)
    await expectSoundPage()
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
