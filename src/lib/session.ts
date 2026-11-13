import { z } from 'zod/mini'

import { apiSchema } from '@/lib/api-schema'
import { stored } from '@/lib/stored'

export const SESSION_KEY = 'session'

export const tokensSchema = apiSchema(
  'Tokens',
  z.object({ accessToken: z.string(), refreshToken: z.string() }),
)

const sessionSchema = z.extend(tokensSchema, { userId: z.number() })

export type Session = z.infer<typeof sessionSchema>

const session = stored(SESSION_KEY, sessionSchema)

export const getSession = session.get
export const subscribeSession = session.subscribe

export function setSession(next: Session) {
  session.set(next)
}

export function clearSession() {
  session.set(undefined)
}
