import ky, { type KyRequest, isHTTPError, isNetworkError, isTimeoutError } from 'ky'
import { z } from 'zod/mini'

import { apiSchema } from '@/lib/api-schema'
import { type Session, clearSession, getSession, setSession, tokensSchema } from '@/lib/session'

const base = ky.create({
  prefix: import.meta.env.VITE_API_URL,
  totalTimeout: 15_000,
  retry: { jitter: true, maxRetryAfter: 5000 },
})

function setToken({ request }: { request: KyRequest }) {
  const session = getSession()
  if (session) request.headers.set('Authorization', `Bearer ${session.accessToken}`)
}

function refreshSession(sentAuthorization: string | null) {
  return navigator.locks.request('session-refresh', async (): Promise<Session | undefined> => {
    const session = getSession()
    if (!session || `Bearer ${session.accessToken}` !== sentAuthorization) return session

    try {
      const tokens = await base
        .post('auth/refresh', { json: { refreshToken: session.refreshToken }, retry: 0 })
        .json(tokensSchema)
      const fresh = { ...session, ...tokens }
      setSession(fresh)
      return fresh
    } catch (error) {
      if (isHTTPError(error) && error.response.status < 500) clearSession()
      return undefined
    }
  })
}

export const api = base.extend({
  hooks: {
    beforeRequest: [setToken],
    beforeRetry: [setToken],
    afterResponse: [
      async ({ request, response, options }) => {
        if (response.status !== 401 || !getSession()) return undefined
        if (options.context.tokenRetried) return clearSession()

        options.context.tokenRetried = true

        if (!(await refreshSession(request.headers.get('Authorization')))) return undefined

        return ky.retry()
      },
    ],
  },
})

const apiErrorSchema = apiSchema('Error', z.object({ message: z.string().check(z.minLength(1)) }))

export function getErrorMessage(error: unknown) {
  if (isNetworkError(error)) return 'Check your internet connection and try again.'
  if (isTimeoutError(error)) return 'The server took too long to respond. Try again.'
  if (isHTTPError(error)) {
    const parsed = apiErrorSchema.safeParse(error.data)
    if (parsed.success) return parsed.data.message
  }
  return 'Something went wrong. Try again.'
}
