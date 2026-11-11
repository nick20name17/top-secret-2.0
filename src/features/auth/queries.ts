import { type QueryClient, mutationOptions, queryOptions } from '@tanstack/react-query'
import { z } from 'zod/mini'

import { api } from '@/lib/api'
import { apiSchema } from '@/lib/api-schema'
import { setSession } from '@/lib/session'

const userSchema = apiSchema(
  'AuthUser',
  z.object({
    id: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
  }),
)

export function meQuery() {
  return queryOptions({
    queryKey: ['auth', 'me'],
    staleTime: Infinity,
    queryFn: ({ signal }) => api.get('auth/me', { signal }).json(userSchema),
  })
}

const loginResponseSchema = apiSchema(
  'LoginResponse',
  z.extend(userSchema, {
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
)

export function loginMutation(client: QueryClient) {
  return mutationOptions({
    mutationFn: (credentials: { username: string; password: string }) =>
      api.post('auth/login', { json: credentials }).json(loginResponseSchema),
    onSuccess: ({ accessToken, refreshToken, ...user }) => {
      client.removeQueries()
      setSession({ accessToken, refreshToken, userId: user.id })
      client.setQueryData(meQuery().queryKey, user)
    },
  })
}
