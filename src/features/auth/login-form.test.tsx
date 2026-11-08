import { expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'

import { LoginForm, type LoginValues } from '@/features/auth/login-form'

test('shows an error under each empty field on submit', async () => {
  const onSubmit = vi.fn<(values: LoginValues) => void>()
  await render(<LoginForm onSubmit={onSubmit} />)

  await userEvent.click(page.getByRole('button', { name: 'Sign in' }))

  await expect.element(page.getByText('Enter a valid email')).toBeVisible()
  await expect.element(page.getByText('Password must be at least 8 characters')).toBeVisible()
  expect(onSubmit).not.toHaveBeenCalled()
})

test('submits the entered email and password', async () => {
  const onSubmit = vi.fn<(values: LoginValues) => void>()
  await render(<LoginForm onSubmit={onSubmit} />)

  await userEvent.fill(page.getByLabelText('Email'), 'ada@example.com')
  await userEvent.fill(page.getByLabelText('Password'), 'correct-horse')
  await userEvent.click(page.getByRole('button', { name: 'Sign in' }))

  await expect
    .poll(() => onSubmit.mock.lastCall)
    .toEqual([{ email: 'ada@example.com', password: 'correct-horse' }])
})

test('focuses the first invalid field on submit', async () => {
  await render(<LoginForm onSubmit={vi.fn<(values: LoginValues) => void>()} />)

  await userEvent.fill(page.getByLabelText('Email'), 'ada@example.com')
  await userEvent.click(page.getByRole('button', { name: 'Sign in' }))

  await expect.element(page.getByLabelText('Password')).toHaveFocus()
})
