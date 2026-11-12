import type { QueryClient } from '@tanstack/react-query'
import { redirect } from '@tanstack/react-router'

import { meQuery } from '@/features/auth/queries'
import { getSession } from '@/lib/session'

// A route's beforeLoad: sends a user without a valid session to sign in
export async function requireSession({
  context,
  location,
}: {
  context: { queryClient: QueryClient }
  location: { href: string }
}) {
  const toLogin = redirect({ to: '/login', search: { redirect: location.href }, replace: true })
  if (!getSession()) throw toLogin
  try {
    await context.queryClient.query(meQuery())
  } catch (error) {
    // api cleared a session it could not refresh
    if (!getSession()) throw toLogin
    throw error
  }
}
