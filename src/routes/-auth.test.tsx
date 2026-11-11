import { HttpResponse, http } from 'msw'
import { expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'

import { SESSION_KEY, setSession } from '@/lib/session'
// Real responses: GET https://dummyjson.com/users/1 (auth/me returns the same user),
// POST auth/login from https://dummyjson.com/docs/auth
import login from '@/test/fixtures/auth-login.json'
import products from '@/test/fixtures/products.json'
import user from '@/test/fixtures/users-1.json'
import otherUser from '@/test/fixtures/users-2.json'
import { worker } from '@/test/msw'
import { renderRoute } from '@/test/render-route'
import { signIn } from '@/test/sign-in'

const apiUrl = import.meta.env.VITE_API_URL

test('signing in opens the page the user first asked for', async () => {
  let credentials: unknown
  worker.use(
    http.post(`${apiUrl}/auth/login`, async ({ request }) => {
      credentials = await request.json()
      return HttpResponse.json(login)
    }),
  )
  await renderRoute('/profile')

  await userEvent.fill(page.getByLabelText('Username'), ' emilys ')
  await userEvent.fill(page.getByLabelText('Password'), 'emilyspass')
  await userEvent.click(page.getByRole('button', { name: 'Sign in' }))

  await expect.element(page.getByRole('heading', { name: 'Emily Johnson' })).toBeVisible()
  expect(credentials).toEqual({ username: 'emilys', password: 'emilyspass' })
})

test('wrong credentials show the API message in the form', async () => {
  worker.use(
    http.post(`${apiUrl}/auth/login`, () =>
      HttpResponse.json({ message: 'Invalid credentials' }, { status: 400 }),
    ),
  )
  await renderRoute('/login')

  await userEvent.fill(page.getByLabelText('Username'), 'emilys')
  await userEvent.fill(page.getByLabelText('Password'), 'wrong')
  await userEvent.click(page.getByRole('button', { name: 'Sign in' }))

  await expect.element(page.getByRole('alert')).toHaveTextContent('Invalid credentials')
})

test('signing out opens the sign-in page', async () => {
  signIn()
  await renderRoute('/profile')

  await userEvent.click(page.getByRole('button', { name: 'Sign out' }))

  await expect.element(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

// %09 is a tab: browsers drop it, so /<tab>/evil.example reads as //evil.example
test.each(['//evil.example', '/%5C/evil.example', '/%09/evil.example'])(
  'a signed-in user sent to sign in with redirect=%s stays on this site',
  async (redirect) => {
    signIn()
    await renderRoute(`/login?redirect=${redirect}`)

    await expect.element(page.getByRole('heading', { name: 'Spa 2' })).toBeVisible()
  },
)

test('a session the API no longer accepts opens the sign-in page, not an error', async () => {
  setSession({ accessToken: 'access-1', refreshToken: 'refresh-1', userId: 1 })
  worker.use(
    http.get(`${apiUrl}/auth/me`, () =>
      HttpResponse.json({ message: 'Invalid/Expired Token!' }, { status: 401 }),
    ),
    http.post(`${apiUrl}/auth/refresh`, () =>
      HttpResponse.json({ message: 'Invalid refresh token' }, { status: 403 }),
    ),
  )
  await renderRoute('/profile')

  await expect.element(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

test('signing out in another tab opens the sign-in page', async () => {
  signIn()
  await renderRoute('/profile')
  await expect.element(page.getByRole('heading', { name: 'Emily Johnson' })).toBeVisible()

  // The other tab's removeItem fires a storage event in this one
  localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new StorageEvent('storage', { key: SESSION_KEY }))

  await expect.element(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

// access-1 is the first user's token, access-2 the second user's
function signInWithTwoUsers() {
  const usersByToken: Record<string, typeof user> = {
    'Bearer access-1': user,
    'Bearer access-2': otherUser,
  }
  setSession({ accessToken: 'access-1', refreshToken: 'refresh-1', userId: 1 })
  worker.use(
    http.get(`${apiUrl}/auth/me`, ({ request }) =>
      HttpResponse.json(usersByToken[String(request.headers.get('Authorization'))]),
    ),
  )
}

function signInAsSecondUserInAnotherTab() {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ accessToken: 'access-2', refreshToken: 'refresh-2', userId: 2 }),
  )
  window.dispatchEvent(new StorageEvent('storage', { key: SESSION_KEY }))
}

test('signing in as another user in another tab shows that user', async () => {
  signInWithTwoUsers()
  await renderRoute('/profile')
  await expect.element(page.getByRole('heading', { name: 'Emily Johnson' })).toBeVisible()

  signInAsSecondUserInAnotherTab()

  await expect.element(page.getByRole('heading', { name: 'Michael Williams' })).toBeVisible()
})

test('after signing out, a user who signs in in another tab sees their own profile', async () => {
  signInWithTwoUsers()
  await renderRoute('/profile')
  await userEvent.click(page.getByRole('button', { name: 'Sign out' }))
  await expect.element(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()

  signInAsSecondUserInAnotherTab()
  await userEvent.click(page.getByRole('link', { name: 'Profile' }))

  await expect.element(page.getByRole('heading', { name: 'Michael Williams' })).toBeVisible()
})

test('a token refresh does not load the user again', async () => {
  let userRequests = 0
  setSession({ accessToken: 'access-1', refreshToken: 'refresh-1', userId: 1 })
  worker.use(
    http.get(`${apiUrl}/auth/me`, () => {
      userRequests += 1
      return HttpResponse.json(user)
    }),
  )
  await renderRoute('/profile')
  await expect.element(page.getByRole('heading', { name: 'Emily Johnson' })).toBeVisible()

  setSession({ accessToken: 'access-2', refreshToken: 'refresh-2', userId: 1 })
  // Signing out gives a second request the time to arrive
  await userEvent.click(page.getByRole('button', { name: 'Sign out' }))

  await expect.element(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  expect(userRequests).toBe(1)
})

test('a signed-in user sent to sign in opens the page from the redirect', async () => {
  signIn()
  worker.use(http.get(`${apiUrl}/products`, () => HttpResponse.json(products)))
  await renderRoute('/login?redirect=/products')

  await expect.element(page.getByRole('heading', { name: 'Products' })).toBeVisible()
})

test('a broken stored session opens the sign-in page', async () => {
  localStorage.setItem(SESSION_KEY, '{broken')
  await renderRoute('/profile')

  await expect.element(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

test('an API error while signed in shows the error page and keeps the session', async () => {
  setSession({ accessToken: 'access-1', refreshToken: 'refresh-1', userId: 1 })
  worker.use(
    http.get(`${apiUrl}/auth/me`, () => HttpResponse.json({ message: 'Gone' }, { status: 404 })),
  )
  await renderRoute('/profile')

  await expect.element(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible()
  vi.mocked(console.error).mockClear()
})

test('signing in without a redirect opens the home page', async () => {
  worker.use(http.post(`${apiUrl}/auth/login`, () => HttpResponse.json(login)))
  await renderRoute('/login')

  await userEvent.fill(page.getByLabelText('Username'), 'emilys')
  await userEvent.fill(page.getByLabelText('Password'), 'emilyspass')
  await userEvent.click(page.getByRole('button', { name: 'Sign in' }))

  await expect.element(page.getByRole('heading', { name: 'Spa 2' })).toBeVisible()
})

test('empty fields show what to fill in and send nothing', async () => {
  let requests = 0
  worker.use(
    http.post(`${apiUrl}/auth/login`, () => {
      requests += 1
      return HttpResponse.json({ message: 'Unexpected' }, { status: 400 })
    }),
  )
  await renderRoute('/login')

  await userEvent.fill(page.getByLabelText('Username'), '   ')
  await userEvent.click(page.getByRole('button', { name: 'Sign in' }))

  await expect.element(page.getByText('Enter your username')).toBeVisible()
  await expect.element(page.getByText('Enter your password')).toBeVisible()
  expect(requests).toBe(0)
})

test('a network failure while signing in asks to check the connection', async () => {
  worker.use(http.post(`${apiUrl}/auth/login`, () => HttpResponse.error()))
  await renderRoute('/login')

  await userEvent.fill(page.getByLabelText('Username'), 'emilys')
  await userEvent.fill(page.getByLabelText('Password'), 'emilyspass')
  await userEvent.click(page.getByRole('button', { name: 'Sign in' }))

  await expect
    .element(page.getByRole('alert'))
    .toHaveTextContent('Check your internet connection and try again.')
})
