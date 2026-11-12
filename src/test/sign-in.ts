import { HttpResponse, http } from 'msw'

import { setSession } from '@/lib/session'
import user from '@/test/fixtures/users-1.json'
import { apiUrl, worker } from '@/test/msw'

export function signIn() {
  setSession({ accessToken: 'access-1', refreshToken: 'refresh-1', userId: user.id })
  worker.use(http.get(`${apiUrl}/auth/me`, () => HttpResponse.json(user)))
}
