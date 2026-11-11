import { HttpResponse, delay, http } from 'msw'
import { expect, onTestFinished, test, vi } from 'vitest'

import { api, getErrorMessage } from '@/lib/api'
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
  const refreshBodies: unknown[] = []
  worker.use(
    echoWithToken('access-2'),
    http.post('*/auth/refresh', async ({ request }) => {
      refreshBodies.push(await request.json())
      return HttpResponse.json({ accessToken: 'access-2', refreshToken: 'refresh-2' })
    }),
  )
  setSession({ accessToken: 'access-1', refreshToken: 'refresh-1', userId: 1 })

  const responses = await Promise.all([
    api.get('notes/1').json(),
    api.patch('notes/2', { json: { title: 'Milk' } }).json(),
  ])

  expect(responses).toEqual([
    { method: 'GET', body: null },
    { method: 'PATCH', body: { title: 'Milk' } },
  ])
  expect(refreshBodies).toEqual([{ refreshToken: 'refresh-1' }])
  expect(getSession()).toEqual({ accessToken: 'access-2', refreshToken: 'refresh-2', userId: 1 })
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
  setSession({ accessToken: 'access-1', refreshToken: 'refresh-1', userId: 1 })

  // Without delay: 0 the test waits for the backoff
  const response = api.get('notes/1', { retry: { limit: 2, statusCodes: [503], delay: () => 0 } })

  await expect(response.json()).resolves.toEqual({ method: 'GET', body: null })
  expect(getSession()).toEqual({ accessToken: 'access-2', refreshToken: 'refresh-2', userId: 1 })
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
  setSession({ accessToken: 'access-1', refreshToken: 'refresh-1', userId: 1 })

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
  setSession({ accessToken: 'access-1', refreshToken: 'refresh-1', userId: 1 })

  await expect(api.get('notes/1').json()).rejects.toMatchObject({ response: { status: 401 } })
  expect(getSession()).toBeUndefined()
})

test('a refresh that fails on a server error keeps the session', async () => {
  worker.use(
    echoWithToken('access-2'),
    http.post('*/auth/refresh', () => HttpResponse.json({ message: 'Down' }, { status: 500 })),
  )
  setSession({ accessToken: 'access-1', refreshToken: 'refresh-1', userId: 1 })

  await expect(api.get('notes/1').json()).rejects.toMatchObject({ response: { status: 401 } })
  expect(getSession()).toEqual({ accessToken: 'access-1', refreshToken: 'refresh-1', userId: 1 })
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
  setSession({ accessToken: 'access-1', refreshToken: 'refresh-1', userId: 1 })
  const otherTab = Promise.withResolvers<void>()
  const otherTabRefresh = navigator.locks.request('session-refresh', () => otherTab.promise)

  const response = api.get('notes/1').json()
  await expect.poll(async () => (await navigator.locks.query()).pending?.length).toBe(1)
  setSession({ accessToken: 'access-2', refreshToken: 'refresh-2', userId: 1 })
  otherTab.resolve()
  await otherTabRefresh

  await expect(response).resolves.toEqual({ method: 'GET', body: null })
  expect(refreshes).toBe(0)
})

function errorOf(request: Promise<unknown>) {
  return request.then(
    () => expect.unreachable('The request did not fail'),
    (error: unknown) => error,
  )
}

test('a request that takes too long gets a timeout message', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  onTestFinished(() => void vi.useRealTimers())
  const reachedServer = Promise.withResolvers<void>()
  worker.use(
    http.get('*/notes/1', () => {
      reachedServer.resolve()
      return delay('infinite')
    }),
  )

  const error = errorOf(api.get('notes/1').json())
  // The request reaches the handler in real time: timing out first leaks it into the next test
  await reachedServer.promise
  await vi.advanceTimersByTimeAsync(15_000)

  expect(getErrorMessage(await error)).toBe('The server took too long to respond. Try again.')
})

test('an API error with an empty message gets the general message', async () => {
  worker.use(http.post('*/notes', () => HttpResponse.json({ message: '' }, { status: 400 })))

  const error = await errorOf(api.post('notes').json())

  expect(getErrorMessage(error)).toBe('Something went wrong. Try again.')
})
