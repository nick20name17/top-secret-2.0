import { expect, test } from 'vitest'
import { z } from 'zod/mini'

import { stored } from '@/lib/stored'

test('a stored value stays the same object until it is set again', () => {
  const list = stored('stored-test', z.array(z.string()))

  list.set(['a'])
  const first = list.get()
  expect(first).toEqual(['a'])
  expect(list.get()).toBe(first)

  list.set(['a', 'b'])
  expect(list.get()).toEqual(['a', 'b'])
})
