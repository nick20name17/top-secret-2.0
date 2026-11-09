import { useQueryClient } from '@tanstack/react-query'
import { Outlet, createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

import { meQuery } from '@/features/auth/queries'
import { getSession, subscribeSession } from '@/lib/session'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ context, location }) => {
    const toLogin = redirect({ to: '/login', search: { redirect: location.href }, replace: true })
    if (!getSession()) throw toLogin
    try {
      return { user: await context.queryClient.query(meQuery()) }
    } catch (error) {
      // api clears a session it cannot refresh: send the user to sign in, not to an error page
      if (!getSession()) throw toLogin
      throw error
    }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  const router = useRouter()
  const queryClient = useQueryClient()

  // Sign-out here or in another tab: beforeLoad sends the user to sign in
  useEffect(
    () =>
      subscribeSession(() => {
        // A token refresh writes the session too
        if (getSession()) return
        queryClient.removeQueries()
        void router.invalidate()
      }),
    [queryClient, router],
  )

  return <Outlet />
}
