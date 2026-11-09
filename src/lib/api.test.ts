import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'

import { api } from '@/lib/api'
import { getSession, setSession } from '@/lib/session'
import { worker } from '@/test/msw'

function echoWithToken(accessToken: string) {
  return http.all('*/notes/:id', async ({ request }) => {
    if (request.headers.get('Authorization') !== `Bearer ${accessToken}`) {
      return HttpResponse.json({ message: 'Invalid/Expired Token!' }, { status: 401 })
    }
    const body = request.method === 'GET' ? null : await request.json()
    return HttpResponse.json({ method: request.method, body })
  })
}

test('requests that get a 401 at the same time share one refresh, then retry with their body', async () => {
  let refreshes = 0
  worker.use(
    echoWithToken('access-2'),
    http.post('*/auth/refresh', async ({ request }) => {
      refreshes += 1
      expect(await request.json()).toEqual({ refreshToken: 'refresh-1' })
      return HttpResponse.json({ accessToken: 'access-2', refreshToken: 'refresh-2' })
    }),
  )
  setSession({ accessToken: 'access-1', refreshToken: 'refresh-1' })

  const responses = await Promise.all([
    api.get('notes/1').json(),
    api.patch('notes/2', { json: { title: 'Milk' } }).json(),
  ])

  expect(responses).toEqual([
    { method: 'GET', body: null },
    { method: 'PATCH', body: { title: 'Milk' } },
  ])
  expect(refreshes).toBe(1)
  expect(getSession()).toEqual({ accessToken: 'access-2', refreshToken: 'refresh-2' })
})

test('a refresh that fails signs the user out and the request fails with its 401', async () => {
  worker.use(
    echoWithToken('access-2'),
    http.post('*/auth/refresh', () =>
      HttpResponse.json({ message: 'Invalid refresh token' }, { status: 403 }),
    ),
  )
  setSession({ accessToken: 'access-1', refreshToken: 'refresh-1' })

  await expect(api.get('notes/1').json()).rejects.toMatchObject({ response: { status: 401 } })
  expect(getSession()).toBeUndefined()
})

test('a 401 on a retry after a server error refreshes instead of signing out', async () => {
  worker.use(
    http.get('*/notes/1', () => HttpResponse.json({ message: 'Down' }, { status: 503 }), {
      once: true,
    }),
    echoWithToken('access-2'),
    http.post('*/auth/refresh', () =>
      HttpResponse.json({ accessToken: 'access-2', refreshToken: 'refresh-2' }),
    ),
  )
  setSession({ accessToken: 'access-1', refreshToken: 'refresh-1' })

  // Without delay: 0 the test waits for the backoff
  const response = api.get('notes/1', { retry: { limit: 2, statusCodes: [503], delay: () => 0 } })

  await expect(response.json()).resolves.toEqual({ method: 'GET', body: null })
  expect(getSession()).toEqual({ accessToken: 'access-2', refreshToken: 'refresh-2' })
})

test('a 401 that arrives after another request refreshed retries without a second refresh', async () => {
  const lateResponse = Promise.withResolvers<void>()
  let refreshes = 0
  worker.use(
    http.patch(
      '*/notes/2',
      async () => {
        await lateResponse.promise
        return HttpResponse.json({ message: 'Invalid/Expired Token!' }, { status: 401 })
      },
      { once: true },
    ),
    echoWithToken('access-2'),
    http.post('*/auth/refresh', () => {
      refreshes += 1
      return HttpResponse.json({ accessToken: 'access-2', refreshToken: 'refresh-2' })
    }),
  )
  setSession({ accessToken: 'access-1', refreshToken: 'refresh-1' })

  const late = api.patch('notes/2', { json: { title: 'Milk' } }).json()
  await expect(api.get('notes/1').json()).resolves.toEqual({ method: 'GET', body: null })
  lateResponse.resolve()

  await expect(late).resolves.toEqual({ method: 'PATCH', body: { title: 'Milk' } })
  expect(refreshes).toBe(1)
})

test('a 401 with the refreshed token signs the user out', async () => {
  worker.use(
    echoWithToken('access-3'),
    http.post('*/auth/refresh', () =>
      HttpResponse.json({ accessToken: 'access-2', refreshToken: 'refresh-2' }),
    ),
  )
  setSession({ accessToken: 'access-1', refreshToken: 'refresh-1' })

  await expect(api.get('notes/1').json()).rejects.toMatchObject({ response: { status: 401 } })
  expect(getSession()).toBeUndefined()
})

test('a refresh that fails on a server error keeps the session', async () => {
  worker.use(
    echoWithToken('access-2'),
    http.post('*/auth/refresh', () => HttpResponse.json({ message: 'Down' }, { status: 500 })),
  )
  setSession({ accessToken: 'access-1', refreshToken: 'refresh-1' })

  await expect(api.get('notes/1').json()).rejects.toMatchObject({ response: { status: 401 } })
  expect(getSession()).toEqual({ accessToken: 'access-1', refreshToken: 'refresh-1' })
})

test('a 401 while another tab refreshes waits for it and refreshes no more', async () => {
  let refreshes = 0
  worker.use(
    echoWithToken('access-2'),
    http.post('*/auth/refresh', () => {
      refreshes += 1
      return HttpResponse.json({ accessToken: 'access-3', refreshToken: 'refresh-3' })
    }),
  )
  setSession({ accessToken: 'access-1', refreshToken: 'refresh-1' })
  const otherTab = Promise.withResolvers<void>()
  const otherTabRefresh = navigator.locks.request('session-refresh', () => otherTab.promise)

  const response = api.get('notes/1').json()
  await expect.poll(async () => (await navigator.locks.query()).pending?.length).toBe(1)
  setSession({ accessToken: 'access-2', refreshToken: 'refresh-2' })
  otherTab.resolve()
  await otherTabRefresh

  await expect(response).resolves.toEqual({ method: 'GET', body: null })
  expect(refreshes).toBe(0)
})
