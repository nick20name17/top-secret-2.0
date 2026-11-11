import { z } from 'zod/mini'

import { apiSchema } from '@/lib/api-schema'

export const SESSION_KEY = 'session'

export const tokensSchema = apiSchema(
  'Tokens',
  z.object({ accessToken: z.string(), refreshToken: z.string() }),
)

// userId tells a token refresh from another user signing in
export const sessionSchema = z.extend(tokensSchema, { userId: z.number() })

export type Session = z.infer<typeof sessionSchema>

const listeners = new Set<() => void>()

export function getSession(): Session | undefined {
  const stored = localStorage.getItem(SESSION_KEY)
  if (!stored) return undefined
  try {
    const parsed = sessionSchema.safeParse(JSON.parse(stored))
    return parsed.success ? parsed.data : undefined
  } catch {
    return undefined
  }
}

export function setSession(session: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  for (const listener of listeners) listener()
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  for (const listener of listeners) listener()
}

export function subscribeSession(listener: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key === SESSION_KEY || event.key === null) listener()
  }
  listeners.add(listener)
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}
