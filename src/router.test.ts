import { expect, test } from 'vitest'

import { parseSearch, stringifySearch } from '@/router'

test('a repeated search param is read as a list', () => {
  expect(parseSearch('?tag=a&tag=b&q=phone')).toEqual({ tag: ['a', 'b'], q: 'phone' })
})

test('a list is written as a repeated search param', () => {
  expect(stringifySearch({ tag: ['a', 'b'], q: 'phone', page: 2, unset: undefined })).toBe(
    '?tag=a&tag=b&q=phone&page=2',
  )
})

test('an empty search writes nothing', () => {
  expect(stringifySearch({ tag: [], unset: undefined })).toBe('')
})
