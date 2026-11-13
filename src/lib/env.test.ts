import { expect, test } from 'vitest'

import { parseEnv } from '@/lib/env'

test.each(['https://api.example.com', 'http://localhost:3000', '/api'])(
  'accepts %s as the API URL',
  (url) => {
    expect(parseEnv({ VITE_API_URL: url })).toEqual({ VITE_API_URL: url })
  },
)

test.each(['//evil.example', 'ftp://api.example.com', 'api', undefined])(
  'rejects %s as the API URL',
  (url) => {
    expect(() => parseEnv({ VITE_API_URL: url })).toThrow(
      'Must be an http(s) URL or a path that starts with a single /',
    )
  },
)
