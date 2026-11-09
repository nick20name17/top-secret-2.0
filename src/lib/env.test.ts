import { expect, test } from 'vitest'

import { parseEnv } from '@/lib/env'

test.each(['https://dummyjson.com', 'http://localhost:3000', '/api'])(
  'accepts %s as the API URL',
  (url) => {
    expect(parseEnv({ VITE_API_URL: url })).toEqual({ VITE_API_URL: url })
  },
)

test.each(['//evil.example', 'ftp://example.com', 'api', '', undefined])(
  'rejects %s as the API URL',
  (url) => {
    expect(() => parseEnv({ VITE_API_URL: url })).toThrow('Invalid environment variables')
  },
)
