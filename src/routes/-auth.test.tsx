import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { page, userEvent } from 'vitest/browser'

import { APP_NAME } from '@/lib/app-name'
import { setSession } from '@/lib/session'
import { worker } from '@/test/msw'
import { renderRoute } from '@/test/render-route'

const apiUrl = import.meta.env.VITE_API_URL

const user = { firstName: 'Emily', lastName: 'Johnson', email: 'emily@example.com' }

function signIn() {
  setSession({ accessToken: 'access-1', refreshToken: 'refresh-1' })
  worker.use(http.get(`${apiUrl}/auth/me`, () => HttpResponse.json(user)))
}

test('opening the profile signed out shows the sign-in form', async () => {
  await renderRoute('/profile')

  await expect.element(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

test('signing in opens the page the user first asked for', async () => {
  let credentials: unknown
  worker.use(
    http.post(`${apiUrl}/auth/login`, async ({ request }) => {
      credentials = await request.json()
      return HttpResponse.json({ ...user, accessToken: 'access-1', refreshToken: 'refresh-1' })
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

    await expect.element(page.getByRole('heading', { name: APP_NAME })).toBeVisible()
  },
)

test('a session the API no longer accepts opens the sign-in page, not an error', async () => {
  setSession({ accessToken: 'access-1', refreshToken: 'refresh-1' })
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
